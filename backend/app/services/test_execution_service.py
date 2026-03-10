
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from shared_orm.models.test_execution import TestExecution
from shared_orm.models.user import User
from app.config.logger import logger


class TestExecutionService:

    def get_executions_by_test_case(
        self,
        test_case_id: int,
        db: Session,
        user: User
    ):
        try:
            logger.info(
                f"[GET_TEST_EXECUTIONS_REQUEST] User={user.id} TestCaseID={test_case_id}"
            )

            executions = (
                db.query(TestExecution)
                .filter(TestExecution.test_case_id == test_case_id)
                .order_by(desc(TestExecution.executed_on))
                .all()
            )

            if not executions:
                logger.info(
                    f"[GET_TEST_EXECUTIONS_EMPTY] TestCaseID={test_case_id}"
                )
                return []

            logger.info(
                f"[GET_TEST_EXECUTIONS_SUCCESS] "
                f"TestCaseID={test_case_id} Count={len(executions)}"
            )

            return executions

        except HTTPException:
            raise

        except Exception as e:
            logger.error(
                f"[GET_TEST_EXECUTIONS_ERROR] TestCaseID={test_case_id} Error={str(e)}"
            )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch test execution details"
            )