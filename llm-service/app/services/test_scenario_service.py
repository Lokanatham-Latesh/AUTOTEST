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
        """
        Generate test scenarios for a given page.
        Automatically detects if scenarios require authentication.
        """
        with SessionLocal() as db:
            page = db.query(Page).filter(Page.id == page_id).first()
            if not page:
                self.logger.warning(f"Page {page_id} not found")
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

            # Add scenarios to database with auth detection
            for sc in scenarios:
                # Detect if this specific scenario requires authentication
                requires_auth = self._detect_scenario_auth(sc)

                db.add(TestScenario(
                    page_id=page.id,
                    title=sc["title"],
                    data=sc,
                    type="auto-generated",
                    category=sc.get("category"),
                    requires_auth=requires_auth,  # Set auth flag
                    created_on=datetime.utcnow(),
                    created_by=requested_by
                ))

                if requires_auth:
                    self.logger.info(f"Scenario '{sc['title']}' detected as requiring authentication")

            page.status = "generating_test_cases"
            page.updated_on = datetime.utcnow()
            page.updated_by = requested_by
            db.commit()

    def _parse(self, result: str):
        """Parse LLM response to extract scenarios."""

        import json
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0]
        return json.loads(result)["scenarios"]

    #---------------- Authentication Detection Logic -----------------#
    def _detect_scenario_auth(self, scenario: dict) -> bool:
        """
        Detect if a scenario requires authentication based on:
        - Title containing auth keywords
        - Steps containing auth actions
        - Selectors pointing to auth elements
        - URLs containing auth paths
        """
        auth_keywords = [
            'login', 'signin', 'sign in', 'log in', 'authenticate',
            'password', 'username', 'email', 'credential',
            'register', 'signup', 'sign up', 'account', 'logout',
            'sign out', 'log out'
        ]
        
        # Check title
        title = scenario.get('title', '').lower()
        if any(keyword in title for keyword in auth_keywords):
            return True
        
        # Check category
        category = scenario.get('category', '').lower()
        if 'auth' in category or 'login' in category:
            return True
        
        # Check steps for auth-related actions
        steps = scenario.get('steps', [])
        for step in steps:
            if isinstance(step, dict):
                action = step.get('action', '').lower()
                target = str(step.get('target', '')).lower()
                
                if any(keyword in action for keyword in auth_keywords):
                    return True
                if any(keyword in target for keyword in auth_keywords):
                    return True
        
        # Check entry point URL
        entry_point = scenario.get('entry_point', '').lower()
        if any(keyword in entry_point for keyword in auth_keywords):
            return True
        
        # Check flow structure
        flow_structure = scenario.get('flow_structure', {})
        if isinstance(flow_structure, dict):
            flow_str = str(flow_structure).lower()
            if any(keyword in flow_str for keyword in auth_keywords):
                return True
        
        # Check exit condition
        exit_condition = scenario.get('exit_condition', '').lower()
        if any(keyword in exit_condition for keyword in auth_keywords):
            return True
        
        return False
