#!/usr/bin/env bash
# Boot real WordPress with the KiwiPress Bridge plugin and run the e2e suite.
# Opt-in: needs Docker. Not part of the default unit-test run.
#
# Windows: run `yarn test:e2e:bridge` from Git Bash or an MSYS2 prompt (UCRT64).
# Do not export MSYS_NO_PATHCONV for the yarn process. Corepack's Windows shim
# needs MSYS to rewrite its own node path; this script turns conversion off
# only around docker.exe, after host paths have been turned into mixed
# Windows paths (cygpath -m). Container paths stay POSIX.
set -euo pipefail

E2E_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$E2E_DIR/../../../.." && pwd)"
RUNTIME_DIR="$E2E_DIR/.runtime"

export KIWIPRESS_E2E_WP_PORT="${KIWIPRESS_E2E_WP_PORT:-18080}"
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-kiwipress-bridge-e2e}"
export KIWIPRESS_E2E_COMPOSE_PROJECT="$COMPOSE_PROJECT_NAME"
export KIWIPRESS_E2E_SITE_URL="http://127.0.0.1:${KIWIPRESS_E2E_WP_PORT}"
export KIWIPRESS_E2E_ADMIN_USER="kiwipress"
export KIWIPRESS_E2E_SUBSCRIBER_USER="subscriber"
export KIWIPRESS_E2E_EDITOR_USER="editor"

is_msys() {
  case "$(uname -s 2>/dev/null || true)" in
    MINGW*|MSYS*|CYGWIN*) return 0 ;;
  esac
  case "${OSTYPE:-}" in
    msys*|mingw*|cygwin*) return 0 ;;
  esac
  [[ -n "${MSYSTEM:-}" ]]
}

is_wsl() {
  if [[ -n "${WSL_DISTRO_NAME:-}" || -n "${WSL_INTEROP:-}" ]]; then
    return 0
  fi
  [[ -r /proc/version ]] && grep -qi microsoft /proc/version
}

# MSYS rewrites environment values that look like POSIX paths when it spawns
# a Windows binary. URLs contain colons, and cygpath -m paths contain drive
# letters; both get corrupted if they are converted again. The match is on
# the variable name. PATH is left alone so docker.exe can find its plugin.
msys_protect_env() {
  if ! is_msys; then
    return 0
  fi
  local names="KIWIPRESS_E2E_APACHE_DIR;KIWIPRESS_E2E_COMPOSE_FILE;KIWIPRESS_E2E_SITE_URL;KIWIPRESS_E2E_COMPOSE_PROJECT"
  if [[ -n "${MSYS2_ENV_CONV_EXCL:-}" ]]; then
    export MSYS2_ENV_CONV_EXCL="${MSYS2_ENV_CONV_EXCL};${names}"
  else
    export MSYS2_ENV_CONV_EXCL="${names}"
  fi
}

to_host_path() {
  local path="$1"
  if is_msys; then
    cygpath -m "$path"
  else
    printf '%s\n' "$path"
  fi
}

# docker.exe is a Windows program. MSYS would rewrite every argument that
# contains a slash, including container paths (/var/www/html) and wp-cli
# permalinks (/%postname%/). Host paths are already mixed Windows paths
# (G:/repo/...) before we get here, so conversion must be off for the call.
# MSYS_NO_PATHCONV is the Git Bash switch. MSYS2_ARG_CONV_EXCL is the MSYS2
# switch: "*" disables every argument, and the prefixes cover UCRT64 builds
# that treat "*" as a literal prefix.
docker_cli() {
  if is_msys; then
    MSYS_NO_PATHCONV=1 \
      MSYS2_ARG_CONV_EXCL='*;/var;/etc;/%;http:;https:;--url=;A:;B:;C:;D:;E:;F:;G:;H:;I:;J:;K:;L:;M:;N:;O:;P:;Q:;R:;S:;T:;U:;V:;W:;X:;Y:;Z:' \
      command docker "$@"
  else
    command docker "$@"
  fi
}

# Yarn/corepack must keep MSYS conversion enabled. Disabling it makes
# corepack look for yarn.js under the current drive (G:\c\Program Files\...).
# Workspace names start with @ and must not be treated as paths. The vitest
# config path is a real host path and still needs conversion.
yarn_cli() {
  if is_msys; then
    MSYS2_ARG_CONV_EXCL="${MSYS2_ARG_CONV_EXCL:+${MSYS2_ARG_CONV_EXCL};}@;http:;https:" \
      command yarn "$@"
  else
    command yarn "$@"
  fi
}

node_cli() {
  if is_msys; then
    MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' command node "$@"
  else
    command node "$@"
  fi
}

# Fills BASH_SHOW and DOCKER_SHOW. Windows paths, not POSIX, under MSYS.
refresh_tool_paths() {
  local bash_path docker_path
  bash_path="$(command -v bash 2>/dev/null || echo missing)"
  docker_path="$(command -v docker 2>/dev/null || echo missing)"
  BASH_SHOW="$bash_path"
  DOCKER_SHOW="$docker_path"
  if is_msys && command -v cygpath >/dev/null 2>&1; then
    if [[ "$bash_path" != missing ]]; then
      BASH_SHOW="$(cygpath -m "$bash_path")"
    fi
    if [[ "$docker_path" != missing ]]; then
      DOCKER_SHOW="$(cygpath -m "$docker_path")"
    fi
  fi
}

describe_shell() {
  refresh_tool_paths
  echo "Shell: bash=${BASH_SHOW} uname=$(uname -s 2>/dev/null || echo unknown) ostype=${OSTYPE:-unknown} msystem=${MSYSTEM:-none}" >&2
  echo "Docker binary: ${DOCKER_SHOW}" >&2
  if is_wsl; then
    echo "This bash is WSL. PowerShell often starts C:\\Windows\\System32\\bash.exe, which cannot see Docker Desktop unless that distro has WSL integration enabled. Run yarn test:e2e:bridge from Git Bash or the MSYS2 UCRT64 prompt so docker is docker.exe." >&2
  fi
}

msys_protect_env

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker and re-run yarn test:e2e:bridge." >&2
  describe_shell
  exit 1
fi

if is_msys && ! command -v cygpath >/dev/null 2>&1; then
  echo "cygpath is required under Git Bash / MSYS2 so Docker receives Windows paths." >&2
  describe_shell
  exit 1
fi

if ! docker_err="$(docker info 2>&1 >/dev/null)"; then
  echo "Docker is installed but the daemon is not reachable." >&2
  describe_shell
  printf '%s\n' "$docker_err" >&2
  exit 1
fi

NETWORK_REASON=""
case "${KIWIPRESS_E2E_NETWORK:-}" in
  host|bridge)
    NETWORK="$KIWIPRESS_E2E_NETWORK"
    NETWORK_REASON="KIWIPRESS_E2E_NETWORK"
    ;;
  "")
    if is_msys; then
      # Host mode binds Apache inside the WSL2 VM. Windows localhost never
      # sees that port, and Docker Desktop often disables host networking.
      NETWORK="bridge"
      NETWORK_REASON="Git Bash/MSYS2"
    else
      docker_os="$(docker_cli info --format '{{.OperatingSystem}}' 2>/dev/null || true)"
      docker_name="$(docker_cli info --format '{{.Name}}' 2>/dev/null || true)"
      if [[ "$docker_os" == *"Docker Desktop"* || "$docker_name" == "docker-desktop" ]]; then
        NETWORK="bridge"
        NETWORK_REASON="Docker Desktop (${docker_os:-$docker_name})"
      else
        # Some nested Linux VMs drop traffic between containers. Host
        # networking is the mode that works there, including GitHub Actions.
        NETWORK="host"
        NETWORK_REASON="Linux Docker"
      fi
    fi
    ;;
  *)
    echo "KIWIPRESS_E2E_NETWORK must be host or bridge (got '${KIWIPRESS_E2E_NETWORK}')." >&2
    exit 1
    ;;
esac
export KIWIPRESS_E2E_NETWORK="$NETWORK"

if [[ "$NETWORK" == "bridge" ]]; then
  COMPOSE_SRC="$E2E_DIR/docker-compose.bridge.yml"
  APACHE_LISTEN=80
else
  COMPOSE_SRC="$E2E_DIR/docker-compose.yml"
  APACHE_LISTEN="$KIWIPRESS_E2E_WP_PORT"
fi

export KIWIPRESS_E2E_COMPOSE_FILE="$(to_host_path "$COMPOSE_SRC")"

rm -rf "$RUNTIME_DIR"
mkdir -p "$RUNTIME_DIR"
export KIWIPRESS_E2E_APACHE_DIR="$(to_host_path "$RUNTIME_DIR")"
cat > "$RUNTIME_DIR/ports.conf" <<EOF
Listen ${APACHE_LISTEN}
EOF
cat > "$RUNTIME_DIR/vhost.conf" <<EOF
<VirtualHost *:${APACHE_LISTEN}>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html
    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
    SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=\$1
</VirtualHost>
EOF

compose() {
  docker_cli compose -f "$KIWIPRESS_E2E_COMPOSE_FILE" -p "$COMPOSE_PROJECT_NAME" "$@"
}

wp() {
  compose --profile cli run --rm -T --no-deps wpcli "$@"
}

cleanup() {
  local status=$?
  if [[ "${KIWIPRESS_E2E_KEEP:-}" == "1" ]]; then
    echo "KIWIPRESS_E2E_KEEP=1, leaving the WordPress stack up at ${KIWIPRESS_E2E_SITE_URL}."
    echo "Apache config remains in ${RUNTIME_DIR}."
    return "$status"
  fi
  if [[ -n "${KIWIPRESS_E2E_COMPOSE_FILE:-}" ]]; then
    compose down -v --remove-orphans >/dev/null 2>&1 || true
  fi
  if [[ -n "${RUNTIME_DIR:-}" ]]; then
    rm -rf "$RUNTIME_DIR"
  fi
  return "$status"
}
trap cleanup EXIT

docker_context="$(docker_cli context show 2>/dev/null || echo unknown)"
docker_server="$(docker_cli info --format '{{.OperatingSystem}}' 2>/dev/null || echo unknown)"
refresh_tool_paths
echo "KiwiPress bridge e2e"
echo "  bash=${BASH_SHOW} uname=$(uname -s 2>/dev/null || echo unknown) ostype=${OSTYPE:-unknown} msystem=${MSYSTEM:-none}"
echo "  docker=${DOCKER_SHOW}"
echo "  context=${docker_context} server=${docker_server}"
echo "  network=${NETWORK} (${NETWORK_REASON}) compose=${KIWIPRESS_E2E_COMPOSE_FILE}"
echo "  site=${KIWIPRESS_E2E_SITE_URL} apache_listen=${APACHE_LISTEN}"

echo "Starting MariaDB and WordPress on ${KIWIPRESS_E2E_SITE_URL}..."
compose up -d db wordpress

echo "Waiting for wp-config.php..."
ready=0
last_err=""
for attempt in $(seq 1 90); do
  if compose exec -T wordpress test -f /var/www/html/wp-config.php 2>"$RUNTIME_DIR/wait.err"; then
    ready=1
    break
  fi
  last_err="$(cat "$RUNTIME_DIR/wait.err" 2>/dev/null || true)"
  if [[ -n "$last_err" && $((attempt % 5)) -eq 1 ]]; then
    echo "  still waiting (${attempt}): ${last_err}" >&2
  fi
  sleep 2
done

if [[ "$ready" != "1" ]]; then
  echo "WordPress did not finish creating wp-config.php." >&2
  if [[ -n "$last_err" ]]; then
    echo "Last compose exec error:" >&2
    printf '%s\n' "$last_err" >&2
  fi
  if [[ "$NETWORK" == "host" ]]; then
    echo "If the daemon rejected host networking, re-run with KIWIPRESS_E2E_NETWORK=bridge." >&2
  fi
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
if ! node_cli --input-type=module -e '
const url = process.env.KIWIPRESS_E2E_SITE_URL + "/wp-json/kiwipress/v1/health";
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
'; then
  echo "WordPress at ${KIWIPRESS_E2E_SITE_URL} did not answer (network mode: ${NETWORK})." >&2
  if [[ "$NETWORK" == "host" ]]; then
    echo "Host networking did not publish ${KIWIPRESS_E2E_SITE_URL} on this machine. Re-run with KIWIPRESS_E2E_NETWORK=bridge." >&2
  else
    echo "Bridge mode publishes host port ${KIWIPRESS_E2E_WP_PORT} to container port 80. Check that the port is free and that Docker Desktop can bind localhost." >&2
  fi
  exit 1
fi

echo "Running the bridge end-to-end suite..."
cd "$ROOT"
yarn_cli workspace @citrusworx/kiwipress build
yarn_cli workspace @citrusworx/kiwipressapp-back exec vitest run --config "$E2E_DIR/vitest.config.ts"
