#!/bin/sh
set -eu

until mc alias set local "$S3_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"; do
  echo "Waiting for MinIO..."
  sleep 2
done

for bucket in blackwater-media blackwater-uploads blackwater-public; do
  mc mb --ignore-existing "local/${bucket}"
done

mc anonymous set download "local/blackwater-public"

echo "MinIO buckets ready."
