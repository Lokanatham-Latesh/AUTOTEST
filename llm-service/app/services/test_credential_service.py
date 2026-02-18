import re
from datetime import datetime

from app.config.database import SessionLocal
from shared_orm.models.test_case_credential import TestCaseCredential


# ---------------------------------------------------------------------------
# Placeholder pattern:  {VALID_EMAIL}  {INVALID_PASSWORD}  etc.
# ---------------------------------------------------------------------------
PLACEHOLDER_RE = re.compile(r"\{(VALID|INVALID)_([A-Z_]+)\}")


class TestCredentialService:
    """
    Manages AI-generated values for test_data placeholders.

    Scoped by page_id — all test cases on the same page share credential
    values, but different pages are fully isolated from each other.

    Responsibilities
    ----------------
    1. scan_and_generate(page_id, test_cases)
         Called right after test case generation.
         Scans every test_data dict, finds all placeholders,
         generates any that don't already exist for this page, and stores them.
         Test cases with empty test_data are silently skipped.
         Test cases with is_valid=False are skipped — no point generating
         credentials for broken test cases that will never run.

    2. resolve(page_id, test_data) -> dict
         Called at runtime (test execution).
         Replaces every placeholder in test_data with its page-scoped stored value.
         If a placeholder is somehow missing, generates and stores it on the spot.
         Returns empty dict immediately for test cases with no test_data.

    Placeholder format
    ------------------
        {VALID_EMAIL}        →  stored under key "VALID_EMAIL"  for this page_id
        {INVALID_PASSWORD}   →  stored under key "INVALID_PASSWORD" for this page_id
    """

    def __init__(self, llm, logger):
        self.llm    = llm
        self.logger = logger

    # -----------------------------------------------------------------------
    # 1. SCAN & GENERATE  (called after test case generation)
    # -----------------------------------------------------------------------

    def scan_and_generate(self, page_id: int, test_cases: list) -> None:
        """
        Scans all valid test_case data dicts for placeholders,
        generates missing values via LLM scoped to page_id, and stores them.

        Args:
            page_id:    The page these test cases belong to.
            test_cases: List of TestCase ORM objects (already committed to DB).
        """
        all_placeholders = set()

        for tc in test_cases:

            # Skip broken test cases — they will never run so no point
            # generating credentials for their placeholders.
            if not tc.is_valid:
                self.logger.debug(
                    f"Skipping credential scan for test case '{tc.title}' "
                    f"(is_valid=False)"
                )
                continue

            # Test cases with empty test_data (e.g. UI-only) contribute nothing.
            test_data = tc.data.get("test_data", {})
            for value in test_data.values():
                if isinstance(value, str):
                    match = PLACEHOLDER_RE.fullmatch(value.strip())
                    if match:
                        # e.g. "VALID_EMAIL", "INVALID_PASSWORD"
                        all_placeholders.add(f"{match.group(1)}_{match.group(2)}")

        if not all_placeholders:
            self.logger.debug(f"No placeholders found for page {page_id} — skipping credential generation.")
            return

        with SessionLocal() as db:
            # Find which ones already exist for this page
            existing = db.query(TestCaseCredential).filter(
                TestCaseCredential.page_id == page_id,
                TestCaseCredential.placeholder_key.in_(all_placeholders)
            ).all()
            existing_keys = {row.placeholder_key for row in existing}

            missing = all_placeholders - existing_keys
            if not missing:
                self.logger.debug(f"All credentials already exist for page {page_id}.")
                return

            self.logger.info(f"Generating {len(missing)} credential(s) for page {page_id}: {missing}")

            for placeholder_key in missing:
                value = self._generate_value(placeholder_key)
                db.add(TestCaseCredential(
                    page_id=page_id,
                    placeholder_key=placeholder_key,
                    value=value,
                    created_on=datetime.utcnow()
                ))

            db.commit()
            self.logger.info(f"Stored {len(missing)} new credential(s) for page {page_id}.")

    # -----------------------------------------------------------------------
    # 2. RESOLVE  (called at test execution time)
    # -----------------------------------------------------------------------

    def resolve(self, page_id: int, test_data: dict) -> dict:
        """
        Replaces all placeholders in test_data with their page-scoped stored values.

        Args:
            page_id:   The page this test case belongs to.
            test_data: Raw dict from test_case.data["test_data"].
                       e.g. {"contact[email]": "{VALID_EMAIL}"}
                       e.g. {} for test cases that need no credentials.

        Returns:
            Resolved dict e.g. {"contact[email]": "testuser_abc@example.com"}
            Empty dict if test_data is empty (no credentials needed).
        """
        # Test cases with no test_data (e.g. UI interaction only) exit immediately
        if not test_data:
            return {}

        # Collect all placeholder keys referenced in this test_data
        needed_keys = set()
        for value in test_data.values():
            if isinstance(value, str):
                match = PLACEHOLDER_RE.fullmatch(value.strip())
                if match:
                    needed_keys.add(f"{match.group(1)}_{match.group(2)}")

        # test_data has values but none are placeholders — return as-is
        if not needed_keys:
            return dict(test_data)

        with SessionLocal() as db:
            rows = db.query(TestCaseCredential).filter(
                TestCaseCredential.page_id == page_id,
                TestCaseCredential.placeholder_key.in_(needed_keys)
            ).all()
            credential_map = {row.placeholder_key: row.value for row in rows}

            # Safety net: generate any that are still missing at resolve time
            missing = needed_keys - set(credential_map.keys())
            for placeholder_key in missing:
                self.logger.warning(
                    f"Credential missing at resolve time "
                    f"[page={page_id}, key={placeholder_key}] — generating now."
                )
                value = self._generate_value(placeholder_key)
                db.add(TestCaseCredential(
                    page_id=page_id,
                    placeholder_key=placeholder_key,
                    value=value,
                    created_on=datetime.utcnow()
                ))
                credential_map[placeholder_key] = value

            if missing:
                db.commit()

        # Substitute placeholders with resolved values
        resolved = {}
        for field, value in test_data.items():
            if isinstance(value, str):
                match = PLACEHOLDER_RE.fullmatch(value.strip())
                if match:
                    key = f"{match.group(1)}_{match.group(2)}"
                    resolved[field] = credential_map.get(key, value)
                    continue
            resolved[field] = value

        return resolved

    # -----------------------------------------------------------------------
    # LLM GENERATION
    # -----------------------------------------------------------------------

    def _generate_value(self, placeholder_key: str) -> str:
        """
        Uses the LLM to generate a concrete value for a given placeholder key.

        Args:
            placeholder_key: e.g. "VALID_EMAIL", "INVALID_PASSWORD", "VALID_USER_NAME"

        Returns:
            A single raw string value.
        """
        validity, _, field_type = placeholder_key.partition("_")
        is_valid = (validity == "VALID")

        system_prompt = (
            "You are a test data generator for automated UI testing. "
            "When asked, return ONLY the raw value — no explanation, no JSON, no quotes, no markdown."
        )

        user_prompt = (
            f"Generate a single {'VALID' if is_valid else 'INVALID'} test value "
            f"for a form field of type: {field_type.replace('_', ' ')}.\n\n"
            f"Rules:\n"
            f"- {'The value must be realistic and pass standard validation.' if is_valid else 'The value must clearly fail standard validation (wrong format, too short, illegal characters, etc.).'}\n"
            f"- Return ONLY the raw value. Nothing else.\n\n"
            f"Examples of VALID USER_NAME: John, Alice, Ravi Kumar\n"
            f"Examples of INVALID USER_NAME: fjbdhfbvhdfbvfd jbdfhbv @@ dhjfbvhd, 12345!@#$%\n\n"
            f"Examples of VALID EMAIL: testuser@example.com\n"
            f"Examples of INVALID EMAIL: notanemail, double@@at.com\n"
        )

        try:
            result = self.llm.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model_type="fast"
            )
            value = result.strip().strip('"').strip("'")
            self.logger.debug(f"Generated [{placeholder_key}] → {value!r}")
            return value

        except Exception as e:
            self.logger.error(f"LLM generation failed for {placeholder_key}: {e}")
            fallbacks = {
                "VALID_EMAIL":        "fallback_valid@example.com",
                "INVALID_EMAIL":      "not-an-email",
                "VALID_PASSWORD":     "Fallback@123",
                "INVALID_PASSWORD":   "123",
                "VALID_USER_NAME":    "John Doe",
                "INVALID_USER_NAME":  "@@##$$",
                "VALID_PHONE":        "9876543210",
                "INVALID_PHONE":      "abcde",
            }
            return fallbacks.get(placeholder_key, f"FALLBACK_{placeholder_key}")