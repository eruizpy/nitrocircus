# Deployment Scripts

Scripts para el despliegue y gestión de NitroCircus en producción.

## Scripts Disponibles

### `setup.sh`
Bootstrap inicial del servidor VPS. Instala todas las dependencias, Docker, Node.js, nginx, y configura el entorno base.

```bash
# Ejecutar una sola vez en servidor nuevo
bash setup.sh
```

### `cosito5-deploy.sh`
Despliega la aplicación web de NitroCircus, configurando firewall, nginx, y levantando todos los servicios en Docker.

```bash
# Desplegar aplicación
bash cosito5-deploy.sh
```

**Características:**
- Pull de últimos cambios del repositorio
- Instalación de dependencias
- Configuración automática de firewall (UFW)
- Configuración de nginx (HTTP o HTTPS según disponibilidad de certificados)
- Actualización de servicios Docker (API, Bot, Web, MongoDB, Redis)
- Restart del agent worker (PM2)

### `ssl-setup.sh`
Configura SSL/TLS con certificados de Let's Encrypt para la aplicación web.

```bash
# Configurar HTTPS con Let's Encrypt
bash ssl-setup.sh <domain>

# Ejemplo
bash ssl-setup.sh nitrocircus.example.com
```

**Prerequisitos:**
- Registro DNS A apuntando al servidor
- Puertos 80 y 443 abiertos en firewall
- nginx instalado

**Características:**
- Validación de DNS
- Instalación de certbot
- Obtención automática de certificados Let's Encrypt
- Configuración de nginx con SSL/TLS moderno (TLS 1.2+)
- Headers de seguridad (HSTS, CSP, etc.)
- Auto-renovación de certificados (systemd timer)

### `cosito5-backup.sh`
Crea backup completo de MongoDB y repositorio.

```bash
# Crear backup
bash cosito5-backup.sh
```

Backups se guardan en `/opt/nitrocircus-backups/` con timestamp.

### `cosito5-restore.sh`
Restaura backup de MongoDB y repositorio.

```bash
# Restaurar último backup
bash cosito5-restore.sh

# Restaurar backup específico
bash cosito5-restore.sh /opt/nitrocircus-backups/2026-03-27_120000
```

## Flujo de Despliegue Típico

### Primera vez (servidor nuevo)

```bash
# 1. Bootstrap servidor
bash deploy/setup.sh

# 2. Configurar variables de entorno
nano /opt/nitrocircus/.env

# 3. Autenticar Claude Code
claude login

# 4. Desplegar aplicación
bash deploy/cosito5-deploy.sh

# 5. Configurar SSL (si tienes dominio)
bash deploy/ssl-setup.sh your-domain.com
```

### Actualizaciones subsecuentes

```bash
# Push a main activa GitHub Actions que ejecuta automáticamente:
# bash deploy/cosito5-deploy.sh

# O manualmente:
bash deploy/cosito5-deploy.sh
```

## Puertos y Seguridad

### Puertos Públicos (UFW allow)
- `22` - SSH
- `80` - HTTP (redirige a HTTPS si SSL configurado)
- `443` - HTTPS (web app)
- `4321` - Miniverse Canvas

### Puertos Internos (UFW deny, localhost only)
- `3000` - Orchestrator API (accesible via nginx proxy en `/api`)
- `3001` - Web app (accesible via nginx proxy en `/`)
- `27017` - MongoDB
- `6379` - Redis
- `4322` - Miniverse backend

## Arquitectura de nginx

```
Internet → nginx (80/443)
            ├─ / → localhost:3001 (web app Docker)
            ├─ /api → localhost:3000 (API Docker)
            └─ /health → localhost:3000/health

Miniverse → nginx (4321)
            ├─ / → /opt/miniverse/dist (estático)
            ├─ /api → localhost:4322 (backend Miniverse)
            └─ /ws → localhost:4322 (WebSocket)
```

## Logs y Troubleshooting

```bash
# Docker services
docker compose logs -f api
docker compose logs -f web
docker compose ps

# Agent worker
pm2 logs nitrocircus-agents
pm2 status

# nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
nginx -t

# Firewall
ufw status numbered
```

## Configuración de GitHub Actions

Los siguientes secrets deben estar configurados en el repositorio:

- `VPS_HOST` - IP del servidor
- `VPS_USER` - Usuario SSH (usualmente `root`)
- `VPS_SSH_KEY` - Clave privada SSH generada durante `setup.sh`

El workflow `.github/workflows/deploy.yml` ejecuta automáticamente `cosito5-deploy.sh` al hacer push a `main`.
