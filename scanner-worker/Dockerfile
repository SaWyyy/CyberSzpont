FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

RUN groupadd -r workeruser && useradd -r -g workeruser workeruser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


COPY --chown=workeruser:workeruser worker.py .
USER workeruser

CMD ["python", "worker.py"]