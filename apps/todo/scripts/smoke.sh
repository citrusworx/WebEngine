#!/usr/bin/env bash
# Exercise create, list, whole-todo PATCH, the null-notes gap, and delete.
# The API must already be listening. API defaults to http://127.0.0.1:3001.
set -euo pipefail
API="${API:-http://127.0.0.1:3001}"
export API
ID="$(node -e 'console.log(crypto.randomUUID())')"
export ID

cleanup() {
  curl -sS -X DELETE "$API/api/todos/$ID" >/dev/null || true
}
trap cleanup EXIT

echo "health"
curl -sf "$API/api/health"
echo

echo "create $ID"
CREATE="$(curl -sS -w '\n%{http_code}' -X POST "$API/api/todos" \
  -H 'Content-Type: application/json' \
  -d "{\"id\":\"$ID\",\"title\":\"Ship the course\",\"notes\":\"Write the lessons\",\"done\":false}")"
printf '%s\n' "$CREATE"

echo "list"
curl -sf "$API/api/todos"
echo

echo "patch whole todo"
curl -sS -X PATCH "$API/api/todos/$ID" \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Ship the course\",\"notes\":\"Write the lessons\",\"done\":true}"
echo

echo "patch missing notes"
curl -sS -X PATCH "$API/api/todos/$ID" \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Ship the course\",\"done\":true}"
echo

echo "read one"
ROW="$(curl -sf "$API/api/todos/$ID")"
printf '%s\n' "$ROW"

echo "delete"
DELETE="$(curl -sS -X DELETE "$API/api/todos/$ID")"
printf '%s\n' "$DELETE"

node --input-type=module -e '
const create = process.argv[1];
const row = JSON.parse(process.argv[2]);
const deleted = JSON.parse(process.argv[3]);
const lines = create.trim().split("\n");
const status = lines.pop();
const ack = JSON.parse(lines.join("\n"));
if (status !== "200") throw new Error("POST status " + status);
if (ack.ok !== true || ack.rowCount !== 1 || Object.hasOwn(ack, "title")) {
  throw new Error("POST body " + JSON.stringify(ack));
}
if (row.notes !== null) throw new Error("expected notes null, got " + JSON.stringify(row));
if (row.done !== true) throw new Error("expected done true");
if (deleted.ok !== true || deleted.rowCount !== 1) throw new Error("DELETE " + JSON.stringify(deleted));
console.log("smoke ok");
' "$CREATE" "$ROW" "$DELETE"
