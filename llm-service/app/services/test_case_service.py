from datetime import datetime
import json
from app.config.database import SessionLocal
from shared_orm.models.page import Page
from shared_orm.models.test_scenario import TestScenario
from shared_orm.models.test_case import TestCase
from app.services.credential_service import TestCredentialService


class TestCaseService:

    def __init__(self, llm, prompt_manager, logger):
        self.llm                = llm
        self.prompt_manager     = prompt_manager
        self.logger             = logger
        self.credential_service = TestCredentialService(llm=llm, logger=logger)

    # -----------------------------------------------------------------------
    # ENTRY POINT
    # -----------------------------------------------------------------------

    def generate(self, page_id: int, requested_by: int):
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

            # ---------------------------------------------------------------
            # After all test cases are committed, scan their test_data for
            # placeholders and pre-generate any missing credential values.
            # ---------------------------------------------------------------
            fresh_test_cases = db.query(TestCase).filter(
                TestCase.page_id == page_id
            ).all()

            self.credential_service.scan_and_generate(page_id, fresh_test_cases)

    # -----------------------------------------------------------------------
    # GENERATE PER SCENARIO
    # -----------------------------------------------------------------------

    def _generate_for_scenario(self, db, page, scenario, requested_by):

        system_prompt = self.prompt_manager.get_prompt("generate_tests", "system")

        user_prompt = self.prompt_manager.get_prompt("generate_tests", "user").format(
            page_metadata=page.page_metadata,
            scenario=json.dumps(scenario.data),
            title=page.page_title,
            url=page.page_url,
            page_source=page.page_source
        )

        result = self.llm.generate(
            system_prompt,
            user_prompt,
            model_type="analysis"
        )

        self.logger.debug(f"Raw LLM output for scenario {scenario.id}: {result}")

        test_cases = self._safe_parse(result)

        # LLM decides is_valid, is_valid_default, and type per test case.
        # No tracking needed here — _persist_test_case reads them directly from tc.
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
    # Stores test_data with placeholders intact — e.g. {"email": "{VALID_EMAIL}"}
    # Actual values live in test_case_credentials, resolved at execution time.
    #
    # type             — LLM decides the test case category:
    #                    functional | auth-positive | auth-negative |
    #                    navigation | ui-validation | validation
    #
    # test_case_type   — Always "auto-generated" for LLM-produced cases.
    #                    Distinguishes from manually created test cases.
    #
    # is_valid         — LLM returns true/false per test case.
    #                    true  → test case is well-formed and executable.
    #                    false → test case has issues (broken selector, missing
    #                            element, steps not completable on this page).
    #                    User can flip from the frontend at any time.
    #
    # is_valid_default — LLM returns true on exactly ONE case per scenario.
    #                    That case is picked automatically when building
    #                    Test Suites and Workflows.
    #                    User can reassign from the frontend at any time.
    # -----------------------------------------------------------------------

    def _persist_test_case(self, db, page, scenario, tc, requested_by):

        name = tc.get("name")
        if not name:
            return

        # Deduplicate by scenario + name
        exists = db.query(TestCase).filter(
            TestCase.test_scenario_id == scenario.id,
            TestCase.title            == name
        ).first()

        if exists:
            return

        expected_outcome = tc.get("expected_outcome", {})
        validation_text  = tc.get("validation", "")

        db.add(TestCase(
            page_id          = page.id,
            test_scenario_id = scenario.id,
            title            = name,
            type             = tc.get("type", "functional"),       # LLM decides; fallback functional
            test_case_type   = "auto-generated",                   # Always auto-generated for LLM cases
            is_valid         = tc.get("is_valid", True),           # LLM decides; fallback True if omitted
            is_valid_default = tc.get("is_valid_default", False),  # LLM decides; fallback False if omitted
            data             = {
                "steps":     tc.get("steps", []),
                "selectors": tc.get("selectors", {}),
                "test_data": tc.get("test_data", {})  # Placeholders stored as-is
            },
            expected_outcome = expected_outcome,
            validation       = {"description": validation_text},
            created_on       = datetime.utcnow(),
            created_by       = requested_by
        ))