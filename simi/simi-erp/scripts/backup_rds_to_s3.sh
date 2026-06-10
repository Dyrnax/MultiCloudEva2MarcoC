#!/bin/bash

set -e

PROJECT_DIR="/simi/simi-erp"
ENV_FILE="$PROJECT_DIR/frontend/.env"
BACKUP_DIR="$PROJECT_DIR/backups"

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: No existe el archivo $ENV_FILE"
    echo "Cree el archivo .env desde frontend/.env.example"
    exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo "ERROR: Faltan variables de base de datos en el archivo .env"
    exit 1
fi

if [ -z "$S3_BACKUP_BUCKET" ]; then
    echo "ERROR: Falta definir S3_BACKUP_BUCKET en el archivo .env"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="backup_simi_rds_$DATE.sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
COMPRESSED_PATH="$BACKUP_PATH.gz"

echo "==========================================="
echo "Iniciando backup de AWS RDS PostgreSQL"
echo "Fecha: $DATE"
echo "Base de datos: $DB_NAME"
echo "Host RDS: $DB_HOST"
echo "Bucket S3: $S3_BACKUP_BUCKET"
echo "==========================================="

export PGPASSWORD="$DB_PASSWORD"

pg_dump \
    -h "$DB_HOST" \
    -p "${DB_PORT:-5432}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F p \
    -f "$BACKUP_PATH"

gzip "$BACKUP_PATH"

S3_PREFIX="${S3_BACKUP_PREFIX:-backups-rds}"

aws s3 cp "$COMPRESSED_PATH" "s3://$S3_BACKUP_BUCKET/$S3_PREFIX/$BACKUP_FILE.gz"

echo "==========================================="
echo "Backup generado y subido correctamente a S3"
echo "Archivo local: $COMPRESSED_PATH"
echo "Ubicacion S3: s3://$S3_BACKUP_BUCKET/$S3_PREFIX/$BACKUP_FILE.gz"
echo "==========================================="

aws s3 ls "s3://$S3_BACKUP_BUCKET/$S3_PREFIX/" | tail -n 5