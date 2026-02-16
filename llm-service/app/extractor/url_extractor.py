"""
URL Extractor module for recursive URL discovery (Depth Controlled BFS)
"""

import time
from urllib.parse import urlparse, urljoin
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from app.config.setting import settings


class URLExtractor:
    """Recursive URL extractor with depth control using BFS"""

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
        if settings.PAGE_CRAWL_UNLIMITED:
            self.max_depth = float("inf") 
        else:
            self.max_depth = settings.PAGE_CRAWL_MAX_DEPTH  

    # ---------------------------------------------------------
    # Public Method
    # ---------------------------------------------------------
    def extract_urls(self, base_url):
        """
        Recursively extract internal HTML URLs using BFS
        with max depth control from settings
        """

        if self.logger:
            self.logger.info(
                f"Starting URL extraction from: {base_url} | Max Depth: {self.max_depth}"
            )

        try:
            parsed_base = urlparse(base_url)
            base_domain = parsed_base.netloc

            visited = set()
            to_visit = [(self.normalize_url(base_url), 0)]  # (url, depth)

            while to_visit:

                current_url, current_depth = to_visit.pop(0)

                if current_url in visited:
                    continue

                if current_depth > self.max_depth:
                    continue

                try:
                    time.sleep(1)

                    self.driver.get(current_url)

                    WebDriverWait(self.driver, 10).until(
                        EC.presence_of_element_located((By.TAG_NAME, "body"))
                    )

                    visited.add(current_url)

                    if self.logger:
                        self.logger.info(
                            f"Processing: {current_url} | Depth: {current_depth}"
                        )

                    # Stop expanding children if max depth reached
                    if current_depth == self.max_depth:
                        continue

                    links = self.driver.find_elements(By.TAG_NAME, "a")

                    for link in links:
                        href = link.get_attribute("href")
                        if not href:
                            continue

                        full_url = urljoin(current_url, href)
                        normalized_url = self.normalize_url(full_url)

                        parsed_url = urlparse(normalized_url)

                        # Only internal domain
                        if parsed_url.netloc != base_domain:
                            continue

                        if self.is_extension_url(normalized_url):
                            continue

                        if self.is_blocked_path(normalized_url):
                            continue

                        if (
                            normalized_url not in visited
                            and all(normalized_url != url for url, _ in to_visit)
                        ):
                            to_visit.append(
                                (normalized_url, current_depth + 1)
                            )

                except Exception as e:
                    if self.logger:
                        self.logger.error(
                            f"Failed to process {current_url}: {str(e)}"
                        )

            if self.logger:
                self.logger.info(
                    f"Total unique HTML URLs found: {len(visited)}"
                )

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
