#!/bin/sh
set -eu

echo "Waiting for MinIO..."
i=0
until mc alias set local "${S3_ENDPOINT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "MinIO did not become ready" >&2
    exit 1
  fi
  sleep 2
done

mc mb --ignore-existing "local/${S3_BUCKET_MEDIA}"
mc anonymous set none "local/${S3_BUCKET_MEDIA}" || true
echo "MinIO bucket ${S3_BUCKET_MEDIA} is ready"
