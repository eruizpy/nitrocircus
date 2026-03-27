#!/usr/bin/env bash
# Restore script for cosito5 databases
# Usage: bash cosito5-restore.sh <backup_timestamp>
# Example: bash cosito5-restore.sh 20260327_140530

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <backup_timestamp>"
  echo "Example: $0 20260327_140530"
  echo ""
  echo "Available backups:"
  ls -1 /opt/backups/nitrocircus/mongo_backup_*.archive | sed 's/.*mongo_backup_//' | sed 's/.archive$//'
  exit 1
fi

BACKUP_DIR="/opt/backups/nitrocircus"
TIMESTAMP="$1"
MONGO_BACKUP="$BACKUP_DIR/mongo_backup_${TIMESTAMP}.archive"
REDIS_BACKUP="$BACKUP_DIR/redis_backup_${TIMESTAMP}.rdb"

if [ ! -f "$MONGO_BACKUP" ]; then
  echo "Error: MongoDB backup not found: $MONGO_BACKUP"
  exit 1
fi

if [ ! -f "$REDIS_BACKUP" ]; then
  echo "Error: Redis backup not found: $REDIS_BACKUP"
  exit 1
fi

echo "============================================"
echo " Cosito5 - Database Restore"
echo "============================================"
echo ""
echo "⚠️  WARNING: This will REPLACE current database contents!"
echo "   MongoDB backup: $MONGO_BACKUP"
echo "   Redis backup: $REDIS_BACKUP"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo ""
echo "==> Stopping services..."
docker compose -f /opt/nitrocircus/docker-compose.yml -f /opt/nitrocircus/docker-compose.prod.yml down

echo "==> Starting databases..."
docker compose -f /opt/nitrocircus/docker-compose.yml -f /opt/nitrocircus/docker-compose.prod.yml up -d mongo redis

echo "==> Waiting for databases to be ready..."
sleep 10

# MongoDB restore
echo "==> Restoring MongoDB..."
docker cp "$MONGO_BACKUP" nitrocircus-runner-mongo-1:/tmp/restore.archive

docker exec nitrocircus-runner-mongo-1 mongorestore \
  --username="${MONGO_USER:-nitro}" \
  --password="${MONGO_PASS:-nitro}" \
  --authenticationDatabase=admin \
  --archive=/tmp/restore.archive \
  --gzip \
  --drop

docker exec nitrocircus-runner-mongo-1 rm -f /tmp/restore.archive

echo "✓ MongoDB restored"

# Redis restore
echo "==> Restoring Redis..."
docker compose -f /opt/nitrocircus/docker-compose.yml -f /opt/nitrocircus/docker-compose.prod.yml stop redis

docker cp "$REDIS_BACKUP" nitrocircus-runner-redis-1:/data/dump.rdb

docker compose -f /opt/nitrocircus/docker-compose.yml -f /opt/nitrocircus/docker-compose.prod.yml start redis

echo "✓ Redis restored"

echo "==> Starting all services..."
docker compose -f /opt/nitrocircus/docker-compose.yml -f /opt/nitrocircus/docker-compose.prod.yml up -d

echo ""
echo "============================================"
echo " Restore complete!"
echo "============================================"
echo ""
docker compose ps
