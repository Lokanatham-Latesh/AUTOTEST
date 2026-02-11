from datetime import datetime
from app.config.database import SessionLocal
from shared_orm.models.page import Page
from shared_orm.models.test_scenario import TestScenario


class TestScenarioService:

    def __init__(self, llm, prompt_manager, logger):
        self.llm = llm
        self.prompt_manager = prompt_manager
        self.logger = logger

    def generate(self, page_id: int, requested_by: int):
        with SessionLocal() as db:
            page = db.query(Page).filter(Page.id == page_id).first()
            if not page:
                return

            system_prompt = self.prompt_manager.get_prompt(
                "generate_test_scenarios", "system"
            )
            template = self.prompt_manager.get_prompt("generate_test_scenarios", "user")
            try:
                user_prompt = template.format(page_metadata=page.page_metadata)
            except KeyError as e:
                 self.logger.error(f"Prompt placeholder error: {e}")
                 raise
            result = self.llm.generate(system_prompt, user_prompt, model_type="analysis")
            scenarios = self._parse(result)

            for sc in scenarios:
                db.add(TestScenario(
                    page_id=page.id,
                    title=sc["title"],
                    data=sc,
                    type="auto-generated",
                    category=sc.get("category"),
                    created_on=datetime.utcnow(),
                    created_by=requested_by
                ))

            page.status = "generating_test_cases"
            page.updated_on = datetime.utcnow()
            page.updated_by = requested_by
            db.commit()

    def _parse(self, result: str):
        import json
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0]
        return json.loads(result)["scenarios"]
