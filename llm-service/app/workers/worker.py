from datetime import datetime
from urllib.parse import urlparse

from app.config.logger import logger
from app.config.database import get_db
from app.services.selenium_driver import get_driver
from app.extractor.url_extractor import URLExtractor

from shared_orm.models.site import Site
from shared_orm.models.page import Page
from shared_orm.models.site_alias import SiteAlias
from app.config.database import SessionLocal



class WorkerService:

    async def process_site_analyse(self, body: dict):
        """
        Handles SITE_ANALYSE_QUEUE
        Currently just forwards to PAGE_EXTRACT flow
        """
        logger.info(f"[SITE_ANALYSE] Started | payload={body}")

        site_id = body.get("site_id")
        site_url = body.get("site_url")

        if not site_id or not site_url:
            raise ValueError("site_id or site_url missing")

        # No DB update here
        # Real work happens in PAGE_EXTRACT
        logger.info(f"[SITE_ANALYSE] Queued site_id={site_id} for extraction")

    async def process_page_extract(self, body: dict):
        """
        Handles PAGE_EXTRACT_QUEUE
        Extracts pages and updates DB
        """
        logger.info(f"[PAGE_EXTRACT] Started | payload={body}")

        site_id = body.get("site_id")
        site_url = body.get("site_url")
        requested_by = body.get("requested_by")

        if not site_id or not site_url:
            raise ValueError("site_id or site_url missing")

        db = SessionLocal()

        try:
            site = db.query(Site).filter(Site.id == site_id).first()
            if not site:
                logger.warning("Site not found")
                return

            if site.status == "Pause":
                logger.info("Site paused before extraction")
                return

            site.status = "Processing"
            site.updated_on = datetime.utcnow()
            site.updated_by = requested_by
            db.commit()

            driver = get_driver()
            extractor = URLExtractor(driver, logger)

            try:
                urls = extractor.extract_urls(site_url)
                base_domain = urlparse(site_url).netloc

                for url in urls:
                    db.refresh(site)
                    if site.status == "Pause":
                        logger.info("Site paused during extraction")
                        return

                    exists = db.query(Page).filter(Page.page_url == url).first()
                    if not exists:
                        db.add(
                            Page(
                                site_id=site.id,
                                page_url=url,
                                status="New",
                                created_on=datetime.utcnow(),
                                created_by=requested_by,
                            )
                        )

                    parsed = urlparse(url)
                    if parsed.netloc != base_domain:
                        alias_exists = db.query(SiteAlias).filter(
                            SiteAlias.site_id == site.id,
                            SiteAlias.site_alias_url == parsed.netloc
                        ).first()

                        if not alias_exists:
                            db.add(
                                SiteAlias(
                                    site_id=site.id,
                                    site_alias_url=parsed.netloc
                                )
                            )

                db.commit()

                site.status = "Done"
                site.updated_on = datetime.utcnow()
                db.commit()

                logger.info(f"[PAGE_EXTRACT] Completed | site_id={site.id}")

            finally:
                driver.quit()

        except Exception as e:
            logger.exception(f"[PAGE_EXTRACT] Failed | error={e}")
            raise

        finally:
            db.close()

    async def process_llm_task(self, body: dict):
        """
        Handles LLM_QUEUE
        (Future implementation)
        """
        logger.info(f"[LLM] Started | payload={body}")

        task_id = body.get("task_id")
        content = body.get("content")

        if not task_id or not content:
            raise ValueError("task_id or content missing")

        logger.info(f"[LLM] Task received | task_id={task_id}")

worker_service = WorkerService()