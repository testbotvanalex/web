#!/bin/bash
# Botmatic Server Setup Script
# Run this on a fresh Ubuntu 22.04 server

echo "=== Installing Node.js ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "=== Installing PM2 ==="
sudo npm install -g pm2

echo "=== Installing Git ==="
sudo apt-get install -y git

echo "=== Cloning project ==="
cd /home
git clone https://github.com/YOUR_GITHUB/consturctror.git botmatic
cd /home/botmatic

echo "=== Installing dependencies ==="
npm install

echo "=== Creating data directory ==="
mkdir -p data

echo "=== Creating .env file ==="
cat > .env << 'EOF'
PORT=3200
WEBHOOK_VERIFY_TOKEN=botmatic_secret_2024
APP_SECRET=674d617598d113918807fe3dc6c4ebf1
APP_ID=2379887685742138
EOF

echo "=== Starting server with PM2 ==="
pm2 start server_new.js --name botmatic
pm2 save
pm2 startup

echo "=== Installing Nginx ==="
sudo apt-get install -y nginx

echo "=== Configuring Nginx ==="
sudo tee /etc/nginx/sites-available/botmatic << 'NGINX'
server {
    listen 80;
    server_name botmatic.be www.botmatic.be;

    location / {
        proxy_pass http://localhost:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

sudo ln -s /etc/nginx/sites-available/botmatic /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "=== Installing Certbot (SSL) ==="
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d botmatic.be -d www.botmatic.be --non-interactive --agree-tos -m info@botmatic.be

echo "=== DONE! Server is running ==="
pm2 status
