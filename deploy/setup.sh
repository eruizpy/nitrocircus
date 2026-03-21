#!/usr/bin/env bash
# Bootstrap script para VPS Linode (Ubuntu 22.04)
# Ejecutar una sola vez como root: bash setup.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/eruizpy/nitrocircus.git}"
APP_DIR="/opt/nitrocircus"
NODE_VERSION="22"

echo "============================================"
echo " NitroCircus — Bootstrap VPS"
echo "============================================"

# ── System dependencies ────────────────────────────────────────────────────────
apt-get update -qq
apt-get install -y -qq curl git nginx

# ── Docker ────────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "==> Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "==> Docker already installed."
fi

# ── Node.js ───────────────────────────────────────────────────────────────────
if ! node --version 2>/dev/null | grep -q "^v${NODE_VERSION}"; then
  echo "==> Installing Node.js ${NODE_VERSION}..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
  apt-get install -y -qq nodejs
else
  echo "==> Node.js already installed: $(node --version)"
fi

# ── Global npm tools ──────────────────────────────────────────────────────────
echo "==> Installing global tools (pm2, claude)..."
npm install -g pm2 @anthropic-ai/claude-code --silent

# ── Clone repo ────────────────────────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "==> Repo already cloned. Pulling latest..."
  git -C "$APP_DIR" pull origin main
else
  echo "==> Cloning repo to $APP_DIR..."
  git clone "$REPO_URL" "$APP_DIR"
fi

# ── Environment ───────────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo ""
  echo "⚠️  Archivo .env creado desde .env.example."
  echo "   Edita $APP_DIR/.env con tus credenciales antes de continuar:"
  echo "   nano $APP_DIR/.env"
  echo ""
fi

# ── SSH key for GitHub Actions ────────────────────────────────────────────────
if [ ! -f ~/.ssh/id_ed25519 ]; then
  echo "==> Generating SSH key for GitHub Actions deployment..."
  ssh-keygen -t ed25519 -C "nitrocircus-deploy" -f ~/.ssh/id_ed25519 -N ""
  # Authorize the generated key to SSH into this server
  cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
  echo ""
  echo "⚠️  CLAVE PRIVADA — copia esto como GitHub Secret 'VPS_SSH_KEY':"
  echo "   (esta clave no se mostrará de nuevo; guárdala de forma segura)"
  echo "-----BEGIN PRIVATE KEY (VPS_SSH_KEY)-----"
  cat ~/.ssh/id_ed25519
  echo "-----END PRIVATE KEY-----"
  echo ""
else
  echo "==> SSH key already exists."
fi

# ── Miniverse ─────────────────────────────────────────────────────────────────
echo "==> Setting up Miniverse (backend port 4322, canvas port 4321 via nginx)..."
mkdir -p /opt/miniverse
cd /opt/miniverse
if [ ! -f package.json ]; then
  npx --yes create-miniverse@latest .
  npm install
  # Fix WebSocket URL: use dynamic host instead of hardcoded localhost
  echo 'import re' > /tmp/fix_ws.py
  echo 'f = "/opt/miniverse/src/main.ts"' >> /tmp/fix_ws.py
  echo 'try:' >> /tmp/fix_ws.py
  echo '    c = open(f).read()' >> /tmp/fix_ws.py
  echo '    c = re.sub("url:\\s*\\x27ws://[^\\x27]+/ws\\x27", "url: `ws://${window.location.host}/ws`", c)' >> /tmp/fix_ws.py
  echo '    open(f,"w").write(c); print("WS URL fixed")' >> /tmp/fix_ws.py
  echo 'except Exception as e: print("WS fix skipped:", e)' >> /tmp/fix_ws.py
  python3 /tmp/fix_ws.py
  npm run build
fi
pm2 start "npm run server -- --port 4322" --name miniverse 2>/dev/null || \
  pm2 restart miniverse
cd "$APP_DIR"

# ── nginx config for Miniverse ─────────────────────────────────────────────────
echo "==> Configuring nginx for Miniverse (port 4321)..."
if [ ! -f /etc/nginx/sites-available/miniverse ]; then
  printf '%s\n' \
    'server {' \
    '    listen 4321;' \
    '    root /opt/miniverse/dist;' \
    '    index index.html;' \
    '    location /api/ {' \
    '        proxy_pass http://localhost:4322;' \
    '        proxy_http_version 1.1;' \
    '    }' \
    '    location /ws {' \
    '        proxy_pass http://localhost:4322;' \
    '        proxy_http_version 1.1;' \
    '        proxy_set_header Upgrade $http_upgrade;' \
    '        proxy_set_header Connection "upgrade";' \
    '    }' \
    '    location / { try_files $uri $uri/ /index.html; }' \
    '}' > /etc/nginx/sites-available/miniverse
  ln -sf /etc/nginx/sites-available/miniverse /etc/nginx/sites-enabled/miniverse
fi
nginx -t && systemctl enable nginx && systemctl reload nginx

# ── PM2 startup ───────────────────────────────────────────────────────────────
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
pm2 save

echo ""
echo "============================================"
echo " Setup completo. Próximos pasos:"
echo "============================================"
echo ""
echo "1. Edita las variables de entorno:"
echo "   nano $APP_DIR/.env"
echo ""
echo "2. Autentica Claude Code (una sola vez):"
echo "   claude login"
echo ""
echo "3. Agrega los siguientes GitHub Secrets en tu repo:"
echo "   VPS_HOST    = $(curl -s ifconfig.me 2>/dev/null || echo '<ip-del-servidor>')"
echo "   VPS_USER    = $(whoami)"
echo "   VPS_SSH_KEY = (clave privada mostrada arriba — solo disponible durante el setup)"
echo ""
echo "4. Levanta los servicios:"
echo "   cd $APP_DIR && npm install"
echo "   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
echo "   pm2 start 'npm run agents' --name nitrocircus-agents"
echo "   pm2 save"
echo ""
echo "5. Miniverse canvas ya está disponible en:"
echo "   http://$(curl -s ifconfig.me 2>/dev/null || echo '<ip-del-servidor>'):4321"
echo "   (nginx sirve el canvas en :4321, backend Miniverse en :4322 — interno)"
echo ""
echo "6. Haz push a main para verificar el pipeline de GitHub Actions."
echo ""
