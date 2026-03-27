# Infraestructura Cosito5

Configuración de infraestructura para el proyecto cosito5 de NitroCircus.

## Estructura

```
infra/
├── nginx/
│   └── cosito5.conf          # Configuración nginx con proxy inverso, rate limiting y headers de seguridad
├── database/
│   ├── mongo-init.js         # Script de inicialización MongoDB con schemas y índices
│   └── redis.conf            # Configuración Redis optimizada para colas y locks
└── security/
    └── ufw-rules.sh          # Reglas de firewall UFW
```

## Componentes

### Servidor Web (nginx)

- **Proxy inverso**: Expone frontend (puerto 3001) y API (puerto 3000) de forma segura
- **Rate limiting**: 100 req/s con burst de 200 para prevenir abuso
- **Security headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Timeouts configurados**: Previene conexiones colgadas

### Base de Datos (MongoDB)

- **Colecciones validadas**: tasks, projects, audit_log con schemas estrictos
- **Índices optimizados**: Consultas rápidas por proyecto, estado, agente
- **Inicialización automática**: Script ejecutado al crear el contenedor

**Estado de las tareas**:
- `backlog` → `planned` → `assigned` → `awaiting_start_approval` → `in_progress` → `blocked/in_review` → `done` → `delivered`

### Cache/Colas (Redis)

- **Persistencia AOF**: Garantiza durabilidad de datos
- **Snapshots RDB**: Backups automáticos (900s/1, 300s/10, 60s/10000)
- **Límite de memoria**: 512MB con política LRU
- **Optimizado para**: Colas de agentes y locks distribuidos

### Firewall (UFW)

**Puertos abiertos**:
- 22 (SSH) - Acceso remoto y GitHub Actions
- 80/443 (HTTP/HTTPS) - Tráfico web público
- 4321 (Miniverse) - Canvas de visualización

**Bloqueados externamente** (solo localhost):
- 3000 (API) - Solo vía proxy nginx
- 3001 (Web) - Solo vía proxy nginx
- 27017 (MongoDB) - Solo para contenedores Docker
- 6379 (Redis) - Solo para contenedores Docker
- 4322 (Miniverse backend) - Solo interno

## Scripts de Despliegue

### `deploy/cosito5-deploy.sh`

Despliega la infraestructura completa:
1. Pull del repositorio
2. Instalación de dependencias
3. Configuración de firewall
4. Configuración de nginx
5. Actualización de servicios Docker
6. Reinicio de agent worker

```bash
bash /opt/nitrocircus/deploy/cosito5-deploy.sh
```

### `deploy/cosito5-backup.sh`

Backup de bases de datos:
- MongoDB: Dump comprimido con gzip
- Redis: Snapshot RDB
- Retención: 30 días

```bash
# Manual
bash /opt/nitrocircus/deploy/cosito5-backup.sh

# Automático (crontab)
0 2 * * * /opt/nitrocircus/deploy/cosito5-backup.sh
```

### `deploy/cosito5-restore.sh`

Restaura desde backup:

```bash
bash /opt/nitrocircus/deploy/cosito5-restore.sh 20260327_140530
```

## Uso

### Primera vez

```bash
# 1. Aplicar reglas de firewall
sudo bash infra/security/ufw-rules.sh

# 2. Configurar nginx
sudo cp infra/nginx/cosito5.conf /etc/nginx/sites-available/cosito5
sudo ln -s /etc/nginx/sites-available/cosito5 /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 3. Levantar servicios (las configs se montan automáticamente)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Actualización

```bash
# Despliegue completo
bash deploy/cosito5-deploy.sh
```

### Monitoreo

```bash
# Estado de servicios
docker compose ps

# Logs
docker compose logs -f mongo redis

# Firewall
sudo ufw status numbered

# Health check
curl http://localhost:3000/health
```

## Seguridad

- ✅ Firewall UFW con acceso restringido
- ✅ MongoDB con autenticación
- ✅ Redis con protected mode
- ✅ nginx con security headers
- ✅ Rate limiting configurado
- ✅ Servicios internos no expuestos
- ✅ Backups automáticos

## Escalabilidad

- MongoDB: Preparado para replica sets (futuro)
- Redis: Cluster mode disponible (futuro)
- nginx: Load balancing configurable
- Docker: Recursos limitables por servicio
