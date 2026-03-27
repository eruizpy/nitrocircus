#!/usr/bin/env bash
# UFW firewall rules for NitroCircus production server
# Run as root: bash ufw-rules.sh

set -euo pipefail

echo "==> Configuring UFW firewall rules..."

# Reset UFW to defaults
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# SSH (required for remote access and GitHub Actions)
ufw allow 22/tcp comment 'SSH'

# HTTP/HTTPS (public web access)
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Miniverse canvas (visualization layer)
ufw allow 4321/tcp comment 'Miniverse Canvas'

# BLOCK direct access to internal services
# MongoDB (27017) - only accessible from localhost
ufw deny 27017/tcp comment 'Block MongoDB - localhost only'

# Redis (6379) - only accessible from localhost
ufw deny 6379/tcp comment 'Block Redis - localhost only'

# API (3000) - only accessible via nginx proxy
ufw deny 3000/tcp comment 'Block API - nginx proxy only'

# Web app (3001) - only accessible via nginx proxy
ufw deny 3001/tcp comment 'Block Web - nginx proxy only'

# Miniverse backend (4322) - only accessible from localhost
ufw deny 4322/tcp comment 'Block Miniverse backend - localhost only'

# Enable UFW
ufw --force enable

echo "==> Firewall rules applied successfully."
echo ""
echo "Open ports:"
echo "  22   - SSH"
echo "  80   - HTTP (nginx reverse proxy)"
echo "  443  - HTTPS (nginx reverse proxy)"
echo "  4321 - Miniverse canvas"
echo ""
echo "Blocked external access:"
echo "  3000  - API (localhost only)"
echo "  3001  - Web app (localhost only)"
echo "  27017 - MongoDB (localhost only)"
echo "  6379  - Redis (localhost only)"
echo "  4322  - Miniverse backend (localhost only)"
echo ""
ufw status numbered
