#!/bin/bash

# Define variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/mongodump"
CONTAINER_NAME="mongodb"
BACKUP_FILE="$BACKUP_DIR/mongo_backup_$TIMESTAMP.tar.gz"

# Create backup
docker exec -i $CONTAINER_NAME /usr/bin/mongodump --uri "mongodb://localhost:27017/" --out /dump
rm -rf $BACKUP_DIR/*
docker cp $CONTAINER_NAME:/dump $BACKUP_DIR

# Clean up temporary backup files
docker exec $CONTAINER_NAME rm -rf /dump/*