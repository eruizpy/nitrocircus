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
apt-get install -y -qq curl git

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
echo "==> Setting up Miniverse on port 4321..."
mkdir -p /opt/miniverse
cd /opt/miniverse
if [ ! -f package.json ]; then
  npx --yes create-miniverse@latest .
fi
pm2 start "npx miniverse" --name miniverse -- --port 4321 2>/dev/null || \
  pm2 restart miniverse
cd "$APP_DIR"

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
echo "5. Miniverse (puerto 4321) ya está corriendo via PM2."
echo "   Accede en: http://$(curl -s ifconfig.me 2>/dev/null || echo '<ip-del-servidor>'):4321"
echo "   (asegúrate de abrir el puerto en UFW: ufw allow 4321/tcp)"
echo ""
echo "6. Haz push a main para verificar el pipeline de GitHub Actions."
echo ""
