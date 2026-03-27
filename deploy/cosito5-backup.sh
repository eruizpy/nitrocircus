#!/usr/bin/env bash
# Backup script for cosito5 databases
# Run as root: bash cosito5-backup.sh
# Add to crontab for automatic backups: 0 2 * * * /opt/nitrocircus/deploy/cosito5-backup.sh

set -euo pipefail

BACKUP_DIR="/opt/backups/nitrocircus"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "==> Starting backup at $(date)"

# MongoDB backup
echo "==> Backing up MongoDB..."
docker exec nitrocircus-runner-mongo-1 mongodump \
  --username="${MONGO_USER:-nitro}" \
  --password="${MONGO_PASS:-nitro}" \
  --authenticationDatabase=admin \
  --db="${MONGO_DB:-nitrocircus}" \
  --archive="/tmp/mongo_backup_${TIMESTAMP}.archive" \
  --gzip

docker cp nitrocircus-runner-mongo-1:/tmp/mongo_backup_${TIMESTAMP}.archive \
  "$BACKUP_DIR/mongo_backup_${TIMESTAMP}.archive"

docker exec nitrocircus-runner-mongo-1 rm -f /tmp/mongo_backup_${TIMESTAMP}.archive

echo "✓ MongoDB backup saved to: $BACKUP_DIR/mongo_backup_${TIMESTAMP}.archive"

# Redis backup
echo "==> Backing up Redis..."
docker exec nitrocircus-runner-redis-1 redis-cli BGSAVE
sleep 2  # Wait for background save to complete
docker cp nitrocircus-runner-redis-1:/data/dump.rdb \
  "$BACKUP_DIR/redis_backup_${TIMESTAMP}.rdb"

echo "✓ Redis backup saved to: $BACKUP_DIR/redis_backup_${TIMESTAMP}.rdb"

# Clean up old backups
echo "==> Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "mongo_backup_*.archive" -mtime +${RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "redis_backup_*.rdb" -mtime +${RETENTION_DAYS} -delete

echo "==> Backup complete at $(date)"
echo ""
echo "Backup directory size:"
du -sh "$BACKUP_DIR"
echo ""
echo "Available backups:"
ls -lh "$BACKUP_DIR" | tail -10
