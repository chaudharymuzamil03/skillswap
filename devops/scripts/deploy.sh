#!/bin/bash
# devops/scripts/deploy.sh - Main deployment script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "SkillSwap DevOps/DevSecOps Complete Deployment"
echo "==========================================${NC}"

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
INSTANCE_TYPE=${INSTANCE_TYPE:-"t3.medium"}
KEY_NAME=${KEY_NAME:-"skillswap-key"}

# Step 1: Run security scan
echo -e "\n${YELLOW}[Step 1/7] Running Security Scan...${NC}"
cd devops/security
./trivy-scan.sh
cd ../..

# Step 2: Build Docker images
echo -e "\n${YELLOW}[Step 2/7] Building Docker Images...${NC}"
docker build -f devops/docker/backend.Dockerfile -t skillswap-backend:latest .
docker build -f devops/docker/frontend.Dockerfile -t skillswap-frontend:latest .

# Step 3: Test locally with Docker Compose
echo -e "\n${YELLOW}[Step 3/7] Testing Locally...${NC}"
docker-compose -f devops/docker/docker-compose.yml up -d
sleep 10
curl -f http://localhost:5000/api/health || (echo "Backend failed" && exit 1)
curl -f http://localhost:3000 || (echo "Frontend failed" && exit 1)
docker-compose -f devops/docker/docker-compose.yml down

# Step 4: Deploy to AWS with Terraform
echo -e "\n${YELLOW}[Step 4/7] Deploying to AWS with Terraform...${NC}"
cd devops/terraform
terraform init
terraform plan -out=tfplan
terraform apply -auto-approve tfplan

# Get EC2 IP
EC2_IP=$(terraform output -raw instance_public_ip)
echo -e "${GREEN}✓ EC2 instance created at: $EC2_IP${NC}"

# Step 5: Configure with Ansible
echo -e "\n${YELLOW}[Step 5/7] Configuring Server with Ansible...${NC}"
cd ../ansible
export ANSIBLE_HOST_KEY_CHECKING=False
ansible-playbook -i inventory.yml playbook.yml --extra-vars "ec2_ip=$EC2_IP ssh_key_path=~/.ssh/$KEY_NAME.pem"

# Step 6: Deploy to Kubernetes
echo -e "\n${YELLOW}[Step 6/7] Deploying to Kubernetes...${NC}"
cd ../kubernetes
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f mongodb-statefulset.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f services.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml

# Wait for deployments
kubectl rollout status deployment/skillswap-backend -n skillswap --timeout=300s
kubectl rollout status deployment/skillswap-frontend -n skillswap --timeout=300s

# Step 7: Setup monitoring
echo -e "\n${YELLOW}[Step 7/7] Setting up Monitoring...${NC}"
kubectl apply -f ../monitoring/prometheus-config.yaml
kubectl apply -f ../monitoring/grafana-deployment.yaml

echo -e "${GREEN}=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo -e "🌐 Frontend: http://$EC2_IP:3000"
echo -e "🔧 Backend API: http://$EC2_IP:5000"
echo -e "📊 Grafana: http://$EC2_IP:3001 (admin/admin)"
echo -e "📈 Prometheus: http://$EC2_IP:9090"
echo -e "🔧 Jenkins: http://$EC2_IP:8080"
echo "==========================================${NC}"