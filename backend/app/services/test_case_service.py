from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
import json
import anyio

from shared_orm.models.test_case import TestCase
from shared_orm.models.test_scenario import TestScenario
from shared_orm.models.user import User

from app.config.logger import logger
from app.services.page_service import PageService

page_service = PageService()


class TestCaseService:
    """
    Service class responsible for managing TestCase entities.

    This includes:
    - Creating test cases
    - Retrieving test case details
    - Updating test cases
    - Deleting test cases
    - Detecting authentication credentials from test case data

    The service ensures:
    - Proper transaction handling (commit/rollback)
    - Structured logging
    - Safe async execution for side-effects
    """

    # -------------------------------
    # Create Test Case
    # -------------------------------
    def create_test_case(
        self,
        db: Session,
        test_scenario_id: int,
        payload: dict,
        user: User
    ) -> TestCase:
        """
        Create a new test case under a given test scenario.

        Automatically derives `page_id` from the associated scenario.

        Args:
            db (Session): Active database session.
            test_scenario_id (int): ID of the parent test scenario.
            payload (dict): Input data for test case creation.
            user (User): Authenticated user creating the test case.

        Returns:
            TestCase: Newly created test case instance.

        Raises:
            HTTPException:
                - 404 if test scenario is not found
                - 500 if creation fails
        """
        logger.info(
            f"[CREATE_TEST_CASE_REQUEST] ScenarioID={test_scenario_id} CreatedBy={user.id}"
        )

        try:
            scenario = db.query(TestScenario).filter(
                TestScenario.id == test_scenario_id
            ).first()

            if not scenario:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Test Scenario not found"
                )

            new_test_case = TestCase(
                page_id=scenario.page_id,
                test_scenario_id=test_scenario_id,
                title=payload.get("title"),
                type=payload.get("type", "auto-generated"),
                data=payload.get("data"),
                expected_outcome=payload.get("expected_outcome"),
                validation=payload.get("validation"),
                is_valid=payload.get("is_valid", True),
                is_valid_default=payload.get("is_valid_default", False),
                created_on=datetime.now(timezone.utc),
                created_by=user.id,
            )

            db.add(new_test_case)
            db.commit()
            db.refresh(new_test_case)

            logger.info(
                f"[CREATE_TEST_CASE_SUCCESS] TestCaseID={new_test_case.id}"
            )

            return new_test_case

        except HTTPException:
            db.rollback()
            raise

        except Exception as e:
            db.rollback()
            logger.error(
                f"[CREATE_TEST_CASE_ERROR] ScenarioID={test_scenario_id} Error={str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create test case"
            )

    # -------------------------------
    # Get Test Case
    # -------------------------------
    def get_test_case_by_id(self, db: Session, test_case_id: int) -> TestCase:
        """
        Retrieve a test case by its ID.

        Args:
            db (Session): Active database session.
            test_case_id (int): Unique identifier of the test case.

        Returns:
            TestCase: Retrieved test case with scenario relationship loaded.

        Raises:
            HTTPException:
                - 404 if test case not found
                - 500 if retrieval fails
        """
        logger.info(f"[GET_TEST_CASE_REQUEST] TestCaseID={test_case_id}")

        try:
            test_case = (
                db.query(TestCase)
                .options(joinedload(TestCase.scenario))
                .filter(TestCase.id == test_case_id)
                .first()
            )

            if not test_case:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Test Case not found"
                )

            return test_case

        except HTTPException:
            raise

        except Exception as e:
            logger.error(
                f"[GET_TEST_CASE_ERROR] TestCaseID={test_case_id} Error={str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch test case"
            )

    # -------------------------------
    # Update Test Case
    # -------------------------------
    def update_test_case(
        self,
        db: Session,
        test_case_id: int,
        payload: dict,
        user: User
    ) -> TestCase:
        """
        Update allowed fields of a test case.

        Only whitelisted fields can be updated. Also triggers
        authentication credential detection if applicable.

        Args:
            db (Session): Active database session.
            test_case_id (int): ID of the test case to update.
            payload (dict): Fields to update.
            user (User): Authenticated user performing the update.

        Returns:
            TestCase: Updated test case instance.

        Raises:
            HTTPException:
                - 404 if test case not found
                - 500 if update fails
        """
        logger.info(
            f"[UPDATE_TEST_CASE_REQUEST] TestCaseID={test_case_id} UpdatedBy={user.id}"
        )

        try:
            test_case = db.query(TestCase).filter(
                TestCase.id == test_case_id
            ).first()

            if not test_case:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Test Case not found"
                )

            allowed_fields = {
                "title",
                "type",
                "data",
                "expected_outcome",
                "validation",
                "is_valid",
                "is_valid_default",
            }

            for field in allowed_fields:
                if field in payload:
                    setattr(test_case, field, payload[field])

            test_case.updated_on = datetime.now(timezone.utc)
            test_case.updated_by = user.id

            db.commit()
            db.refresh(test_case)

            logger.info(
                f"[UPDATE_TEST_CASE_SUCCESS] TestCaseID={test_case_id}"
            )

        except HTTPException:
            db.rollback()
            raise

        except Exception as e:
            db.rollback()
            logger.error(
                f"[UPDATE_TEST_CASE_ERROR] TestCaseID={test_case_id} Error={str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update test case"
            )

        # Post-processing (non-blocking logic)
        self._handle_auth_detection(test_case, db, user)

        return test_case

    # -------------------------------
    # Delete Test Case
    # -------------------------------
    def delete_test_case(
        self,
        db: Session,
        test_case_id: int,
        user: User
    ) -> None:
        """
        Delete a test case permanently.

        Args:
            db (Session): Active database session.
            test_case_id (int): ID of the test case to delete.
            user (User): Authenticated user performing deletion.

        Raises:
            HTTPException:
                - 404 if test case not found
                - 500 if deletion fails
        """
        logger.info(
            f"[DELETE_TEST_CASE_REQUEST] TestCaseID={test_case_id} DeletedBy={user.id}"
        )

        try:
            test_case = db.query(TestCase).filter(
                TestCase.id == test_case_id
            ).first()

            if not test_case:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Test Case not found"
                )

            db.delete(test_case)
            db.commit()

            logger.info(
                f"[DELETE_TEST_CASE_SUCCESS] TestCaseID={test_case_id}"
            )

        except HTTPException:
            db.rollback()
            raise

        except Exception as e:
            db.rollback()
            logger.error(
                f"[DELETE_TEST_CASE_ERROR] TestCaseID={test_case_id} Error={str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete test case"
            )

    # -------------------------------
    # Auth Detection
    # -------------------------------
    def _handle_auth_detection(self, test_case: TestCase, db: Session, user: User):
        """
        Detect login credentials from test case data and trigger update.

        This method:
        - Extracts username/password from selectors
        - Validates credentials
        - Calls async service to update page auth metadata

        Args:
            test_case (TestCase): Updated test case object.
            db (Session): Database session.
            user (User): Current user.

        Notes:
            - This method is non-blocking for main flow.
            - Failures are logged but do not interrupt execution.
        """
        try:
            if not test_case.is_valid_default:
                return

            data_json = test_case.data
            if not data_json:
                return

            if isinstance(data_json, str):
                data_json = json.loads(data_json)

            selectors = data_json.get("selectors", {})
            test_data = data_json.get("test_data", {})

            username = self._extract_value(selectors.get("username"), test_data)
            password = self._extract_value(selectors.get("password"), test_data)

            if self._is_valid_credential(username) and self._is_valid_credential(password):
                logger.info(
                    f"[AUTH_CREDENTIAL_DETECTED] TestCaseID={test_case.id}"
                )

                try:
                    anyio.from_thread.run(
                        page_service.auth_credential_update,
                        test_case.page_id,
                        db,
                        user
                    )
                except Exception as e:
                    logger.error(
                        f"[AUTH_UPDATE_FAILED] PageID={test_case.page_id} Error={str(e)}",
                        exc_info=True
                    )

        except json.JSONDecodeError:
            logger.warning(
                f"[AUTH_PARSE_FAILED] Invalid JSON | TestCaseID={test_case.id}"
            )

        except Exception as e:
            logger.error(
                f"[AUTH_CREDENTIAL_CHECK_FAILED] TestCaseID={test_case.id} Error={str(e)}",
                exc_info=True
            )

    # -------------------------------
    # Helpers
    # -------------------------------
    def _extract_value(self, selector: str, test_data: dict):
        """
        Extract value from test_data using selector.

        Args:
            selector (str): Selector string (e.g., "input#username").
            test_data (dict): Test data dictionary.

        Returns:
            str | None: Extracted value or None.
        """
        if not selector:
            return None
        key = selector.split("#")[-1]
        return test_data.get(key)

    def _is_valid_credential(self, value: str) -> bool:
        """
        Validate extracted credential value.

        Args:
            value (str): Credential value.

        Returns:
            bool: True if valid, False otherwise.
        """
        if not value:
            return False
        value = str(value).strip()
        if not value:
            return False
        if value.startswith("{") and value.endswith("}"):
            return False
        return True