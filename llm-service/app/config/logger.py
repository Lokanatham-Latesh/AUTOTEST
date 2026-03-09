import logging
from logging.handlers import TimedRotatingFileHandler
import os
from datetime import datetime

LOG_DIR = "logs-worker"
current_date = datetime.now().strftime("%Y-%m-%d")
LOG_FILE = f"autotest_{current_date}.log"

os.makedirs(LOG_DIR, exist_ok=True)

def setup_logger():
    logger = logging.getLogger("autotest")
    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    # ---- Formatter ----
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

    # ---- File Handler (rotates daily) ----
    file_handler = TimedRotatingFileHandler(
        filename=os.path.join(LOG_DIR, LOG_FILE),
        when="midnight",
        interval=1,
        backupCount=7,
        encoding="utf-8",
        utc=False
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)

    # ---- Console Handler ----
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.DEBUG)

    # ---- Avoid duplicate handlers ----
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

    return logger


logger = setup_logger()
