set -e
wal-g backup-push "$PGDATA"
# Retain only last 2 full backups and their dependencies
wal-g delete before FIND_FULL $(date -d "2 days ago" +%Y-%m-%d_%H:%M:%S) --confirm
# Clean up old WAL files
wal-g garbage-collection
