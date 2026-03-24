from datetime import datetime
import json
from sqlalchemy.exc import SQLAlchemyError
from app.config.database import SessionLocal
from shared_orm.models.page import Page
from shared_orm.models.test_scenario import TestScenario
from shared_orm.models.test_case import TestCase
from app.services.test_credential_service import TestCredentialService


class TestCaseService:
    """
    Service responsible for generating and persisting test cases
    using LLM-based generation for given pages and scenarios.

    Responsibilities:
    - Generate test cases for all scenarios of a page
    - Regenerate test cases for a specific scenario
    - Parse LLM response safely
    - Persist test cases into DB
    - Trigger credential placeholder resolution
    """

    def __init__(self, llm, prompt_manager, logger):
        """
        Initialize TestCaseService.

        Args:
            llm: LLM client used for test generation
            prompt_manager: Manages system/user prompts
            logger: Logger instance
        """
        self.llm = llm
        self.prompt_manager = prompt_manager
        self.logger = logger
        self.credential_service = TestCredentialService(llm=llm, logger=logger)

    # -----------------------------------------------------------------------
    # ENTRY POINT — full page generation
    # -----------------------------------------------------------------------

    def generate(self, page_id: int, requested_by: int):
        """
        Generate test cases for ALL scenarios of a page.

        Flow:
        - Fetch page and scenarios
        - Generate test cases per scenario
        - Update page status
        - Trigger credential scanning

        Args:
            page_id (int): Page identifier
            requested_by (int): User ID who triggered generation
        """
        try:
            with SessionLocal() as db:

                # Fetch page
                page = db.query(Page).filter(Page.id == page_id).first()
                if not page:
                    self.logger.warning(f"Page {page_id} not found")
                    return

                # Fetch all scenarios for the page
                scenarios = db.query(TestScenario).filter(
                    TestScenario.page_id == page_id
                ).all()

                if not scenarios:
                    self.logger.warning(f"No scenarios found for page {page_id}")
                    return

                # Generate test cases per scenario
                for scenario in scenarios:
                    try:
                        self._generate_for_scenario(db, page, scenario, requested_by)
                    except Exception as e:
                        # Continue processing other scenarios even if one fails
                        self.logger.error(
                            f"Error generating scenario {scenario.id}: {str(e)}"
                        )

                # Update page status
                page.status = "generating_test_scripts"
                page.updated_on = datetime.utcnow()
                page.updated_by = requested_by
                db.commit()

                # Post-processing: scan credentials
                try:
                    fresh_test_cases = db.query(TestCase).filter(
                        TestCase.page_id == page_id
                    ).all()

                    self.credential_service.scan_and_generate(
                        page_id, fresh_test_cases
                    )
                except Exception as e:
                    self.logger.error(f"Credential scan failed: {str(e)}")

        except SQLAlchemyError as db_err:
            self.logger.error(f"Database error in generate(): {str(db_err)}")
        except Exception as e:
            self.logger.error(f"Unexpected error in generate(): {str(e)}")

    # -----------------------------------------------------------------------
    # ENTRY POINT — single scenario rerun
    # -----------------------------------------------------------------------

    def generate_for_scenario(self, page_id: int, scenario_id: int, requested_by: int):
        """
        Regenerate test cases for a SINGLE scenario.

        Flow:
        - Validate page & scenario
        - Delete existing test cases
        - Generate fresh test cases
        - Trigger credential scan

        Args:
            page_id (int): Page identifier
            scenario_id (int): Scenario identifier
            requested_by (int): User ID who triggered rerun
        """
        try:
            with SessionLocal() as db:

                # Fetch page
                page = db.query(Page).filter(Page.id == page_id).first()
                if not page:
                    self.logger.warning(f"[RERUN] Page {page_id} not found")
                    return

                # Fetch scenario
                scenario = db.query(TestScenario).filter(
                    TestScenario.id == scenario_id,
                    TestScenario.page_id == page_id,
                ).first()

                if not scenario:
                    self.logger.warning(
                        f"[RERUN] Scenario {scenario_id} not found for page {page_id}"
                    )
                    return

                self.logger.info(
                    f"[RERUN] Regenerating test cases | scenario_id={scenario_id}"
                )

                # Clean old test cases to avoid duplicates/stale data
                try:
                    db.query(TestCase).filter(
                        TestCase.test_scenario_id == scenario_id
                    ).delete(synchronize_session=False)
                    db.commit()
                except SQLAlchemyError as e:
                    db.rollback()
                    self.logger.error(f"Failed to delete old test cases: {str(e)}")
                    return

                # Generate new test cases
                self._generate_for_scenario(db, page, scenario, requested_by)
                db.commit()

                # Credential scan
                try:
                    fresh_test_cases = db.query(TestCase).filter(
                        TestCase.test_scenario_id == scenario_id
                    ).all()

                    self.credential_service.scan_and_generate(
                        page_id, fresh_test_cases
                    )
                except Exception as e:
                    self.logger.error(f"Credential scan failed: {str(e)}")

        except SQLAlchemyError as db_err:
            self.logger.error(f"Database error in rerun(): {str(db_err)}")
        except Exception as e:
            self.logger.error(f"Unexpected error in rerun(): {str(e)}")

    # -----------------------------------------------------------------------
    # INTERNAL — generate per scenario
    # -----------------------------------------------------------------------

    def _generate_for_scenario(self, db, page, scenario, requested_by):
        """
        Generate test cases for a single scenario using LLM.

        Args:
            db: Database session
            page: Page entity
            scenario: Scenario entity
            requested_by (int): User ID
        """
        try:
            # Prepare prompts
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
                page_source=page.page_source,
            )

            # Call LLM
            result = self.llm.generate(
                system_prompt, user_prompt, model_type="analysis"
            )

            self.logger.debug(
                f"Raw LLM output for scenario {scenario.id}: {result}"
            )

            # Parse LLM response safely
            test_cases = self._safe_parse(result)

            # Persist each test case
            for tc in test_cases:
                try:
                    self._persist_test_case(
                        db, page, scenario, tc, requested_by
                    )
                except Exception as e:
                    self.logger.error(
                        f"Error persisting test case in scenario {scenario.id}: {str(e)}"
                    )

        except Exception as e:
            self.logger.error(
                f"LLM generation failed for scenario {scenario.id}: {str(e)}"
            )

    # -----------------------------------------------------------------------
    # SAFE PARSER
    # -----------------------------------------------------------------------

    def _safe_parse(self, result: str):
        """
        Safely parse LLM output into structured test cases.

        Handles:
        - Markdown-wrapped JSON
        - Invalid JSON structure
        - Empty responses

        Args:
            result (str): Raw LLM output

        Returns:
            list: List of test case dictionaries
        """
        try:
            if not result:
                raise ValueError("Empty LLM response")

            # Strip markdown code blocks if present
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0]
            elif "```" in result:
                result = result.split("```")[1]

            data = json.loads(result)

            # Validate structure
            if not isinstance(data, dict) or "test_cases" not in data:
                raise ValueError("Invalid JSON structure")

            if not isinstance(data["test_cases"], list):
                raise ValueError("test_cases must be a list")

            return data["test_cases"]

        except json.JSONDecodeError as e:
            self.logger.error(f"JSON decode error: {str(e)}")
        except Exception as e:
            self.logger.error(f"LLM parse error: {str(e)}")

        return []

    # -----------------------------------------------------------------------
    # PERSIST TEST CASE
    # -----------------------------------------------------------------------

    def _persist_test_case(self, db, page, scenario, tc, requested_by):
        """
        Persist a single test case into the database.

        Ensures:
        - No duplicate test case per scenario
        - Safe DB handling

        Args:
            db: Database session
            page: Page entity
            scenario: Scenario entity
            tc (dict): Test case data from LLM
            requested_by (int): User ID
        """
        try:
            name = tc.get("name")

            # Skip invalid test case
            if not name:
                self.logger.warning("Skipping test case with no name")
                return

            # Deduplicate by scenario + title
            exists = db.query(TestCase).filter(
                TestCase.test_scenario_id == scenario.id,
                TestCase.title == name,
            ).first()

            if exists:
                return

            # Create new test case
            db.add(TestCase(
                page_id=page.id,
                test_scenario_id=scenario.id,
                title=name,
                type="auto-generated",
                is_valid=tc.get("is_valid", True),
                is_valid_default=tc.get("is_valid_default", False),
                data={
                    "steps": tc.get("steps", []),
                    "selectors": tc.get("selectors", {}),
                    "test_data": tc.get("test_data", {}),
                },
                expected_outcome=tc.get("expected_outcome", {}),
                validation={"description": tc.get("validation", "")},
                created_on=datetime.utcnow(),
                created_by=requested_by,
            ))

        except SQLAlchemyError as e:
            db.rollback()  # Critical: prevent broken transaction state
            self.logger.error(f"DB error while saving test case: {str(e)}")
        except Exception as e:
            self.logger.error(f"Unexpected error in persist: {str(e)}")