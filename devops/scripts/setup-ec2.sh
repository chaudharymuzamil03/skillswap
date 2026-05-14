#!/bin/bash
sudo apt-get update -y
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Prometheus
docker run -d --name prometheus -p 9090:9090 prom/prometheus

# Grafana
docker run -d --name grafana -p 3001:3000 -e GF_SECURITY_ADMIN_PASSWORD=admin grafana/grafana

echo "Setup complete!"