FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc default-libmysqlclient-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy ONLY shared package (needed for pip install)
COPY shared /app/shared

# Copy ONLY requirements file
COPY backend/requirements.txt /app/backend/requirements.txt

# Install deps (cached unless shared or requirements change)
RUN pip install --upgrade pip \
    && pip install -r /app/backend/requirements.txt

# Now copy actual backend code
COPY backend /app/backend

WORKDIR /app/backend

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]