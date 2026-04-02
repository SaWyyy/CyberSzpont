import os
import uuid
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from minio import Minio
import redis
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(title="SecuScan Upload API")

# Konfiguracja CORS (pozwala na komunikację z Reactem)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# Pobieranie konfiguracji ze zmiennych środowiskowych (Praktyka DevSecOps!)
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "admin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "password123")
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
DB_HOST = os.getenv("DB_HOST", "postgres")
DB_USER = os.getenv("DB_USER", "secuser")
DB_PASS = os.getenv("DB_PASS", "secpassword")
DB_NAME = os.getenv("DB_NAME", "secuscan")

# Klienci do usług zewnętrznych
minio_client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=False)
redis_client = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)

@app.on_event("startup")
def startup_event():
    # Sprawdzenie, czy bucket (magazyn) na pliki istnieje w MinIO
    if not minio_client.bucket_exists("uploads"):
        minio_client.make_bucket("uploads")

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    filename = file.filename

    try:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        minio_client.put_object("uploads", file_id, file.file, length=file_size, part_size=10*1024*1024)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Błąd zapisu pliku w magazynie.")

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO scans (id, filename, status) VALUES (%s, %s, %s)",
            (file_id, filename, "PENDING")
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Błąd zapisu w bazie danych.")

    try:
        task = {"id": file_id, "filename": filename}
        redis_client.lpush("scan_queue", json.dumps(task))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Błąd komunikacji z kolejką.")

    return {"id": file_id, "status": "PENDING", "message": "Plik przyjęty do skanowania"}

@app.get("/api/results")
def get_results():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, filename, status, result FROM scans ORDER BY created_at DESC LIMIT 20")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail="Błąd pobierania wyników z bazy danych.")