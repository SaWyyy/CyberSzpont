FROM python:3.11-slim

WORKDIR /app

RUN groupadd -r workeruser && useradd -r -g workeruser workeruser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker.py .

RUN chown -R workeruser:workeruser /app

USER workeruser

ENV PYTHONUNBUFFERED=1

CMD ["python", "worker.py"]