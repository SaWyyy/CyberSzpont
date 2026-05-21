#!/bin/bash

echo "=========================================="
echo "   Initializing SecuScan environment      "
echo "=========================================="
echo ""

read -p "Enter your username for DHI.io registry: " DOCKER_USER

read -s -p "Enter your token (PAT) for DHI.io registry: " DOCKER_PASS
echo ""
echo ""

echo "[1/5] Enabling ingress addon..."
minikube addons enable ingress

echo "[2/5] Creating namespace 'secuscan-ns'..."
kubectl apply -f k8s/00-namespace.yaml

echo "[3/5] Clearing old credentials (if they exist)..."
kubectl delete secret dhi-registry-secret -n secuscan-ns --ignore-not-found

echo "[4/5] Generating new secret for image registry..."
kubectl create secret docker-registry dhi-registry-secret \
  -n secuscan-ns \
  --docker-server=dhi.io \
  --docker-username="$DOCKER_USER" \
  --docker-password="$DOCKER_PASS"

echo "[5/5] Deploying remaining Kubernetes manifests..."
kubectl apply -f k8s/

echo ""
echo "Done! SecuScan architecture has been deployed."