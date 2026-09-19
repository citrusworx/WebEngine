#!/bin/bash
set -euo pipefail
WORKDIR="${WORKDIR:-/opt/kiwipress}"
ENV_FILE="${ENV_FILE:-$WORKDIR/.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "No env file at $ENV_FILE; skipping template render"
  exit 0
fi

# Load KEY=value pairs without executing the rest of the environment.
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

render() {
  local src="$1"
  local dest="$2"
  python3 - "$src" "$dest" <<'PY'
import os, pathlib, re, sys
src, dest = sys.argv[1], sys.argv[2]
text = pathlib.Path(src).read_text()
pattern = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}")
text = pattern.sub(lambda m: os.environ.get(m.group(1), m.group(0)), text)
pathlib.Path(dest).write_text(text)
PY
}

for tmpl in "$WORKDIR"/traefik/dynamic/*.tmpl; do
  [ -f "$tmpl" ] || continue
  render "$tmpl" "${tmpl%.tmpl}"
done
