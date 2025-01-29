#!/bin/bash

# Define variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/mongodump/dump"
CONTAINER_NAME="mongodb"
BACKUP_FILE="$BACKUP_DIR/mongo_backup_$TIMESTAMP.tar.gz"

# restore backup
docker cp $BACKUP_DIR $CONTAINER_NAME:/restore
docker exec -i $CONTAINER_NAME /usr/bin/mongorestore --uri "mongodb://localhost:27017/" /restore

