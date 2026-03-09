FROM python:3.11-slim

WORKDIR /app

# DEVSECOPS: Użytkownik non-root
RUN groupadd -r workeruser && useradd -r -g workeruser workeruser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker.py .

RUN chown -R workeruser:workeruser /app

USER workeruser

# DEVSECOPS / DEVOPS: Python streamuje logi prosto do konsoli (bez opóźnień)
ENV PYTHONUNBUFFERED=1

# Uruchomienie skryptu
CMD ["python", "worker.py"]