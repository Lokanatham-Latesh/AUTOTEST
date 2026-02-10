from datetime import datetime
from app.config.database import SessionLocal
from shared_orm.models.page import Page
from shared_orm.models.test_scenario import TestScenario
from shared_orm.models.test_case import TestCase


class TestCaseService:

    def __init__(self, llm, prompt_manager, logger):
        self.llm = llm
        self.prompt_manager = prompt_manager
        self.logger = logger

    def generate(self, page_id: int, requested_by: int):
        with SessionLocal() as db:
            page = db.query(Page).filter(Page.id == page_id).first()
            scenarios = db.query(TestScenario).filter(
                TestScenario.page_id == page_id
            ).all()

            for scenario in scenarios:
                system_prompt = self.prompt_manager.get_prompt(
                    "generate_tests", "system"
                )
                user_prompt = self.prompt_manager.get_prompt(
                    "generate_tests", "user"
                ).format(
                    scenario=scenario.data,
                    page_metadata=page.page_metadata
                )

                result = self.llm.generate(system_prompt, user_prompt, model_type="analysis")
                test_cases = self._parse(result)

                for tc in test_cases:
                    db.add(TestCase(
                        page_id=page.id,
                        test_scenario_id=scenario.id,
                        title=tc["name"],
                        data=tc.get("steps"),
                        expected_outcome=tc.get("expected"),
                        validation=tc.get("validation"),
                        type="auto-generated",
                        created_on=datetime.utcnow(),
                        created_by=requested_by
                    ))

            page.status = "generating_test_scripts"
            db.commit()

    def _parse(self, result: str):
        import json
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0]
        return json.loads(result)["test_cases"]
