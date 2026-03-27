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
if [ -f "$APP_DIR/infra/nginx/cosito5.conf" ]; then
  cp "$APP_DIR/infra/nginx/cosito5.conf" /etc/nginx/sites-available/cosito5
  ln -sf /etc/nginx/sites-available/cosito5 /etc/nginx/sites-enabled/cosito5
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  echo "✓ nginx configured and reloaded"
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
