from datetime import datetime
import json
from app.config.database import SessionLocal
from shared_orm.models.page import Page
from shared_orm.models.test_scenario import TestScenario
from shared_orm.models.test_case import TestCase


class TestCaseService:

    def __init__(self, llm, prompt_manager, logger):
        self.llm = llm
        self.prompt_manager = prompt_manager
        self.logger = logger

    # -----------------------------------------------------
    # ENTRY POINT
    # -----------------------------------------------------

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

            page.status = "generating_test_scripts"
            page.updated_on = datetime.utcnow()
            page.updated_by = requested_by

            db.commit()

    # -----------------------------------------------------
    # GENERATE PER SCENARIO
    # -----------------------------------------------------

    def _generate_for_scenario(self, db, page, scenario, requested_by):

        system_prompt = self.prompt_manager.get_prompt(
            "generate_tests", "system"
        )

        user_prompt = self.prompt_manager.get_prompt(
            "generate_tests", "user"
        ).format(
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

        for tc in test_cases:
            self._persist_test_case(db, page, scenario, tc, requested_by)

    # -----------------------------------------------------
    # SAFE PARSER
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # PERSIST TEST CASE
    # -----------------------------------------------------

    def _persist_test_case(self, db, page, scenario, tc, requested_by):

        name = tc.get("name")
        if not name:
            return

        # Deduplicate by scenario + name
        exists = db.query(TestCase).filter(
            TestCase.test_scenario_id == scenario.id,
            TestCase.title == name
        ).first()

        if exists:
            return

        expected_outcome = tc.get("expected_outcome", {})
        validation_text = tc.get("validation", "")

        db.add(TestCase(
            page_id=page.id,
            test_scenario_id=scenario.id,
            title=name,
            type="auto-generated",
            data={
                "steps": tc.get("steps", []),
                "selectors": tc.get("selectors", {}),
                "test_data": tc.get("test_data", {})
            },
            expected_outcome=expected_outcome,  # Structured machine assertion
            validation={
                "description": validation_text
            },  # Human readable description
            created_on=datetime.utcnow(),
            created_by=requested_by
        ))
