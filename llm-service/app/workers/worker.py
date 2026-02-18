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
from shared_orm.models.test_scenario import TestScenario


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
                            is_auth_detected=False,  # Default to False, will be detected later
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

    # ---------------- PAGE ANALYSE ---------------- #
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

    # ---------------- TEST SCENARIO GENERATION ---------------- #
    async def process_test_scenario(self, body: dict):
        logger.info(f"[TEST_SCENARIO] Started | payload={body}")
        page_id = body["page_id"]
        requested_by = body["requested_by"]

        db = SessionLocal()

        try:
            llm = LLMWrapper()
            prompt_manager = PromptManager()
            service = TestScenarioService(
                llm=llm,
                prompt_manager=prompt_manager,
                logger=logger
            )

            loop = asyncio.get_running_loop()

            await loop.run_in_executor(
                None,
                service.generate,
                page_id,
                requested_by
            )

            # Check if any scenarios require authentication
            auth_required = self._detect_auth_requirements(db, page_id)
            
            if auth_required:
                # Update page to mark it as requiring auth
                page = db.query(Page).filter(Page.id == page_id).first()
                if page:
                    page.auth_required = True
                    page.updated_on = datetime.utcnow()
                    page.updated_by = requested_by
                    db.commit()
                    logger.info(f"[TEST_SCENARIO] Page {page_id} marked as auth_required=True")

            await rabbitmq_producer.publish_message(
                settings.TEST_CASE_QUEUE,
                {
                    "event": "TEST_CASE_GENERATE",
                    "page_id": page_id,
                    "requested_by": requested_by,
                    "timestamp": datetime.utcnow().isoformat()
                },
                priority=5
            )
            logger.info(f"[TEST_SCENARIO] Completed | page_id={page_id}")

        except Exception as e:
            logger.exception("[TEST_SCENARIO] Failed")
            raise

        finally:
            db.close()

    # ---------------- TEST CASE GENERATION ---------------- #
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

            
            # After test case generation, check for new pages discovered during auth flows
            await self._process_post_auth_pages(page_id, requested_by)

            logger.info(f"[TEST_CASE] Completed | page_id={page_id}")

        except Exception:
            logger.exception("[TEST_CASE] Failed")
            raise

    # ---------------- AUTH DETECTION ---------------- #
    def _detect_auth_requirements(self, db, page_id: int) -> bool:
        """
        Detect if any test scenarios for this page require authentication.
        Updates the requires_auth flag on individual scenarios.
        Returns True if at least one scenario requires auth.
        """
        scenarios = db.query(TestScenario).filter(
            TestScenario.page_id == page_id
        ).all()
        
        auth_keywords = [
            'login', 'signin', 'sign in', 'log in', 'authenticate',
            'password', 'username', 'email', 'credential',
            'register', 'signup', 'sign up', 'account'
        ]
        
        auth_selectors = [
            'login', 'signin', 'password', 'username', 'email',
            'auth', 'credential', 'register', 'signup'
        ]
        
        has_auth_scenario = False
        
        for scenario in scenarios:
            requires_auth = False
            
            # Check title
            title_lower = scenario.title.lower() if scenario.title else ""
            if any(keyword in title_lower for keyword in auth_keywords):
                requires_auth = True
            
            # Check scenario data
            if scenario.data:
                data_str = str(scenario.data).lower()
                
                # Check for auth-related actions in steps
                if 'steps' in scenario.data:
                    for step in scenario.data['steps']:
                        if isinstance(step, dict):
                            action = step.get('action', '').lower()
                            target = str(step.get('target', '')).lower()
                            
                            # Check if action or target contains auth keywords
                            if any(keyword in action for keyword in auth_keywords):
                                requires_auth = True
                            if any(keyword in target for keyword in auth_keywords):
                                requires_auth = True
                
                # Check for auth-related URLs
                if 'entry_point' in scenario.data:
                    entry_point = scenario.data['entry_point'].lower()
                    if any(keyword in entry_point for keyword in auth_keywords):
                        requires_auth = True
                
                # Check flow structure for auth patterns
                if 'flow_structure' in scenario.data:
                    flow_str = str(scenario.data['flow_structure']).lower()
                    if any(keyword in flow_str for keyword in auth_selectors):
                        requires_auth = True
                
                # Check category
                if scenario.category and 'auth' in scenario.category.lower():
                    requires_auth = True
            
            # Update the scenario's requires_auth flag
            if requires_auth:
                scenario.requires_auth = True
                has_auth_scenario = True
                logger.info(f"[AUTH_DETECT] Scenario '{scenario.title}' (ID: {scenario.id}) requires authentication")
            
        db.commit()
        
        return has_auth_scenario
    
    # ---------------- POST-AUTH PAGE DISCOVERY ---------------- #
    async def _process_post_auth_pages(self, page_id: int, requested_by: int):
        """
        Check if test cases for this page discovered new pages during auth flows.
        Extract and analyze any new pages found.
        """
        db = SessionLocal()
        
        try:
            page = db.query(Page).filter(Page.id == page_id).first()
            if not page or not page.auth_required:
                return
            
            # Get all test cases for this page
            from shared_orm.models.test_case import TestCase
            test_cases = db.query(TestCase).filter(
                TestCase.page_id == page_id
            ).all()
            
            discovered_urls = set()
            
            # Extract post-auth landing pages from test cases
            for test_case in test_cases:
                if test_case.data and 'post_auth_landing_url' in test_case.data:
                    landing_url = test_case.data['post_auth_landing_url']
                    discovered_urls.add(landing_url)
                
                # Also check expected_outcome for redirect URLs
                if test_case.expected_outcome and 'redirect_url' in test_case.expected_outcome:
                    redirect_url = test_case.expected_outcome['redirect_url']
                    discovered_urls.add(redirect_url)
            
            # Process each discovered URL
            for url in discovered_urls:
                await self._handle_discovered_page(db, url, page.site_id, requested_by)
            
        finally:
            db.close()

    # ---------------- HANDLE DISCOVERED PAGE ---------------- #
    async def _handle_discovered_page(self, db, url: str, site_id: int, requested_by: int):
        """
        Handle a newly discovered page from post-auth flow.
        Checks if it exists, if not, triggers full extraction and analysis.
        """
        # Check if page already exists
        existing_page = db.query(Page).filter(Page.page_url == url).first()
        
        if existing_page:
            logger.info(f"[DISCOVERED_PAGE] Page already exists: {url}")
            return
        
        logger.info(f"[DISCOVERED_PAGE] New page discovered: {url}, triggering extraction")
        
        # Create new page entry
        new_page = Page(
            site_id=site_id,
            page_url=url,
            status="new",
            auth_required=False,
            created_on=datetime.utcnow(),
            created_by=requested_by,
        )
        db.add(new_page)
        db.commit()
        db.refresh(new_page)
        
        # Trigger PAGE_EXTRACT for this specific URL
        # This will extract all links from the post-auth landing page
        await rabbitmq_producer.publish_message(
            settings.PAGE_EXTRACT_QUEUE,
            {
                "event": "PAGE_EXTRACT_SINGLE",
                "site_id": site_id,
                "site_url": url,
                "page_id": new_page.id,
                "requested_by": requested_by,
                "timestamp": datetime.utcnow().isoformat()
            },
            priority=6  # Higher priority for post-auth pages
        )

    # ---------------- SINGLE PAGE EXTRACTION ---------------- #
    async def process_page_extract_single(self, body: dict):
        """
        Extract URLs from a single page (used for post-auth discovered pages).
        This is different from full site extraction.
        """
        logger.info(f"[PAGE_EXTRACT_SINGLE] Started | payload={body}")

        site_id = body["site_id"]
        site_url = body["site_url"]
        page_id = body["page_id"]
        requested_by = body["requested_by"]

        db = SessionLocal()

        try:
            loop = asyncio.get_running_loop()
            driver = get_driver()
            extractor = URLExtractor(driver, logger)

            try:
                # Extract URLs from this specific page
                urls = await loop.run_in_executor(
                    None, extractor.extract_urls, site_url
                )

                base_domain = urlparse(site_url).netloc
                site = db.query(Site).filter(Site.id == site_id).first()

                if not site:
                    logger.warning(f"Site {site_id} not found")
                    return

                # Add newly discovered pages
                for url in urls:
                    # Check if page already exists
                    if not db.query(Page).filter(Page.page_url == url).first():
                        db.add(Page(
                            site_id=site.id,
                            page_url=url,
                            status="new",
                            auth_required=False,
                            created_on=datetime.utcnow(),
                            created_by=requested_by,
                        ))

                    # Handle site aliases
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

            logger.info(f"[PAGE_EXTRACT_SINGLE] Completed | page_id={page_id}")

            # Now analyze the original page and all newly discovered pages
            pages_to_analyze = db.query(Page).filter(
                Page.site_id == site_id,
                Page.status == "new"
            ).all()

            for page in pages_to_analyze:
                await rabbitmq_producer.publish_message(
                    settings.PAGE_ANALYSE_QUEUE,
                    {
                        "event": "PAGE_ANALYSE",
                        "page_id": page.id,
                        "requested_by": requested_by,
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    priority=6  # Higher priority for post-auth pages
                )

        finally:
            db.close()
                
worker_service = WorkerService()