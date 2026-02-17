from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from shared_orm.models.test_case import TestCase
from shared_orm.models.user import User
from app.config.logger import logger


class TestCaseService:
    """
    Service layer responsible for handling Test Case
    business logic including retrieval and updates.
    """

    # -------------------------------
    # Get Test Case Details
    # -------------------------------
    def get_test_case_by_id(self, db: Session, test_case_id: int) -> TestCase:
        """
        Retrieve a test case by its ID.

        Args:
            db (Session): Active database session.
            test_case_id (int): ID of the test case.

        Returns:
            TestCase: Retrieved test case instance.

        Raises:
            HTTPException: If test case is not found.
        """

        logger.info(
            f"[GET_TEST_CASE_REQUEST] TestCaseID={test_case_id}"
        )

        test_case = (
            db.query(TestCase)
            .options(joinedload(TestCase.scenario))
            .filter(TestCase.id == test_case_id)
            .first()
        )

        if not test_case:
            logger.warning(
                f"[GET_TEST_CASE_FAILED] TestCase not found | TestCaseID={test_case_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test Case not found"
            )

        logger.info(
            f"[GET_TEST_CASE_SUCCESS] TestCaseID={test_case_id}"
        )

        return test_case

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

        Allowed updatable fields:
        - title
        - type
        - data
        - expected_outcome
        - validation
        - is_valid
        - is_valid_default

        Args:
            db (Session): Active database session.
            test_case_id (int): ID of the test case to update.
            payload (dict): Dictionary of fields to update.
            user (User): Authenticated user performing update.

        Returns:
            TestCase: Updated test case instance.

        Raises:
            HTTPException: If test case does not exist.
        """

        logger.info(
            f"[UPDATE_TEST_CASE_REQUEST] TestCaseID={test_case_id} UpdatedBy={user.id}"
        )

        test_case = db.query(TestCase).filter(
            TestCase.id == test_case_id
        ).first()

        if not test_case:
            logger.warning(
                f"[UPDATE_TEST_CASE_FAILED] TestCase not found | TestCaseID={test_case_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test Case not found"
            )

        # Whitelisted fields for update
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

        # Audit fields
        test_case.updated_on = datetime.utcnow()
        test_case.updated_by = user.id

        db.commit()
        db.refresh(test_case)

        logger.info(
            f"[UPDATE_TEST_CASE_SUCCESS] TestCaseID={test_case_id} UpdatedBy={user.id}"
        )

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
        Permanently delete a test case by its ID.

        Args:
            db (Session): Active database session.
            test_case_id (int): ID of the test case to delete.
            user (User): Authenticated user performing deletion.

        Raises:
            HTTPException: If test case does not exist.
        """
        logger.info(
            f"[DELETE_TEST_CASE_REQUEST] TestCaseID={test_case_id} DeletedBy={user.id}"
        )
        test_case = db.query(TestCase).filter(
            TestCase.id == test_case_id
        ).first()
        if not test_case:
            logger.warning(
                f"[DELETE_TEST_CASE_FAILED] TestCase not found | TestCaseID={test_case_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test Case not found"
            )
        db.delete(test_case)
        db.commit()
        logger.info(
            f"[DELETE_TEST_CASE_SUCCESS] TestCaseID={test_case_id} DeletedBy={user.id}"
        )
        
        

        
