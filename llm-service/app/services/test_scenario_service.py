from datetime import datetime
import json
from sqlalchemy.exc import SQLAlchemyError
from app.config.database import SessionLocal
from shared_orm.models.page import Page
from shared_orm.models.test_scenario import TestScenario


class TestScenarioService:
    """
    Service responsible for generating test scenarios using LLM.

    Responsibilities:
    - Generate scenarios for a page
    - Detect authentication requirements
    - Prevent duplicate scenarios
    - Persist scenarios safely
    """

    def __init__(self, llm, prompt_manager, logger):
        """
        Initialize TestScenarioService.

        Args:
            llm: LLM client for generation
            prompt_manager: Handles prompt templates
            logger: Logger instance
        """
        self.llm = llm
        self.prompt_manager = prompt_manager
        self.logger = logger

    # -----------------------------------------------------------------------
    # ENTRY POINT — Generate scenarios for a page
    # -----------------------------------------------------------------------

    def generate(self, page_id: int, requested_by: int):
        """
        Generate test scenarios for a given page.

        Flow:
        - Fetch page
        - Generate scenarios using LLM
        - Detect authentication requirement per scenario
        - Deduplicate and persist
        - Update page status

        Args:
            page_id (int): Page identifier
            requested_by (int): User triggering the request
        """
        try:
            with SessionLocal() as db:

                # Fetch page
                page = db.query(Page).filter(Page.id == page_id).first()
                if not page:
                    self.logger.warning(f"Page {page_id} not found")
                    return

                # Prepare prompts
                system_prompt = self.prompt_manager.get_prompt(
                    "generate_test_scenarios", "system"
                )
                template = self.prompt_manager.get_prompt(
                    "generate_test_scenarios", "user"
                )

                try:
                    user_prompt = template.format(
                        page_metadata=page.page_metadata
                    )
                except KeyError as e:
                    self.logger.error(f"Prompt placeholder error: {str(e)}")
                    return

                # Call LLM
                try:
                    result = self.llm.generate(
                        system_prompt, user_prompt, model_type="analysis"
                    )
                except Exception as e:
                    self.logger.error(f"LLM generation failed: {str(e)}")
                    return

                # Parse response
                scenarios = self._parse(result)

                # Persist scenarios
                for sc in scenarios:
                    try:
                        self._persist_scenario(db, page, sc, requested_by)
                    except Exception as e:
                        self.logger.error(
                            f"Error processing scenario '{sc.get('title')}': {str(e)}"
                        )

                # Update page status
                page.status = "generating_test_cases"
                page.updated_on = datetime.utcnow()
                page.updated_by = requested_by

                db.commit()

        except SQLAlchemyError as db_err:
            self.logger.error(f"Database error in generate(): {str(db_err)}")
        except Exception as e:
            self.logger.error(f"Unexpected error in generate(): {str(e)}")

    # -----------------------------------------------------------------------
    # INTERNAL — Persist scenario
    # -----------------------------------------------------------------------

    def _persist_scenario(self, db, page, sc: dict, requested_by: int):
        """
        Persist a single scenario after validation and deduplication.

        Args:
            db: Database session
            page: Page entity
            sc (dict): Scenario data
            requested_by (int): User ID
        """
        title = sc.get("title")
        category = sc.get("category")

        if not title:
            self.logger.warning("Skipping scenario with missing title")
            return

        # Detect authentication requirement
        requires_auth = self._detect_scenario_auth(sc)

        # Deduplication check
        existing = db.query(TestScenario).filter(
            TestScenario.page_id == page.id,
            TestScenario.title == title,
            TestScenario.category == category
        ).first()

        if existing:
            self.logger.info(
                f"[SCENARIO_SKIPPED_DUPLICATE] PageID={page.id} Title='{title}'"
            )
            return

        try:
            db.add(TestScenario(
                page_id=page.id,
                title=title,
                data=sc,
                type="auto-generated",
                category=category,
                requires_auth=requires_auth,
                created_on=datetime.utcnow(),
                created_by=requested_by
            ))

            if requires_auth:
                self.logger.info(
                    f"Scenario '{title}' detected as requiring authentication"
                )

        except SQLAlchemyError as e:
            db.rollback()
            self.logger.error(f"DB error while saving scenario: {str(e)}")

    # -----------------------------------------------------------------------
    # SAFE PARSER
    # -----------------------------------------------------------------------

    def _parse(self, result: str):
        """
        Safely parse LLM response to extract scenarios.

        Handles:
        - Markdown-wrapped JSON
        - Invalid structure
        - Empty response

        Args:
            result (str): Raw LLM output

        Returns:
            list: List of scenarios
        """
        try:
            if not result:
                raise ValueError("Empty LLM response")

            # Remove markdown formatting if present
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0]
            elif "```" in result:
                result = result.split("```")[1]

            data = json.loads(result)

            if not isinstance(data, dict) or "scenarios" not in data:
                raise ValueError("Invalid JSON structure: missing 'scenarios'")

            if not isinstance(data["scenarios"], list):
                raise ValueError("'scenarios' must be a list")

            return data["scenarios"]

        except json.JSONDecodeError as e:
            self.logger.error(f"JSON decode error: {str(e)}")
        except Exception as e:
            self.logger.error(f"Scenario parse error: {str(e)}")

        return []

    # -----------------------------------------------------------------------
    # AUTHENTICATION DETECTION
    # -----------------------------------------------------------------------

    def _detect_scenario_auth(self, scenario: dict) -> bool:
        """
        Detect whether a scenario requires authentication.

        Logic checks:
        - Title keywords
        - Category
        - Steps/actions
        - Entry point URLs
        - Flow structure
        - Exit conditions

        Args:
            scenario (dict): Scenario data

        Returns:
            bool: True if authentication is required
        """
        auth_keywords = [
            'login', 'signin', 'sign in', 'log in', 'authenticate',
            'password', 'username', 'email', 'credential',
            'register', 'signup', 'sign up', 'account',
            'logout', 'sign out', 'log out'
        ]

        # --- Title check ---
        title = scenario.get('title', '').lower()
        if any(k in title for k in auth_keywords):
            return True

        # --- Category check ---
        category = scenario.get('category', '').lower()
        if 'auth' in category or 'login' in category:
            return True

        # --- Steps check ---
        for step in scenario.get('steps', []):
            if isinstance(step, dict):
                action = step.get('action', '').lower()
                target = str(step.get('target', '')).lower()

                if any(k in action for k in auth_keywords):
                    return True
                if any(k in target for k in auth_keywords):
                    return True

        # --- Entry point URL ---
        entry_point = scenario.get('entry_point', '').lower()
        if any(k in entry_point for k in auth_keywords):
            return True

        # --- Flow structure ---
        flow_structure = scenario.get('flow_structure', {})
        if isinstance(flow_structure, dict):
            if any(k in str(flow_structure).lower() for k in auth_keywords):
                return True

        # --- Exit condition ---
        exit_condition = scenario.get('exit_condition', '').lower()
        if any(k in exit_condition for k in auth_keywords):
            return True

        return False