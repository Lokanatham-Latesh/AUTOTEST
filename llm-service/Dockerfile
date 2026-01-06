FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libxshmfence1 \
    libdrm2 \
    libxdamage1 \
    libxrandr2 \
    libu2f-udev \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/*


# Copy shared FIRST
COPY shared /app/shared

# Copy llm service code
COPY llm-service /app/llm-service

# Install deps
RUN pip install --upgrade pip \
    && pip install -r /app/llm-service/requirements.txt

# Set working directory to app root
WORKDIR /app/llm-service

CMD ["python", "main.py"]
