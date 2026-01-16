from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup


class NavigationExtractor:

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.base_domain = urlparse(base_url).netloc

    def extract(self, html: str):
        soup = BeautifulSoup(html, "html.parser")
        events = []

        for a in soup.find_all("a", href=True):
            href = a.get("href").strip()

            if href.startswith("#") or href.lower().startswith("javascript"):
                continue

            target_url = urljoin(self.base_url, href)
            parsed = urlparse(target_url)

            if parsed.netloc and parsed.netloc != self.base_domain:
                continue  # external link

            events.append({
                "target_url": target_url,
                "selector": self._build_selector(a),
                "description": f"Click link '{a.get_text(strip=True)}'"
            })

        return events

    def _build_selector(self, el):
        if el.get("id"):
            return f"#{el.get('id')}"
        if el.get("class"):
            return "." + ".".join(el.get("class"))
        return el.name
