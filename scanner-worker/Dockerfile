FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

RUN groupadd -r workeruser && useradd -r -g workeruser workeruser

RUN pip install --no-cache-dir --upgrade pip wheel setuptools

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


COPY --chown=workeruser:workeruser worker.py .
USER workeruser

CMD ["python", "worker.py"]