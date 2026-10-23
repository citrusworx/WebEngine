#!/usr/bin/env bash
# Exercise create (SERIAL id, returned row), list, whole-todo PATCH,
# the null-notes gap, and delete.
# The API must already be listening. API defaults to http://127.0.0.1:3001.
set -euo pipefail
API="${API:-http://127.0.0.1:3001}"
ID=""

cleanup() {
  if [[ -n "${ID}" ]]; then
    curl -sS -X DELETE "$API/api/todos/$ID" >/dev/null || true
  fi
}
trap cleanup EXIT

echo "health"
curl -sf "$API/api/health"
echo

echo "create"
CREATE="$(curl -sS -w '\n%{http_code}' -X POST "$API/api/todos" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Ship the course","notes":"Write the lessons","done":false}')"
printf '%s\n' "$CREATE"

ID="$(node --input-type=module -e '
const lines = process.argv[1].trim().split("\n");
lines.pop();
const row = JSON.parse(lines.join("\n"));
if (typeof row.id !== "number") {
  throw new Error("POST id " + JSON.stringify(row));
}
console.log(row.id);
' "$CREATE")"

echo "list"
curl -sf "$API/api/todos"
echo

echo "patch whole todo"
curl -sS -X PATCH "$API/api/todos/$ID" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Ship the course","notes":"Write the lessons","done":true}'
echo

echo "patch missing notes"
curl -sS -X PATCH "$API/api/todos/$ID" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Ship the course","done":true}'
echo

echo "read one"
ROW="$(curl -sf "$API/api/todos/$ID")"
printf '%s\n' "$ROW"

echo "delete"
DELETE="$(curl -sS -X DELETE "$API/api/todos/$ID")"
printf '%s\n' "$DELETE"
ID=""

node --input-type=module -e '
const create = process.argv[1];
const row = JSON.parse(process.argv[2]);
const deleted = JSON.parse(process.argv[3]);
const lines = create.trim().split("\n");
const status = lines.pop();
const created = JSON.parse(lines.join("\n"));
if (status !== "200") throw new Error("POST status " + status);
if (typeof created.id !== "number" || created.title !== "Ship the course") {
  throw new Error("POST body " + JSON.stringify(created));
}
if (created.notes !== "Write the lessons" || created.done !== false) {
  throw new Error("POST row " + JSON.stringify(created));
}
if (row.notes !== null) throw new Error("expected notes null, got " + JSON.stringify(row));
if (row.done !== true) throw new Error("expected done true");
if (row.id !== created.id) throw new Error("id changed " + JSON.stringify(row));
if (deleted.ok !== true || deleted.rowCount !== 1) throw new Error("DELETE " + JSON.stringify(deleted));
console.log("smoke ok");
' "$CREATE" "$ROW" "$DELETE"
