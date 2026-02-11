"""
URL Extractor module for recursive URL discovery (Unlimited BFS)
"""

import time
from urllib.parse import urlparse, urljoin
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class URLExtractor:
    """Recursive URL extractor with filtering (no max limit)"""

    BLOCKED_EXTENSIONS = {
        ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp",
        ".pdf", ".txt", ".csv", ".json", ".xml",
        ".zip", ".rar", ".7z",
        ".mp4", ".webm", ".avi",
        ".doc", ".docx", ".xls", ".xlsx",
        ".bin"
    }

    BLOCKED_PATH_KEYWORDS = {
        "/download/",
        "/uploads/",
        "/files/",
        "/assets/",
        "/static/",
        "/media/"
    }

    def __init__(self, driver, logger=None):
        self.driver = driver
        self.logger = logger

    # ---------------------------------------------------------
    # Public Method
    # ---------------------------------------------------------
    def extract_urls(self, base_url):
        """
        Recursively extract all unique internal HTML URLs using BFS
        """

        if self.logger:
            self.logger.info(f"Starting recursive URL extraction from: {base_url}")

        try:
            parsed_base = urlparse(base_url)
            base_domain = parsed_base.netloc

            visited = set()
            to_visit = [self.normalize_url(base_url)]

            while to_visit:

                current_url = to_visit.pop(0)

                if current_url in visited:
                    continue

                try:
                    time.sleep(1)

                    self.driver.get(current_url)

                    WebDriverWait(self.driver, 10).until(
                        EC.presence_of_element_located((By.TAG_NAME, "body"))
                    )

                    visited.add(current_url)

                    if self.logger:
                        self.logger.info(f"Processing : {current_url}")

                    links = self.driver.find_elements(By.TAG_NAME, "a")

                    for link in links:
                        href = link.get_attribute("href")
                        if not href:
                            continue

                        full_url = urljoin(current_url, href)
                        normalized_url = self.normalize_url(full_url)

                        parsed_url = urlparse(normalized_url)

                        if parsed_url.netloc != base_domain:
                            continue

                        if self.is_extension_url(normalized_url):
                            if self.logger:
                                self.logger.debug(f"Skipping extension URL: {normalized_url}")
                            continue

                        if self.is_blocked_path(normalized_url):
                            if self.logger:
                                self.logger.debug(f"Skipping blocked path: {normalized_url}")
                            continue

                        if normalized_url not in visited and normalized_url not in to_visit:
                            to_visit.append(normalized_url)

                except Exception as e:
                    if self.logger:
                        self.logger.error(f"Failed to process {current_url}: {str(e)}")

            if self.logger:
                self.logger.info(f"Total unique HTML URLs found: {len(visited)}")

            return sorted(visited)

        except Exception as e:
            if self.logger:
                self.logger.error(f"URL extraction failed: {str(e)}")
            return []

    # ---------------------------------------------------------
    # Helper Methods
    # ---------------------------------------------------------

    def is_extension_url(self, url: str) -> bool:
        parsed = urlparse(url)
        path = parsed.path.lower()
        return any(path.endswith(ext) for ext in self.BLOCKED_EXTENSIONS)

    def is_blocked_path(self, url: str) -> bool:
        lower_url = url.lower()
        return any(keyword in lower_url for keyword in self.BLOCKED_PATH_KEYWORDS)

    def normalize_url(self, url: str) -> str:
        try:
            parsed = urlparse(url)
            path = parsed.path.rstrip("/") or "/"
            return f"{parsed.scheme}://{parsed.netloc}{path}"
        except Exception:
            return url
