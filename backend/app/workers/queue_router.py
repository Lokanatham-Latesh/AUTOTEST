from app.config.setting import settings
from app.workers.worker import worker_service

QUEUE_HANDLER_MAP = {
    settings.PAGE_STATUS_UPDATE_QUEUE: worker_service.process_page_status_update,
}