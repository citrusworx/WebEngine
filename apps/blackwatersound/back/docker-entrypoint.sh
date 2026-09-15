#!/bin/sh
set -eu

if [ -f /secrets/wp-app-password ]; then
  export WP_APP_PASSWORD="$(cat /secrets/wp-app-password)"
fi

exec "$@"
