#!/usr/bin/env bash
# Daily backup of the uploaded photo files (the database itself is backed up by the db-backup service).
# Example cron entry (every night at 02:30):
#   30 2 * * * /path/to/student-marketplace/scripts/backup-photos.sh /mnt/external-ssd/marketplace-backups
set -euo pipefail

TARGET_DIR="${1:?usage: backup-photos.sh <target-directory>}"
VOLUME="${PHOTO_VOLUME:-student-marketplace_photos}"   # docker volume name used by docker-compose.yml
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$TARGET_DIR"
STAMP="$(date +%F)"
docker run --rm -v "$VOLUME":/data:ro -v "$TARGET_DIR":/backup alpine \
  tar czf "/backup/photos-$STAMP.tar.gz" -C /data .

# keep only the last KEEP_DAYS days
find "$TARGET_DIR" -name 'photos-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "Photo backup written to $TARGET_DIR/photos-$STAMP.tar.gz"
