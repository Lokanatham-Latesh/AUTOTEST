from datetime import datetime
import json
from app.config.database import SessionLocal
from shared_orm.models.page import Page
from shared_orm.models.test_scenario import TestScenario
from shared_orm.models.test_case import TestCase
from app.services.test_credential_service import TestCredentialService


class TestCaseService:

    def __init__(self, llm, prompt_manager, logger):
        self.llm                = llm
        self.prompt_manager     = prompt_manager
        self.logger             = logger
        self.credential_service = TestCredentialService(llm=llm, logger=logger)

    # -----------------------------------------------------------------------
    # ENTRY POINT — full page generation (all scenarios)
    # -----------------------------------------------------------------------

    def generate(self, page_id: int, requested_by: int):
        """
        Generate test cases for ALL scenarios on a page.
        Called on the normal pipeline flow.
        """
        with SessionLocal() as db:
            page = db.query(Page).filter(Page.id == page_id).first()
            if not page:
                self.logger.warning(f"Page {page_id} not found")
                return

            scenarios = db.query(TestScenario).filter(
                TestScenario.page_id == page_id
            ).all()

            if not scenarios:
                self.logger.warning(f"No scenarios found for page {page_id}")
                return

            for scenario in scenarios:
                self._generate_for_scenario(db, page, scenario, requested_by)

            page.status     = "generating_test_scripts"
            page.updated_on = datetime.utcnow()
            page.updated_by = requested_by
            db.commit()

            # Scan all test cases for credential placeholders and pre-generate
            fresh_test_cases = db.query(TestCase).filter(
                TestCase.page_id == page_id
            ).all()
            self.credential_service.scan_and_generate(page_id, fresh_test_cases)

    # -----------------------------------------------------------------------
    # ENTRY POINT — targeted single-scenario rerun
    # -----------------------------------------------------------------------

    def generate_for_scenario(self, page_id: int, scenario_id: int, requested_by: int):
        """
        Generate test cases for ONE specific scenario only.
        Called on scenario rerun from the frontend.

        Existing test cases for this scenario are deleted and regenerated
        so stale cases don't accumulate across reruns.
        """
        with SessionLocal() as db:
            page = db.query(Page).filter(Page.id == page_id).first()
            if not page:
                self.logger.warning(f"[RERUN] Page {page_id} not found")
                return

            scenario = db.query(TestScenario).filter(
                TestScenario.id      == scenario_id,
                TestScenario.page_id == page_id,
            ).first()

            if not scenario:
                self.logger.warning(
                    f"[RERUN] Scenario {scenario_id} not found for page {page_id}"
                )
                return

            self.logger.info(
                f"[RERUN] Regenerating test cases | "
                f"scenario_id={scenario_id} title='{scenario.title}'"
            )

            # Delete existing test cases for this scenario so we start clean
            db.query(TestCase).filter(
                TestCase.test_scenario_id == scenario_id
            ).delete(synchronize_session=False)
            db.commit()

            # Regenerate
            self._generate_for_scenario(db, page, scenario, requested_by)
            db.commit()

            # Scan new test cases for credential placeholders
            fresh_test_cases = db.query(TestCase).filter(
                TestCase.test_scenario_id == scenario_id
            ).all()
            self.credential_service.scan_and_generate(page_id, fresh_test_cases)

            self.logger.info(
                f"[RERUN] Completed | scenario_id={scenario_id}"
            )

    # -----------------------------------------------------------------------
    # INTERNAL — generate test cases for a single scenario
    # -----------------------------------------------------------------------

    def _generate_for_scenario(self, db, page, scenario, requested_by):
        system_prompt = self.prompt_manager.get_prompt("generate_tests", "system")

        user_prompt = self.prompt_manager.get_prompt("generate_tests", "user").format(
            page_metadata=page.page_metadata,
            scenario=json.dumps(scenario.data),
            title=page.page_title,
            url=page.page_url,
            page_source=page.page_source,
        )

        result = self.llm.generate(system_prompt, user_prompt, model_type="analysis")
        self.logger.debug(f"Raw LLM output for scenario {scenario.id}: {result}")

        test_cases = self._safe_parse(result)

        for tc in test_cases:
            self._persist_test_case(db, page, scenario, tc, requested_by)

    # -----------------------------------------------------------------------
    # SAFE PARSER
    # -----------------------------------------------------------------------

    def _safe_parse(self, result: str):
        try:
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0]
            elif "```" in result:
                result = result.split("```")[1]

            data = json.loads(result)

            if not isinstance(data, dict) or "test_cases" not in data:
                raise ValueError("Invalid JSON structure: missing test_cases")
            if not isinstance(data["test_cases"], list):
                raise ValueError("test_cases must be a list")

            return data["test_cases"]

        except Exception as e:
            self.logger.error(f"LLM test case parse error: {e}")
            return []

    # -----------------------------------------------------------------------
    # PERSIST TEST CASE
    #
    # type             — Always "auto-generated" for LLM-produced cases.
    # is_valid         — LLM returns true/false per test case.
    # is_valid_default — LLM marks exactly ONE per scenario as the default.
    # -----------------------------------------------------------------------

    def _persist_test_case(self, db, page, scenario, tc, requested_by):
        name = tc.get("name")
        if not name:
            return

        # Deduplicate by scenario + name
        exists = db.query(TestCase).filter(
            TestCase.test_scenario_id == scenario.id,
            TestCase.title            == name,
        ).first()

        if exists:
            return

        db.add(TestCase(
            page_id          = page.id,
            test_scenario_id = scenario.id,
            title            = name,
            type             = "auto-generated",
            is_valid         = tc.get("is_valid",         True),
            is_valid_default = tc.get("is_valid_default", False),
            data             = {
                "steps":     tc.get("steps",     []),
                "selectors": tc.get("selectors", {}),
                "test_data": tc.get("test_data", {}),
            },
            expected_outcome = tc.get("expected_outcome", {}),
            validation       = {"description": tc.get("validation", "")},
            created_on       = datetime.utcnow(),
            created_by       = requested_by,
        ))