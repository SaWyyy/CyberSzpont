## 2. Zaawansowane mechanizmy sterujące i bezpieczeństwo

Z racji charakteru rozwijanego systemu, wdrożono trzy krytyczne mechanizmy z poziomu architektury produkcyjnej K8s:

### 2.1 Ograniczenie wykorzystywanych zasobów
Każdy kontener w deploymentach (np. interfejs frontendowy) ma zdefiniowane sekcje `resources`.
* Zdefiniowano `requests` (np. 64Mi RAM, 50m CPU) gwarantujące minimalny zasób do startu.
* Zdefiniowano `limits` (np. 128Mi RAM, 200m CPU) nakładające bezwzględny, górny pułap zużycia.
* W przypadku, gdyby skaner antywirusowy (ClamAV) lub API zostało przeciążone przesyłaniem dużego pliku, kontener zostanie wstrzymany i zrestartowany, zapobiegając zajęciu całej mocy obliczeniowej procesora maszyny hosta, co mogłoby doprowadzić do awarii całego klastra.

### 2.2 Polityki sieciowe
Wdrożono zaawansowaną architekturę Zero-Trust w obrębie całego namespace'u.
* Zdefiniowano regułę `default-deny-ingress`, która w ramach obszaru wyjściowego blokuje absolutnie cały ruch między wszystkimi mikroserwisami.
* Następnie tworzono punktowe wyjątki (np. polityka `protect-postgres` pozwala na dostęp do portu 5432 tylko tym podom, które posiadają etykiety `app: upload-service`, `app: scanner-worker` lub `app: db-init-job`).
* W przypadku skutecznego ataku na aplikację frontendową i przejęcia kontenera przez intruza, polityka sieciowa całkowicie zablokuje mu możliwość wykonania tzw. ruchu bocznego – intruz nie będzie w stanie połączyć się bezpośrednio z bazą danych, nawet znając jej IP i hasła.

### 2.3 Sterowanie rozmieszczeniem na węzłach
W projekcie wykorzystano logikę affinity/anti-affinity.
* **PodAntiAffinity:** Nakazano Kubernetesowi, aby instancje krytycznych usług (2 repliki `scanner-worker` i `upload-service`) nie były uruchamiane na tym samym fizycznym węźle obliczeniowym klastra jeśli to możliwe.
* Podejście to gwarantuje wysoką dostępność oraz zapewnia izolację na wypadek "ucieczki" złośliwego oprogramowania z sandboxa podczas skanowania złośliwych artefaktów.