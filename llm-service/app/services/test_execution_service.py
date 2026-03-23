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
        scenario_id: int = None,    # None = all scenarios, int = targeted
        test_suite_id: int = None,  # optional grouping handle
        auth_cookies: list = None,  # Selenium cookies from an authenticated browser
    ):
        """
        Execute all (or one) scenario scripts for a page and persist results.

        auth_cookies: if provided, every subprocess browser will have these
        cookies injected before navigating — restoring the login session
        without re-running the full login flow.
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
                    auth_cookies=auth_cookies,
                )

            db.commit()
            self.logger.info(
                f"[EXEC] All executions committed | page_id={page.id}"
            )

    # -----------------------------------------------------------------------
    # SCENARIO-LEVEL EXECUTION
    # -----------------------------------------------------------------------

    def _execute_scenario(self, db, scenario, page_id, test_suite_id, requested_by,
                          auth_cookies: list = None):
        """
        Run a scenario's script once per TestCase.
        auth_cookies: injected into each subprocess browser to restore login session.
        """
        if not scenario.script or not scenario.script.strip():
            self.logger.warning(
                f"[EXEC] No script on scenario_id={scenario.id} — skipping"
            )
            # Still write a "skipped" record for every test case
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

        # Execute once per test case, injecting the test case data into the
        # script so tests can access runtime inputs for validation.
        test_cases = db.query(TestCase).filter(
            TestCase.test_scenario_id == scenario.id,
            TestCase.page_id == page_id,
        ).all()

        # If there are no test cases, keep legacy behaviour: run once and
        # persist a single execution row with test_case_id=None
        if not test_cases:
            result = self.execute_test_script(scenario.script)

            # Build the full log string from stdout + stderr
            log_parts = []
            if result.get("output"):
                log_parts.append(result["output"])
            if result.get("error"):
                log_parts.append(result["error"])
            logs = "\n".join(log_parts).strip() or "(no output)"

            if result.get("success") is None:
                status = "error"
            elif result["success"]:
                status = "passed"
            else:
                status = "failed"

            self.logger.info(
                f"[EXEC] Result | scenario_id={scenario.id} status={status}"
            )

            self._persist_results(
                db=db,
                scenario=scenario,
                page_id=page_id,
                test_suite_id=test_suite_id,
                requested_by=requested_by,
                status=status,
                logs=logs,
            )
            return

        # Resolve credentials once for all test cases in this scenario
        resolved_credentials = {}
        try:
            from app.services.test_credential_service import TestCredentialService
            cred_service = TestCredentialService(llm=self.llm, logger=self.logger)
            for tc in test_cases:
                raw_td = (tc.data or {}).get("test_data", {})
                if raw_td:
                    resolved_credentials[tc.id] = cred_service.resolve(page_id, raw_td)
        except Exception as e:
            self.logger.warning(f"[EXEC] Credential resolution failed: {e} — using raw test_data")

        # Run the script exactly once per test case
        for tc in test_cases:
            try:
                self.logger.info(
                    f"[EXEC] Running tc_id={tc.id} | scenario_id={scenario.id} title='{tc.title}'"
                )

                tc_data = tc.data or {}
                if isinstance(tc_data, str):
                    try:
                        tc_data = json.loads(tc_data)
                    except Exception:
                        tc_data = {"value": tc_data}

                # Replace raw test_data with resolved credentials
                resolved_td = resolved_credentials.get(tc.id)
                if resolved_td:
                    tc_data = {**tc_data, "test_data": resolved_td}

                # Build the single-test-case payload the script reads at runtime
                # Normalize steps: ensure URLs are extractable regardless of
                # whether the LLM used "Navigate to", "navigate to", "Go to", etc.
                # Scripts that split on lowercase "navigate to " will now work.
                _raw_steps = tc_data.get("steps", [])
                _norm_steps = []
                for _s in _raw_steps:
                    if isinstance(_s, str):
                        # Lowercase only the navigation keyword, preserve the URL
                        import re as _re2
                        _norm_steps.append(
                            _re2.sub(
                                r'^(Navigate|Go|Open|Visit|Launch)\s+to\s+',
                                'navigate to ',
                                _s,
                                flags=_re2.IGNORECASE
                            )
                        )
                    else:
                        _norm_steps.append(_s)

                tc_payload = {
                    "name":             tc.title,
                    "steps":            _norm_steps,
                    "selectors":        tc_data.get("selectors", {}),
                    "test_data":        tc_data.get("test_data", {}),
                    "expected_outcome": tc.expected_outcome or {},
                    "validation":       tc.validation or "",
                    "is_valid":         tc.is_valid,
                    "is_valid_default": tc.is_valid_default,
                }

                # Build the script header via the dedicated helper.
                # It handles __TEST_CASE__ injection + auth cookie restoration
                # in a clean, testable way.
                header = self._build_script_header(tc_payload, auth_cookies)
                script_with_context = header + (scenario.script or "")

                result = self.execute_test_script(script_with_context)

                # Build the full log string from stdout + stderr
                log_parts = []
                if result.get("output"):
                    log_parts.append(result["output"])
                if result.get("error"):
                    log_parts.append(result["error"])
                logs = "\n".join(log_parts).strip() or "(no output)"

                if result.get("success") is None:
                    status = "error"
                elif result["success"]:
                    status = "passed"
                else:
                    status = "failed"

                self.logger.info(
                    f"[EXEC] TC Result | scenario_id={scenario.id} tc_id={tc.id} status={status}"
                )

                executed_on = datetime.utcnow()

                # Upsert the execution row for this specific test case
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

            except Exception as e:
                self.logger.error(
                    f"[EXEC] Execution failed for tc_id={getattr(tc, 'id', None)}: {e}"
                )
                # On per-test-case failure, write an error row for that tc
                try:
                    self._upsert_execution(
                        db=db,
                        page_id=page_id,
                        scenario=scenario,
                        test_case=tc,
                        test_suite_id=test_suite_id,
                        requested_by=requested_by,
                        status="error",
                        logs=str(e),
                        executed_on=datetime.utcnow(),
                    )
                except Exception:
                    # swallow to avoid blocking remaining TCs
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
    # SCRIPT HEADER BUILDER
    # -----------------------------------------------------------------------

    @staticmethod
    def _build_script_header(tc_payload: dict, auth_cookies: list = None) -> str:
        """
        Build the Python source block prepended to every generated script.

        1. __TEST_CASE__ injection — uses repr() not json.dumps() so that
           Python booleans (True/False/None) are emitted, not JSON literals
           (true/false/null) which cause NameError in the subprocess.

        2. Auth session restoration — when auth_cookies is provided:
           a) Creates a fresh Selenium driver.
           b) Navigates to the site origin so the domain accepts cookies.
           c) Injects every session cookie.
           d) Refreshes so the server sees the restored session.
           e) CRITICALLY: monkey-patches sys.modules so that when the
              generated script calls `from app.services.selenium_driver
              import get_driver; driver = get_driver()` it receives this
              already-authenticated driver instead of opening a new one.
              Without the monkey-patch the script's own get_driver() call
              would replace the authenticated driver with a fresh one.
        """
        # Normalize navigation steps so scripts using case-sensitive split work.
        # Steps like "Navigate to URL" must become "navigate to URL" because
        # generated scripts typically do: step.split("navigate to ", 1)[1]
        import re as _re_norm
        _normalized = dict(tc_payload)
        _normalized["steps"] = [
            _re_norm.sub(
                r"^(Navigate|Go|Open|Visit|Launch)\s+to\s+",
                "navigate to ",
                s,
                flags=_re_norm.IGNORECASE
            ) if isinstance(s, str) else s
            for s in tc_payload.get("steps", [])
        ]

        lines = [
            "import json",
            "import time",
            f"__TEST_CASE__ = {repr(_normalized)}",
            "",
        ]

        if auth_cookies:
            first_domain = next(
                (c.get("domain", "").lstrip(".") for c in auth_cookies if c.get("domain")),
                ""
            )
            origin_url = (
                f"https://{first_domain}" if first_domain
                else tc_payload.get("page_origin", "")
            )

            lines += [
                "# ── Auth session restoration ────────────────────────────────────",
                "import sys, types",
                "from selenium.webdriver.support.ui import WebDriverWait as _WDW",
                "from selenium.webdriver.support import expected_conditions as _EC",
                "from app.services.selenium_driver import get_driver as _gd_real",
                "",
                "# Create the authenticated browser",
                "_auth_driver = _gd_real()",
                "",
                f"_origin  = {repr(origin_url)}",
                f"_cookies = {repr(auth_cookies)}",
                "",
                "# Step 1: visit site origin so browser accepts cookies for this domain",
                "if _origin:",
                "    try:",
                "        _auth_driver.get(_origin)",
                "        _WDW(_auth_driver, 10).until(",
                "            lambda d: d.execute_script('return document.readyState') == 'complete'",
                "        )",
                "    except Exception:",
                "        pass",
                "",
                "# Step 2: inject session cookies",
                "for _c in _cookies:",
                "    try:",
                "        _safe = {k: v for k, v in _c.items()",
                "                 if k in ('name','value','path','domain','secure',",
                "                          'httpOnly','expiry','sameSite')}",
                "        _auth_driver.add_cookie(_safe)",
                "    except Exception:",
                "        pass",
                "",
                "# Step 3: refresh so server sees the restored session",
                "try:",
                "    _auth_driver.refresh()",
                "    _WDW(_auth_driver, 10).until(",
                "        lambda d: d.execute_script('return document.readyState') == 'complete'",
                "    )",
                "except Exception:",
                "    pass",
                "",
                "# Step 4: monkey-patch get_driver so the script reuses this",
                "# authenticated driver instead of opening a fresh one.",
                "# This is the critical step — without it the script's own",
                "# `driver = get_driver()` call would discard the session.",
                "_patch_mod = types.ModuleType('app.services.selenium_driver')",
                "_patch_mod.get_driver = lambda: _auth_driver",
                "sys.modules['app.services.selenium_driver'] = _patch_mod",
                "",
                "# Expose as module-level `driver` so scripts that reference",
                "# the name directly (without calling get_driver) also work.",
                "driver = _auth_driver",
                "",
                "# Step 5: Navigate directly to the target page so the script starts",
                "# on the right page. This means when the script navigates to its",
                "# starting_url, the browser is already there with a valid session.",
                f"_target_page_url = {repr(tc_payload.get('page_url', ''))}",
                "if _target_page_url:",
                "    try:",
                "        _auth_driver.get(_target_page_url)",
                "        _WDW(_auth_driver, 10).until(",
                "            lambda d: d.execute_script('return document.readyState') == 'complete'",
                "        )",
                "    except Exception:",
                "        pass",
                "",
                "# Step 6: Set a flag that suppresses redundant login blocks in",
                "# already-generated scripts that check for this flag.",
                "# Scripts generated before this fix may still attempt login — this",
                "# flag allows those scripts to skip the login block gracefully.",
                "__COOKIES_AUTH_DONE__ = True",
                "# ── End auth session restoration ─────────────────────────────────",
                "",
            ]
        else:
            # No auth — initialise driver normally at module level
            lines += [
                "from app.services.selenium_driver import get_driver as _gd",
                "driver = _gd()",
                "",
            ]

        return "\n".join(lines) + "\n"

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