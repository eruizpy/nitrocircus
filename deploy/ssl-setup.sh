#!/usr/bin/env bash
# SSL/TLS setup script for NitroCircus web application
# Run as root on production server: bash ssl-setup.sh <domain>
#
# Prerequisites:
#   - DNS A record pointing to this server's IP
#   - Port 80 and 443 open in firewall
#   - nginx installed and running

set -euo pipefail

DOMAIN="${1:-}"
APP_DIR="/opt/nitrocircus"

if [ -z "$DOMAIN" ]; then
  echo "Usage: $0 <domain>"
  echo "Example: $0 nitrocircus.example.com"
  exit 1
fi

echo "============================================"
echo " SSL Setup for NitroCircus"
echo " Domain: $DOMAIN"
echo "============================================"
echo ""

# Check DNS resolution
echo "==> Checking DNS resolution..."
RESOLVED_IP=$(dig +short "$DOMAIN" | tail -1)
SERVER_IP=$(curl -s ifconfig.me)

if [ -z "$RESOLVED_IP" ]; then
  echo "❌ DNS resolution failed for $DOMAIN"
  echo "   Make sure your DNS A record is configured correctly."
  exit 1
fi

if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
  echo "⚠️  WARNING: DNS mismatch"
  echo "   Domain resolves to: $RESOLVED_IP"
  echo "   Server IP:          $SERVER_IP"
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo "✓ DNS configured correctly ($RESOLVED_IP)"
fi

# Install certbot if not present
if ! command -v certbot &>/dev/null; then
  echo "==> Installing certbot..."
  apt-get update -qq
  apt-get install -y -qq certbot python3-certbot-nginx
else
  echo "==> certbot already installed: $(certbot --version | head -1)"
fi

# Create certbot webroot
echo "==> Creating certbot webroot..."
mkdir -p /var/www/certbot

# Deploy HTTP-only nginx config first (for ACME challenge)
echo "==> Deploying temporary HTTP config..."
cp "$APP_DIR/infra/nginx/cosito5.conf" /etc/nginx/sites-available/cosito5-temp
sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/cosito5-temp
ln -sf /etc/nginx/sites-available/cosito5-temp /etc/nginx/sites-enabled/cosito5-temp
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/cosito5
nginx -t && systemctl reload nginx

# Obtain certificate
echo "==> Obtaining SSL certificate from Let's Encrypt..."
certbot certonly \
  --nginx \
  --non-interactive \
  --agree-tos \
  --email admin@${DOMAIN} \
  --domains "$DOMAIN" \
  --keep-until-expiring \
  --expand

if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  echo "❌ Certificate generation failed"
  exit 1
fi

echo "✓ Certificate obtained successfully"

# Deploy HTTPS nginx config
echo "==> Deploying HTTPS nginx config..."
cp "$APP_DIR/infra/nginx/cosito5-ssl.conf" /etc/nginx/sites-available/cosito5
sed -i "s/DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/cosito5
sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/cosito5
ln -sf /etc/nginx/sites-available/cosito5 /etc/nginx/sites-enabled/cosito5
rm -f /etc/nginx/sites-enabled/cosito5-temp
nginx -t && systemctl reload nginx

echo "✓ nginx configured for HTTPS"

# Set up auto-renewal
echo "==> Configuring automatic certificate renewal..."
systemctl enable certbot.timer 2>/dev/null || true
systemctl start certbot.timer 2>/dev/null || true

# Test renewal
echo "==> Testing certificate renewal..."
certbot renew --dry-run

echo ""
echo "============================================"
echo " SSL Setup Complete!"
echo "============================================"
echo ""
echo "Certificate details:"
certbot certificates | grep -A 10 "$DOMAIN" || true
echo ""
echo "Your web application is now available at:"
echo "  https://$DOMAIN"
echo ""
echo "Certificate auto-renewal is enabled (runs twice daily via systemd timer)."
echo "Manual renewal: certbot renew"
echo ""
echo "Firewall status:"
ufw status | grep -E '(80|443)' || echo "⚠️  Ensure ports 80 and 443 are open in firewall"
echo ""
