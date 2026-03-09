# Używamy lekkiego obrazu Python
FROM python:3.11-slim

# Ustawiamy katalog roboczy
WORKDIR /app

# DEVSECOPS: Tworzymy użytkownika bez uprawnień roota
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Kopiujemy plik wymagań i instalujemy paczki
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy kod aplikacji
COPY main.py .

# DEVSECOPS: Przekazujemy własność plików nowemu użytkownikowi
RUN chown -R appuser:appuser /app

# DEVSECOPS: Zmieniamy kontekst wykonania na użytkownika non-root
USER appuser

# Wystawiamy port 8000
EXPOSE 8000

# Polecenie uruchamiające serwer (Uvicorn)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]