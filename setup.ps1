Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Initializing SecuScan environment      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$DockerUser = Read-Host "Enter your username for DHI.io registry"

$SecurePass = Read-Host "Enter your token (PAT) for DHI.io registry" -AsSecureString

$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePass)
$DockerPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host "[1/5] Enabling ingress addon..." -ForegroundColor Yellow
minikube addons enable ingress

Write-Host ""
Write-Host "[2/5] Creating namespace 'secuscan-ns'..." -ForegroundColor Yellow
kubectl apply -f k8s/00-namespace.yaml

Write-Host "[3/5] Clearing old credentials (if they exist)..." -ForegroundColor Yellow
kubectl delete secret dhi-registry-secret -n secuscan-ns --ignore-not-found

Write-Host "[4/4] Generating new secret for image registry..." -ForegroundColor Yellow
kubectl create secret docker-registry dhi-registry-secret `
  -n secuscan-ns `
  --docker-server=dhi.io `
  --docker-username="$DockerUser" `
  --docker-password="$DockerPass"

[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

Write-Host "[5/5] Deploying remaining Kubernetes manifests..." -ForegroundColor Yellow
kubectl apply -f k8s/

Write-Host ""
Write-Host "Done! SecuScan architecture has been deployed." -ForegroundColor Green