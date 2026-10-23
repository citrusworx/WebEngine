#!/usr/bin/env bash
# Boot real WordPress with the KiwiPress Bridge plugin and run the e2e suite.
# Opt-in: needs Docker. Not part of the default unit-test run.
set -euo pipefail

E2E_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$E2E_DIR/../../../.." && pwd)"

export KIWIPRESS_E2E_WP_PORT="${KIWIPRESS_E2E_WP_PORT:-18080}"
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-kiwipress-bridge-e2e}"
export KIWIPRESS_E2E_COMPOSE_FILE="$E2E_DIR/docker-compose.yml"
export KIWIPRESS_E2E_COMPOSE_PROJECT="$COMPOSE_PROJECT_NAME"
export KIWIPRESS_E2E_SITE_URL="http://127.0.0.1:${KIWIPRESS_E2E_WP_PORT}"
export KIWIPRESS_E2E_ADMIN_USER="kiwipress"
export KIWIPRESS_E2E_SUBSCRIBER_USER="subscriber"
export KIWIPRESS_E2E_EDITOR_USER="editor"

APACHE_DIR="$(mktemp -d)"
export KIWIPRESS_E2E_APACHE_DIR="$APACHE_DIR"
cat > "$APACHE_DIR/ports.conf" <<EOF
Listen ${KIWIPRESS_E2E_WP_PORT}
EOF
cat > "$APACHE_DIR/vhost.conf" <<EOF
<VirtualHost *:${KIWIPRESS_E2E_WP_PORT}>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html
    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
    SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=\$1
</VirtualHost>
EOF

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker and re-run yarn test:e2e:bridge." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed but the daemon is not reachable." >&2
  exit 1
fi

compose() {
  docker compose -f "$E2E_DIR/docker-compose.yml" -p "$COMPOSE_PROJECT_NAME" "$@"
}

wp() {
  compose --profile cli run --rm -T --no-deps wpcli "$@"
}

cleanup() {
  local status=$?
  if [[ "${KIWIPRESS_E2E_KEEP:-}" == "1" ]]; then
    echo "KIWIPRESS_E2E_KEEP=1, leaving the WordPress stack up at ${KIWIPRESS_E2E_SITE_URL}."
    return "$status"
  fi
  compose down -v --remove-orphans >/dev/null 2>&1 || true
  return "$status"
}
trap cleanup EXIT

echo "Starting MariaDB and WordPress on ${KIWIPRESS_E2E_SITE_URL}..."
compose up -d db wordpress

echo "Waiting for wp-config.php..."
ready=0
for _ in $(seq 1 90); do
  if compose exec -T wordpress test -f /var/www/html/wp-config.php; then
    ready=1
    break
  fi
  sleep 2
done

if [[ "$ready" != "1" ]]; then
  echo "WordPress did not finish creating wp-config.php." >&2
  compose logs --tail 80 wordpress >&2 || true
  exit 1
fi

if ! wp core is-installed >/dev/null 2>&1; then
  echo "Installing WordPress..."
  wp core install \
    --url="$KIWIPRESS_E2E_SITE_URL" \
    --title="KiwiPress Bridge E2E" \
    --admin_user="$KIWIPRESS_E2E_ADMIN_USER" \
    --admin_password="kiwipress-admin-pass" \
    --admin_email="kiwipress-e2e@example.com" \
    --skip-email
fi

echo "Activating KiwiPress Bridge and pretty permalinks..."
wp plugin activate kiwipress-bridge
wp rewrite structure '/%postname%/' --hard
wp rewrite flush --hard
wp eval 'update_option("kiwipress_bridge", array("frontend_url"=>"","lockdown"=>true,"paired"=>false,"project_label"=>""));'

env_type="$(wp eval 'echo wp_get_environment_type();' | awk 'NF{line=$0} END{print line}')"
if [[ "$env_type" != "local" ]]; then
  echo "WP_ENVIRONMENT_TYPE is '${env_type}', expected local so application passwords work over HTTP." >&2
  exit 1
fi

app_passwords="$(wp eval 'echo wp_is_application_passwords_available() ? "yes" : "no";' | awk 'NF{line=$0} END{print line}')"
if [[ "$app_passwords" != "yes" ]]; then
  echo "Application passwords are not available (${app_passwords})." >&2
  exit 1
fi

if ! wp user get "$KIWIPRESS_E2E_SUBSCRIBER_USER" >/dev/null 2>&1; then
  wp user create "$KIWIPRESS_E2E_SUBSCRIBER_USER" subscriber-e2e@example.com \
    --role=subscriber \
    --user_pass="subscriber-pass" \
    --display_name="Subscriber"
fi

if ! wp user get "$KIWIPRESS_E2E_EDITOR_USER" >/dev/null 2>&1; then
  wp user create "$KIWIPRESS_E2E_EDITOR_USER" editor-e2e@example.com \
    --role=editor \
    --user_pass="editor-pass" \
    --display_name="Editor"
fi

create_app_password() {
  local user="$1"
  local raw password
  raw="$(wp user application-password create "$user" "kiwipress-e2e-$(date +%s)-${RANDOM}" --porcelain)"
  # wp-cli --porcelain prints the 24-character password. The profile screen
  # shows the same value chunked with spaces. WordPress accepts either.
  password="$(printf '%s\n' "$raw" | grep -E '^[A-Za-z0-9]{24}$|^[A-Za-z0-9]{4}( [A-Za-z0-9]{4}){5}$' | tail -n 1 || true)"
  if [[ -z "$password" ]]; then
    echo "Could not read an application password for ${user}." >&2
    printf '%s\n' "$raw" >&2
    exit 1
  fi
  printf '%s' "$password"
}

echo "Creating application passwords..."
KIWIPRESS_E2E_ADMIN_APP_PASSWORD="$(create_app_password "$KIWIPRESS_E2E_ADMIN_USER")"
KIWIPRESS_E2E_SUBSCRIBER_APP_PASSWORD="$(create_app_password "$KIWIPRESS_E2E_SUBSCRIBER_USER")"
KIWIPRESS_E2E_EDITOR_APP_PASSWORD="$(create_app_password "$KIWIPRESS_E2E_EDITOR_USER")"
export KIWIPRESS_E2E_ADMIN_APP_PASSWORD
export KIWIPRESS_E2E_SUBSCRIBER_APP_PASSWORD
export KIWIPRESS_E2E_EDITOR_APP_PASSWORD

echo "Checking public health before the suite..."
node --input-type=module -e '
const url = process.argv[1];
const response = await fetch(url);
const text = await response.text();
if (!response.ok) {
  console.error(response.status, text);
  process.exit(1);
}
const body = JSON.parse(text);
if (body.plugin_version !== "0.2.0" || body.lockdown !== true || body.paired !== false) {
  console.error(body);
  process.exit(1);
}
if (!Array.isArray(body.features) || !body.features.includes("preview")) {
  console.error(body);
  process.exit(1);
}
if (Object.prototype.hasOwnProperty.call(body, "preview_secret") || JSON.stringify(body).includes("kiwipress_bridge_preview_secret")) {
  console.error(body);
  process.exit(1);
}
console.log("preflight", JSON.stringify(body));
' "${KIWIPRESS_E2E_SITE_URL}/wp-json/kiwipress/v1/health"

echo "Running the bridge end-to-end suite..."
cd "$ROOT"
yarn workspace @citrusworx/kiwipress build
yarn workspace @citrusworx/kiwipressapp-back exec vitest run --config "$E2E_DIR/vitest.config.ts"
