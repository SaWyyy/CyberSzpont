# Dokumentacja Wdrożenia Kubernetes - Projekt SecuScan

---

## 1. Struktura i Manifesty Wdrożeniowe

### 1.1 Przestrzeń nazw (Namespace)
Cały system został wdrożony w dedykowanej, odizolowanej przestrzeni nazw `secuscan-ns`. 

### 1.2 Obiekty obliczeniowe (Deployment / StatefulSet / Job)
W projekcie wykorzystano różne typy kontrolerów w zależności od charakterystyki pracy mikrousługi:

* **Deployment (`frontend`, `upload-service`, `scanner-worker`, `redis`, `clamav`):**
  * Zastosowany dla usług bezstanowych (stateless). 
  * W przypadku `upload-service` oraz `scanner-worker` zastosowano konfigurację z wieloma replikami (2 pod'y działające równolegle), co pozwala na równoważenie obciążenia przy jednoczesnym napływie wielu plików do skanowania.
  * Deployment zapewnia deklaratywne aktualizacje (Rolling Updates) bez przerw w dostępie do usługi.
* **StatefulSet (`postgres`, `minio`):**
  * Zastosowany dla relacyjnej bazy danych i magazynu obiektowego.
  * Aplikacje stanowe (stateful) wymagają gwarancji unikalności i spójności tożsamości sieciowej oraz stabilnego podpięcia wolumenów z danymi, niezależnie od restartu poda.
* **Job (`db-init-job`):**
  * Wykorzystany do jednorazowego uruchomienia skryptu inicjalizującego bazę danych (tworzenie tabel za pomocą skryptu z ConfigMapy), który kończy się statusem `Completed` i zwalnia zasoby obliczeniowe po wykonaniu zadania.

### 1.3 Komunikacja sieciowa (Services)
W całym projekcie użyto wyłącznie typu **ClusterIP** dla każdego mikroserwisu.
* Z punktu widzenia bezpieczeństwa aplikacji w modelu Zero-Trust, żadna usługa nie powinna być bezpośrednio wystawiona na zewnątrz klastra za pomocą `NodePort` czy `LoadBalancer`. Wszystkie serwisy komunikują się wyłącznie po sieci wewnętrznej, a jedyną bramą wejściową do klastra jest dedykowany Ingress.

### 1.4 Dostęp z zewnątrz (Ingress)
Rolę bramy wejściowej pełni Nginx Ingress Controller.
* Ingress pozwala na optymalne zarządzenie ruchem z zewnątrz, wpuszczając zapytania z jednej domeny (`secuscan.local`) i rozdzielając je ścieżkami:
  * `/api` -> do serwisu `upload-service-svc` (Backend FastAPI)
  * `/` -> reszta ruchu przechwytywana przez `frontend-svc` (React/Vite).
* Zastosowanie Ingressa zapobiega powielaniu adresów IP oraz umożliwia łatwe zaimplementowanie w przyszłości certyfikatów SSL/TLS na poziomie samego kontrolera.

### 1.5 Przechowywanie danych (PV / PVC / StorageClass)
Trwałość danych zrealizowano z wykorzystaniem `PersistentVolumeClaims`.
* Baza danych (PostgreSQL) oraz serwer plików (MinIO) używają tzw. `volumeClaimTemplates` wbudowanych w ich definicje `StatefulSet`.
* Dzięki temu K8s dynamicznie alokuje dyski `PersistentVolume` i przypina je do podów. Nawet po twardym restarcie bazy danych lub magazynu, pliki i logi skanowania nie ulegają zniszczeniu.

### 1.6 Zarządzanie konfiguracją i sekretami (ConfigMap / Secrets)
Projekt w pełni oddziela kod aplikacji od konfiguracji.
* **ConfigMap (`secuscan-config`):** Przechowuje dane jawne, takie jak nazwa bazy danych (`DB_NAME`), login użytkownika (`DB_USER`) oraz adresy wewnętrzne usług. 
* **Secrets (`secuscan-secrets`, `dhi-registry-secret`):** Przechowuje krytyczne hasła (kodowane algorytmem Base64) oraz tokeny do zewnętrznych rejestrów obrazów (jako typ `kubernetes.io/dockerconfigjson`).
* Rozdzielenie tych obiektów pozwala na trzymanie infrastruktury w repozytorium GitHub, przy jednoczesnym ignorowaniu plików z sekretami (`.gitignore`), co całkowicie zapobiega wyciekom danych uwierzytelniających.