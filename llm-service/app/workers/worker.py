from datetime import datetime
from urllib.parse import urlparse
import asyncio

from app.config.logger import logger
from app.services.selenium_driver import get_driver
from app.extractor.url_extractor import URLExtractor
from app.services.page_analysis_service import PageAnalysisService
from app.llm.llm_wrapper import LLMWrapper
from app.llm.prompt_manager import PromptManager
from app.services.rabbitmq_producer import rabbitmq_producer
from app.config.database import SessionLocal
from app.config.setting import settings
from app.services.test_scenario_service import TestScenarioService
from app.services.test_case_service import TestCaseService


from shared_orm.models.site import Site
from shared_orm.models.page import Page
from shared_orm.models.site_alias import SiteAlias


class WorkerService:

    # ---------------- PAGE EXTRACT ---------------- #
    async def process_page_extract(self, body: dict):
        logger.info(f"[PAGE_EXTRACT] Started | payload={body}")

        site_id = body["site_id"]
        site_url = body["site_url"]
        requested_by = body["requested_by"]

        db = SessionLocal()

        try:
            site = db.query(Site).filter(Site.id == site_id).first()
            if not site or site.status == "Pause":
                return

            site.status = "Processing"
            site.updated_on = datetime.utcnow()
            site.updated_by = requested_by
            db.commit()

            loop = asyncio.get_running_loop()

            driver = get_driver()
            extractor = URLExtractor(driver, logger)

            try:
                urls = await loop.run_in_executor(
                    None, extractor.extract_urls, site_url
                )

                base_domain = urlparse(site_url).netloc

                for url in urls:
                    if not db.query(Page).filter(Page.page_url == url).first():
                        db.add(Page(
                            site_id=site.id,
                            page_url=url,
                            status="new",
                            created_on=datetime.utcnow(),
                            created_by=requested_by,
                        ))

                    parsed = urlparse(url)
                    if parsed.netloc != base_domain:
                        if not db.query(SiteAlias).filter(
                            SiteAlias.site_id == site.id,
                            SiteAlias.site_alias_url == parsed.netloc
                        ).first():
                            db.add(SiteAlias(
                                site_id=site.id,
                                site_alias_url=parsed.netloc
                            ))

                db.commit()

            finally:
                driver.quit()

         

            logger.info(f"[PAGE_EXTRACT] Completed | site_id={site.id}")

            # Emit PAGE_ANALYSE events PER PAGE
            pages = db.query(Page).filter(
                Page.site_id == site.id,
                Page.status == "new"
            ).all()

            for page in pages:
                await rabbitmq_producer.publish_message(
                    settings.PAGE_ANALYSE_QUEUE,
                    {
                        "event": "PAGE_ANALYSE",
                        "page_id": page.id,
                        "requested_by": requested_by,
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    priority=5
                )

        finally:
            db.close()

    async def process_page_analyse(self, body: dict):
        logger.info(f"[PAGE_ANALYSE] Started | payload={body}")

        page_id = body["page_id"]
        requested_by = body["requested_by"]

        db = SessionLocal()

        page = db.query(Page).filter(Page.id == page_id).first()
        if not page or page.status != "new":
            db.close()
            return

        page.status = "generating_metadata"
        db.commit()

        driver = get_driver()
        llm = LLMWrapper()
        prompt_manager = PromptManager()

        analyzer = PageAnalysisService(
            driver=driver,
            logger=logger,
            llm=llm,
            prompt_manager=prompt_manager
        )

        loop = asyncio.get_running_loop()

        try:
            await loop.run_in_executor(
                None,
                analyzer.analyze_page,
                page.id,
                page.page_url,
                requested_by
            )

            await rabbitmq_producer.publish_message(
                settings.TEST_SCENARIO_QUEUE,
                {
                    "event": "TEST_SCENARIO_GENERATE",
                     "page_id": page.id,
                    "requested_by": requested_by,
                    "timestamp": datetime.utcnow().isoformat()
                },
                priority=5
            )

        except Exception:
            page.status = "new"
            db.commit()
            raise

        finally:
            driver.quit()
            db.close()

    async def process_test_scenario(self, body: dict):
        logger.info(f"[TEST_SCENARIO] Started | payload={body}")
        page_id = body["page_id"]
        requested_by = body["requested_by"]
        llm = LLMWrapper()
        prompt_manager = PromptManager()
        service = TestScenarioService(
            llm=llm,
            prompt_manager=prompt_manager,
            logger=logger
        )
        loop = asyncio.get_running_loop()
        try:
            await loop.run_in_executor(
                None,
                service.generate,
                page_id,
                requested_by
            )
            # await rabbitmq_producer.publish_message(
            #     settings.TEST_CASE_QUEUE,
            #     {
            #         "event": "TEST_CASE_GENERATE",
            #         "page_id": page_id,
            #         "requested_by": requested_by,
            #         "timestamp": datetime.utcnow().isoformat()
            #     },
            #     priority=5
            # )
            logger.info(f"[TEST_SCENARIO] Completed | page_id={page_id}")
        except Exception as e:
            logger.exception("[TEST_SCENARIO] Failed")
            raise

    async def process_test_case(self, body: dict):
        logger.info(f"[TEST_CASE] Started | payload={body}")
        page_id = body["page_id"]
        requested_by = body["requested_by"]
        llm = LLMWrapper()
        prompt_manager = PromptManager()
        service = TestCaseService(
            llm=llm,
            prompt_manager=prompt_manager,
            logger=logger
        )
        loop = asyncio.get_running_loop()
        try:
            await loop.run_in_executor(
                None,
                service.generate,
                page_id,
                requested_by
            )
              # OPTIONAL: next step → script generation
            logger.info(f"[TEST_CASE] Completed | page_id={page_id}")
        except Exception:
            logger.exception("[TEST_CASE] Failed")
            raise
                
worker_service = WorkerService()