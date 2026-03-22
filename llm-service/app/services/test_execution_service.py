"""
TestExecutionService
====================

Executes the generated Selenium scripts for every test case on a page
and persists the results to the test_execution table.

Execution model
---------------
  • Scripts live on TestScenario.script (one script per scenario).
  • A TestExecution record is created per TestCase that belongs to
    that scenario — matching the table shape:
      id, page_id, test_scenario_id, test_case_id, test_suite_id,
      status, logs, executed_on, executed_by

  • The script is executed once per scenario; every test case under
    that scenario shares the same execution run and log, with its
    own individual TestExecution row.

  • status values:  "passed" | "failed" | "error" | "skipped"

Execution flow
--------------
  For each scenario on the page:
    1. Skip if scenario.script is empty.
    2. Run the script in a subprocess (reusing execute_test_script logic).
    3. Capture stdout + stderr as the log string.
    4. Determine pass/fail via LLM → keyword fallback.
    5. Upsert one TestExecution row per TestCase in the scenario.
       (Upsert = update if a row for this test_case_id already exists,
        otherwise insert — so re-runs don't accumulate duplicates.)

Dependencies
------------
  Relies on the caller (WorkerService.process_test_execution) to supply
  page ORM object and requested_by. Does NOT import worker_service.
"""

import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime

from app.config.database import SessionLocal
from app.llm.llm_wrapper import LLMWrapper
from app.llm.prompt_manager import PromptManager
from shared_orm.models.test_scenario import TestScenario
from shared_orm.models.test_case import TestCase
from shared_orm.models.test_execution import TestExecution
from app.services.test_credential_service import TestCredentialService


class TestExecutionService:

    def __init__(self, llm, prompt_manager, logger):
        self.llm            = llm
        self.prompt_manager = prompt_manager
        self.logger         = logger

    # -----------------------------------------------------------------------
    # ENTRY POINT — called via run_in_executor from WorkerService
    # -----------------------------------------------------------------------

    def execute_page(
        self,
        page,
        requested_by: int,
        scenario_id: int = None,   # None = all scenarios, int = targeted
        test_suite_id: int = None, # optional grouping handle
    ):
        """
        Execute all (or one) scenario scripts for a page and persist results.

        Args:
            page:          ORM Page object (page_source populated).
            requested_by:  User ID for executed_by column.
            scenario_id:   If set, only execute this specific scenario.
            test_suite_id: Optional test suite FK to stamp on each row.
        """
        with SessionLocal() as db:
            query = db.query(TestScenario).filter(TestScenario.page_id == page.id)
            if scenario_id is not None:
                query = query.filter(TestScenario.id == scenario_id)

            scenarios = query.all()

            if not scenarios:
                self.logger.warning(
                    f"[EXEC] No scenarios found | page_id={page.id} — skipping"
                )
                return

            for scenario in scenarios:
                self._execute_scenario(
                    db=db,
                    scenario=scenario,
                    page_id=page.id,
                    test_suite_id=test_suite_id,
                    requested_by=requested_by,
                )

            db.commit()
            self.logger.info(
                f"[EXEC] All executions committed | page_id={page.id}"
            )

    # -----------------------------------------------------------------------
    # SCENARIO-LEVEL EXECUTION
    # -----------------------------------------------------------------------

    def _execute_scenario(self, db, scenario, page_id, test_suite_id, requested_by):
        """
        Run a scenario's script once per TestCase, injecting that single
        test case's resolved data via __TEST_CASE__.  Each subprocess run
        executes exactly one test case — no internal loops in the script.
        """
        if not scenario.script or not scenario.script.strip():
            self.logger.warning(
                f"[EXEC] No script on scenario_id={scenario.id} — skipping"
            )
            self._persist_results(
                db=db,
                scenario=scenario,
                page_id=page_id,
                test_suite_id=test_suite_id,
                requested_by=requested_by,
                status="skipped",
                logs="Script not generated — execution skipped.",
            )
            return

        self.logger.info(
            f"[EXEC] Running | scenario_id={scenario.id} title='{scenario.title}'"
        )

        test_cases = db.query(TestCase).filter(
            TestCase.test_scenario_id == scenario.id,
            TestCase.page_id == page_id,
        ).all()

        # No test cases at all — run the script bare (legacy fallback)
        if not test_cases:
            result = self.execute_test_script(scenario.script)
            log_parts = [result.get("output", ""), result.get("error", "")]
            logs   = "\n".join(p for p in log_parts if p).strip() or "(no output)"
            status = "error" if result.get("success") is None else ("passed" if result["success"] else "failed")
            self.logger.info(f"[EXEC] Result | scenario_id={scenario.id} status={status}")
            self._persist_results(
                db=db, scenario=scenario, page_id=page_id,
                test_suite_id=test_suite_id, requested_by=requested_by,
                status=status, logs=logs,
            )
            return

        # ── Resolve credentials ONCE for the whole scenario ─────────────────
        # Avoids re-querying the DB credential table on every test case.
        resolved_credentials: dict[str, dict] = {}
        try:
            
            cred_service = TestCredentialService(llm=self.llm, logger=self.logger)
            for tc in test_cases:
                raw_test_data = (tc.data or {}).get("test_data", {})
                if raw_test_data:
                    resolved_credentials[tc.id] = cred_service.resolve(
                        page_id, raw_test_data
                    )
        except Exception as e:
            self.logger.warning(f"[EXEC] Credential resolution failed: {e} — using raw test_data")

        # ── Run the script ONCE per test case ────────────────────────────────
        for tc in test_cases:
            try:
                self.logger.info(
                    f"[EXEC] Running tc_id={tc.id} | scenario_id={scenario.id} | '{tc.title}'"
                )

                tc_data = tc.data or {}
                if isinstance(tc_data, str):
                    try:
                        tc_data = json.loads(tc_data)
                    except Exception:
                        tc_data = {"value": tc_data}

                # Replace raw test_data with resolved values (real credentials)
                resolved_td = resolved_credentials.get(tc.id)
                if resolved_td:
                    tc_data = {**tc_data, "test_data": resolved_td}

                # Build the single-test-case payload the script reads at runtime
                tc_payload = {
                    "name":             tc.title,
                    "steps":            tc_data.get("steps", []),
                    "selectors":        tc_data.get("selectors", {}),
                    "test_data":        tc_data.get("test_data", {}),
                    "expected_outcome": tc.expected_outcome or {},
                    "validation":       tc.validation or "",
                    "is_valid":         tc.is_valid,
                    "is_valid_default": tc.is_valid_default,
                }

                # Inject __TEST_CASE__ as the first lines of the script.
                # The script reads from this variable — it does NOT loop internally.
                header = (
                    "import json\n"
                    f"__TEST_CASE__ = {repr(tc_payload)}\n\n"
                )
                script_with_context = header + scenario.script

                result      = self.execute_test_script(script_with_context)
                log_parts   = [result.get("output", ""), result.get("error", "")]
                logs        = "\n".join(p for p in log_parts if p).strip() or "(no output)"
                status      = (
                    "error"  if result.get("success") is None else
                    "passed" if result["success"] else "failed"
                )

                self.logger.info(
                    f"[EXEC] TC Result | scenario_id={scenario.id} "
                    f"tc_id={tc.id} status={status}"
                )

                self._upsert_execution(
                    db=db,
                    page_id=page_id,
                    scenario=scenario,
                    test_case=tc,
                    test_suite_id=test_suite_id,
                    requested_by=requested_by,
                    status=status,
                    logs=logs,
                    executed_on=datetime.utcnow(),
                )

            except Exception as e:
                self.logger.error(
                    f"[EXEC] Execution failed for tc_id={getattr(tc, 'id', None)}: {e}"
                )
                try:
                    self._upsert_execution(
                        db=db, page_id=page_id, scenario=scenario,
                        test_case=tc, test_suite_id=test_suite_id,
                        requested_by=requested_by, status="error",
                        logs=str(e), executed_on=datetime.utcnow(),
                    )
                except Exception:
                    pass

    # -----------------------------------------------------------------------
    # PERSIST — upsert one TestExecution row per TestCase
    # -----------------------------------------------------------------------

    def _persist_results(
        self,
        db,
        scenario,
        page_id: int,
        test_suite_id,
        requested_by: int,
        status: str,
        logs: str,
    ):
        """
        Upsert TestExecution rows — one per TestCase in this scenario.
        On re-run the existing row is updated so the table doesn't grow
        unbounded with duplicate history rows.
        """
        test_cases = db.query(TestCase).filter(
            TestCase.test_scenario_id == scenario.id,
            TestCase.page_id          == page_id,
        ).all()

        if not test_cases:
            self.logger.warning(
                f"[EXEC] No test cases for scenario_id={scenario.id} — "
                "writing one execution row with test_case_id=None"
            )
            self._upsert_execution(
                db=db,
                page_id=page_id,
                scenario=scenario,
                test_case=None,
                test_suite_id=test_suite_id,
                requested_by=requested_by,
                status=status,
                logs=logs,
            )
            return

        executed_on = datetime.utcnow()

        for tc in test_cases:
            self._upsert_execution(
                db=db,
                page_id=page_id,
                scenario=scenario,
                test_case=tc,
                test_suite_id=test_suite_id,
                requested_by=requested_by,
                status=status,
                logs=logs,
                executed_on=executed_on,
            )

    def _upsert_execution(
        self,
        db,
        page_id: int,
        scenario,
        test_case,        # TestCase ORM object or None
        test_suite_id,
        requested_by: int,
        status: str,
        logs: str,
        executed_on: datetime = None,
    ):
        """
        Update the existing TestExecution row for this test_case if one
        exists, otherwise insert a new row.
        """
        executed_on = executed_on or datetime.utcnow()
        tc_id       = test_case.id if test_case else None

        existing = (
            db.query(TestExecution)
            .filter(
                TestExecution.page_id          == page_id,
                TestExecution.test_scenario_id == scenario.id,
                TestExecution.test_case_id     == tc_id,
            )
            .first()
        )

        if existing:
            # Update in place — re-run overwrites the previous result
            existing.status      = status
            existing.logs        = logs
            existing.executed_on = executed_on
            existing.executed_by = requested_by
            if test_suite_id is not None:
                existing.test_suite_id = test_suite_id
            self.logger.debug(
                f"[EXEC] Updated execution | "
                f"exec_id={existing.id} tc_id={tc_id} status={status}"
            )
        else:
            db.add(TestExecution(
                page_id          = page_id,
                test_scenario_id = scenario.id,
                test_case_id     = tc_id,
                test_suite_id    = test_suite_id,
                status           = status,
                logs             = logs,
                executed_on      = executed_on,
                executed_by      = requested_by,
            ))
            self.logger.debug(
                f"[EXEC] Inserted execution | "
                f"scenario_id={scenario.id} tc_id={tc_id} status={status}"
            )

    # -----------------------------------------------------------------------
    # SCRIPT EXECUTION  (from existing execute_test_script logic)
    # -----------------------------------------------------------------------

    def execute_test_script(self, script: str) -> dict:
        """
        Write the script to a temp file and run it in a subprocess.

        Returns:
            dict with keys:
              success (bool)  — True=passed, False=failed, None=error
              output  (str)   — stdout
              error   (str)   — stderr or exception message
        """
        temp_file = None
        try:
            if not script.strip():
                return {"success": None, "output": "", "error": "Empty test script"}

            with tempfile.NamedTemporaryFile(
                mode="w", delete=False, suffix=".py"
            ) as f:
                f.write(script)
                temp_file = f.name
                
            env = os.environ.copy()
            env["PYTHONPATH"] = os.getcwd()

            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=120,   # 2 min — matches captcha_wait_time
                env=env
            )

            combined_output = result.stdout + result.stderr
            test_passed     = self._analyze_test_output(combined_output, result.returncode)

            return {
                "success": test_passed,
                "output":  result.stdout,
                "error":   result.stderr,
            }

        except subprocess.TimeoutExpired:
            self.logger.warning("[EXEC] Script execution timed out")
            return {"success": None, "output": "", "error": "Test execution timed out"}

        except Exception as e:
            self.logger.error(f"[EXEC] Script execution exception: {e}")
            return {"success": None, "output": "", "error": str(e)}

        finally:
            if temp_file and os.path.exists(temp_file):
                os.remove(temp_file)

    # -----------------------------------------------------------------------
    # OUTPUT ANALYSIS — LLM with keyword fallback
    # -----------------------------------------------------------------------

    def _analyze_test_output(self, combined_output: str, return_code: int) -> bool:
        """
        Determine pass/fail from script output.
        Tries LLM first; falls back to keyword + return-code analysis.
        """
        # ── LLM analysis (primary) ───────────────────────────────────────────
        try:
            llm_result = self._analyze_test_output_with_llm(combined_output, return_code)
            if llm_result is not None:
                self.logger.debug(
                    f"[EXEC] LLM result: {'passed' if llm_result else 'failed'}"
                )
                return llm_result
        except Exception as e:
            self.logger.warning(
                f"[EXEC] LLM analysis failed: {e} — falling back to keywords"
            )

        # ── Keyword fallback ─────────────────────────────────────────────────
        output_lower = combined_output.lower()

        success_indicators = [
            "pass:", "passed:", "test passed", "success:",
            "all tests passed", "validation successful",
            "test completed successfully", "test completed:",
        ]
        failure_indicators = [
            "[error] fail", "fail:", "failed:", "test failed",
            "assertion failed", "assertionerror",
            "validation result: false", "valid: false",
            "does not display correct", "does not match expected",
            "element not found", "timeout", "exception:", "[error]", "failed",
        ]

        for indicator in success_indicators:
            if indicator in output_lower:
                self.logger.debug(f"[EXEC] Passed via indicator: '{indicator}'")
                return True

        for indicator in failure_indicators:
            if indicator in output_lower:
                self.logger.debug(f"[EXEC] Failed via indicator: '{indicator}'")
                return False

        # ── Return code fallback ─────────────────────────────────────────────
        passed = (return_code == 0)
        self.logger.debug(
            f"[EXEC] Result via return code {return_code}: "
            f"{'passed' if passed else 'failed'}"
        )
        return passed

    def _analyze_test_output_with_llm(self, combined_output: str, return_code: int):
        """
        Ask the LLM whether the test output indicates pass or fail.

        Returns:
            bool  — True=passed, False=failed
            None  — LLM could not determine (caller should fall back)
        """
        try:
            system_prompt = self.prompt_manager.get_prompt(
                "test_output_analysis", "system"
            )
            user_prompt = self.prompt_manager.get_prompt(
                "test_output_analysis", "user"
            ).format(
                test_output=combined_output,
                return_code=return_code,
            )

            raw = self.llm.generate(system_prompt, user_prompt, model_type="result_analysis")

            # Strip markdown code fences if present
            json_str = raw
            if "```json" in raw:
                json_str = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                json_str = raw.split("```")[1].strip()

            parsed      = json.loads(json_str)
            test_passed = parsed.get("test_passed", None)
            reasoning   = parsed.get("reasoning", "No reasoning provided")

            self.logger.debug(
                f"[EXEC] LLM: test_passed={test_passed} | reasoning={reasoning}"
            )
            return test_passed

        except json.JSONDecodeError as e:
            self.logger.error(f"[EXEC] Failed to parse LLM response: {e}")
            return None
        except Exception as e:
            self.logger.error(f"[EXEC] LLM analysis error: {e}")
            return None