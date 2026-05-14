#!/bin/bash
# devops/terraform/user-data.sh

set -e

# Update system
apt-get update -y
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
apt-get install -y git

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Jenkins
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | apt-key add -
sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
apt-get update -y
apt-get install -y jenkins
systemctl start jenkins
systemctl enable jenkins

# Install Trivy for security scanning
wget https://github.com/aquasecurity/trivy/releases/download/v0.45.0/trivy_0.45.0_Linux-64bit.deb
dpkg -i trivy_0.45.0_Linux-64bit.deb

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
mv kubectl /usr/local/bin/

# Install minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
install minikube-linux-amd64 /usr/local/bin/minikube

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Prometheus
useradd --no-create-home --shell /bin/false prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.47.0/prometheus-2.47.0.linux-amd64.tar.gz
tar xvf prometheus-2.47.0.linux-amd64.tar.gz
cp prometheus-2.47.0.linux-amd64/prometheus /usr/local/bin/
cp prometheus-2.47.0.linux-amd64/promtool /usr/local/bin/
mkdir -p /etc/prometheus
cp prometheus-2.47.0.linux-amd64/prometheus.yml /etc/prometheus/

# Install Grafana
apt-get install -y software-properties-common
add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | apt-key add -
apt-get update -y
apt-get install -y grafana
systemctl start grafana-server
systemctl enable grafana-server

# Install Ansible
apt-get install -y ansible

# Install Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list
apt-get update -y
apt-get install -y terraform

# Clone application
git clone https://github.com/your-repo/skillswap.git /opt/skillswap || true

# Create .env file
cat > /opt/skillswap/.env << EOF
MONGO_PASSWORD=${MONGO_PASSWORD}
JWT_SECRET=${JWT_SECRET}
NODE_ENV=production
EOF

# Start application with Docker Compose
cd /opt/skillswap
docker-compose -f devops/docker/docker-compose.yml up -d

# Install nginx as reverse proxy
apt-get install -y nginx

cat > /etc/nginx/sites-available/skillswap << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

ln -s /etc/nginx/sites-available/skillswap /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# Create health check script
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
curl -f http://localhost:5000/api/health || exit 1
curl -f http://localhost:3000 || exit 1
EOF

chmod +x /usr/local/bin/health-check.sh

# Add cron job
echo "*/5 * * * * /usr/local/bin/health-check.sh >> /var/log/health-check.log" | crontab -

# Create systemd service for the application
cat > /etc/systemd/system/skillswap.service << EOF
[Unit]
Description=SkillSwap Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/skillswap
ExecStart=/usr/local/bin/docker-compose -f devops/docker/docker-compose.yml up -d
ExecStop=/usr/local/bin/docker-compose -f devops/docker/docker-compose.yml down
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

systemctl enable skillswap.service

echo "✅ Setup completed successfully!"