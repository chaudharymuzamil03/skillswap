#!/bin/bash
# devops/security/trivy-scan.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "SkillSwap Security Scan with Trivy"
echo "=========================================="

# Scan backend code
echo -e "\n${YELLOW}[1/6] Scanning Backend Code...${NC}"
trivy fs --severity HIGH,CRITICAL --exit-code 0 backend/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend code scan completed${NC}"
else
    echo -e "${RED}✗ Backend vulnerabilities found${NC}"
fi

# Scan frontend code
echo -e "\n${YELLOW}[2/6] Scanning Frontend Code...${NC}"
trivy fs --severity HIGH,CRITICAL --exit-code 0 frontend/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend code scan completed${NC}"
else
    echo -e "${RED}✗ Frontend vulnerabilities found${NC}"
fi

# Scan Dockerfiles
echo -e "\n${YELLOW}[3/6] Scanning Dockerfiles...${NC}"
trivy config --severity HIGH,CRITICAL devops/docker/backend.Dockerfile
trivy config --severity HIGH,CRITICAL devops/docker/frontend.Dockerfile
echo -e "${GREEN}✓ Dockerfile scan completed${NC}"

# Scan Docker images
echo -e "\n${YELLOW}[4/6] Scanning Docker Images...${NC}"
docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "skillswap|skillswap" | while read image; do
    echo "Scanning $image..."
    trivy image --severity HIGH,CRITICAL --exit-code 0 $image
done
echo -e "${GREEN}✓ Docker images scan completed${NC}"

# Scan Kubernetes manifests
echo -e "\n${YELLOW}[5/6] Scanning Kubernetes Manifests...${NC}"
find devops/kubernetes -name "*.yaml" -o -name "*.yml" | while read manifest; do
    echo "Scanning $manifest..."
    trivy conf --severity HIGH,CRITICAL $manifest
done
echo -e "${GREEN}✓ Kubernetes manifests scan completed${NC}"

# Scan Terraform files
echo -e "\n${YELLOW}[6/6] Scanning Terraform Files...${NC}"
trivy config --severity HIGH,CRITICAL devops/terraform/
echo -e "${GREEN}✓ Terraform files scan completed${NC}"

echo -e "\n${GREEN}=========================================="
echo "Security Scan Complete"
echo "==========================================${NC}"