#!/usr/bin/env bash
# Deployment script for cosito5 infrastructure
# Run as root on production server: bash cosito5-deploy.sh

set -euo pipefail

APP_DIR="/opt/nitrocircus"

echo "============================================"
echo " Cosito5 - Deployment Script"
echo "============================================"

# Navigate to app directory
cd "$APP_DIR"

echo "==> Pulling latest changes from repository..."
git pull origin main

echo "==> Installing/updating dependencies..."
npm install --production=false

echo "==> Configuring firewall (UFW)..."
if [ -f "$APP_DIR/infra/security/ufw-rules.sh" ]; then
  bash "$APP_DIR/infra/security/ufw-rules.sh"
else
  echo "⚠️  UFW rules script not found, skipping firewall configuration"
fi

echo "==> Configuring nginx..."
# Check if SSL certificate exists, use HTTPS config, otherwise HTTP
if [ -d "/etc/letsencrypt/live" ] && [ -n "$(ls -A /etc/letsencrypt/live 2>/dev/null)" ]; then
  DOMAIN=$(ls /etc/letsencrypt/live | grep -v README | head -1)
  if [ -f "$APP_DIR/infra/nginx/cosito5-ssl.conf" ]; then
    echo "==> SSL certificate found for $DOMAIN, using HTTPS config"
    cp "$APP_DIR/infra/nginx/cosito5-ssl.conf" /etc/nginx/sites-available/cosito5
    sed -i "s/DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/cosito5
    sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/cosito5
    ln -sf /etc/nginx/sites-available/cosito5 /etc/nginx/sites-enabled/cosito5
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    echo "✓ nginx configured with HTTPS"
  else
    echo "⚠️  SSL config not found, falling back to HTTP"
  fi
elif [ -f "$APP_DIR/infra/nginx/cosito5.conf" ]; then
  echo "==> No SSL certificate found, using HTTP config"
  cp "$APP_DIR/infra/nginx/cosito5.conf" /etc/nginx/sites-available/cosito5
  ln -sf /etc/nginx/sites-available/cosito5 /etc/nginx/sites-enabled/cosito5
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  echo "✓ nginx configured with HTTP (run deploy/ssl-setup.sh <domain> to enable HTTPS)"
else
  echo "⚠️  nginx config not found, skipping nginx configuration"
fi

echo "==> Updating Docker services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "==> Restarting agent worker..."
pm2 restart nitrocircus-agents 2>/dev/null || \
  pm2 start 'npm run agents' --name nitrocircus-agents
pm2 save

echo ""
echo "============================================"
echo " Deployment complete!"
echo "============================================"
echo ""
echo "Services status:"
docker compose ps
echo ""
pm2 list
echo ""
echo "Health check:"
curl -s http://localhost:3000/health | jq . || echo "API health check failed"
echo ""
echo "Firewall status:"
ufw status numbered
echo ""
