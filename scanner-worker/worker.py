import os
import json
import time
import logging
from minio import Minio
import redis
import psycopg2
import pyclamd

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "admin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "password123")
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
DB_HOST = os.getenv("DB_HOST", "postgres")
DB_USER = os.getenv("DB_USER", "secuser")
DB_PASS = os.getenv("DB_PASS", "secpassword")
DB_NAME = os.getenv("DB_NAME", "secuscan")
CLAMAV_HOST = os.getenv("CLAMAV_HOST", "clamav")

minio_client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=False)
redis_client = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)


def update_scan_status(file_id, status, result=None):
    """Aktualizuje status skanowania w bazie PostgreSQL"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE scans SET status = %s, result = %s WHERE id = %s",
            (status, result, file_id)
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Błąd aktualizacji bazy danych dla {file_id}: {e}")

def process_queue():
    cd = pyclamd.ClamdNetworkSocket(CLAMAV_HOST, 3310)
    logger.info("Worker nasłuchuje na kolejce Redis (scan_queue)...")

    while True:
        try:
            task = redis_client.brpop("scan_queue", timeout=0)
            if not task:
                continue

            data = json.loads(task[1])
            file_id = data.get("id")
            filename = data.get("filename")
            
            logger.info(f"Pobrano zadanie skanowania: {filename} ({file_id})")
            update_scan_status(file_id, "SCANNING")

            try:
                response = minio_client.get_object("uploads", file_id)
                file_data = response.read()
                response.close()
                response.release_conn()
            except Exception as e:
                logger.error(f"Nie udało się pobrać pliku {file_id} z MinIO: {e}")
                update_scan_status(file_id, "ERROR", "Błąd pobierania pliku")
                continue

            logger.info(f"Skanowanie pliku: {filename}...")
            scan_result = cd.scan_stream(file_data)

            status = "CLEAN"
            virus_name = "Brak zagrożeń"
            
            if scan_result and scan_result.get('stream'):
                if scan_result['stream'][0] == 'FOUND':
                    status = "INFECTED"
                    virus_name = scan_result['stream'][1]
                    logger.warning(f"WYKRYTO ZAGROŻENIE w {filename}: {virus_name}")

            update_scan_status(file_id, status, virus_name)

            minio_client.remove_object("uploads", file_id)
            logger.info(f"Zakończono skanowanie i usunięto plik źródłowy: {filename} -> {status}")

        except Exception as e:
            logger.error(f"Błąd krytyczny w pętli workera: {e}")
            time.sleep(2)
if __name__ == "__main__":
    process_queue()