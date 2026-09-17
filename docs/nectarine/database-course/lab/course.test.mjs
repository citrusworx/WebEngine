// SQL literals here are isolated teaching/verification statements, not app handlers.
import test from "node:test";
import assert from "node:assert/strict";
import { openLab, sqlFile, compileNamed, runNamed } from "./runtime.mjs";
import { compileQuery, QueryCompileError } from "@citrusworx/nectarine/compiler";
import { applyMigrations } from "@citrusworx/nectarine/migrate";

const ids = (rows) => rows.map((row) => row.id);
async function lab(t) {
  const db = await openLab();
  t.after(() => db.close());
  return db;
}

test("SQL and named YAML answer the same category question", async (t) => {
  const db = await lab(t);
  const direct = (await db.exec(await sqlFile("01-select.sql")))[0].rows;
  const named = (await runNamed(db, "item", "get", "ByCategory", ["audio"])).rows;
  assert.deepEqual(direct, [{ id: 10, name: "Recorder" }, { id: 20, name: "Mixer" }]);
  assert.deepEqual(named, direct);
});

test("NULL equality, null predicates and overdue logic produce different sets", async (t) => {
  const db = await lab(t);
  const results = await db.exec(await sqlFile("02-null.sql"));
  assert.deepEqual(results[0].rows, []);
  assert.deepEqual(ids(results[1].rows), [101, 103]);
  assert.deepEqual(ids(results[2].rows), [101]);
  assert.deepEqual(ids((await runNamed(db, "loan", "get", "Overdue", ["2026-09-15"])).rows), [101]);
});

test("Joins preserve grain and ON versus WHERE changes unmatched-member results", async (t) => {
  const db = await lab(t);
  const results = await db.exec(await sqlFile("03-joins.sql"));
  assert.deepEqual(results[0].rows, [
    { id: 101, borrower: "Ada", item: "Recorder" },
    { id: 103, borrower: "Ada", item: "Camera" },
  ]);
  assert.deepEqual(results[1].rows, [
    { id: 1, name: "Ada", loan_id: 101 }, { id: 1, name: "Ada", loan_id: 103 },
    { id: 2, name: "Mina", loan_id: null }, { id: 3, name: "Sol", loan_id: null },
  ]);
  const moved = await db.query("SELECT m.id FROM members m LEFT JOIN loans l ON l.member_id=m.id WHERE l.returned_at IS NULL ORDER BY m.id");
  assert.deepEqual(ids(moved.rows), [1, 1, 3]);
});

test("Grouped counts include a real zero instead of counting the null-extended row", async (t) => {
  const db = await lab(t);
  const results = await db.exec(await sqlFile("04-groups.sql"));
  assert.deepEqual(results[0].rows.map(r => [r.name, Number(r.total_loans), Number(r.joined_rows)]), [
    ["Ada", 2, 2], ["Mina", 2, 2], ["Sol", 0, 1],
  ]);
  assert.deepEqual(results[1].rows.map(r => [r.member_id, Number(r.total)]), [[1, 2], [2, 2]]);
  assert.equal(Number((await runNamed(db, "loan", "get", "CountOpen")).rows[0].total), 2);
});

test("Stable ordering gives consistent offset and keyset pages", async (t) => {
  const db = await lab(t);
  const results = await db.exec(await sqlFile("05-pages.sql"));
  assert.deepEqual(ids(results[0].rows), [10, 20]);
  assert.deepEqual(ids(results[1].rows), [40, 30]);
  assert.deepEqual(results[2].rows, results[1].rows);
});

test("Write lab returns changed rows and rolls back to the four-item fixture", async (t) => {
  const db = await lab(t);
  const results = await db.exec(await sqlFile("06-writes.sql"));
  assert.deepEqual(results[1].rows, [{ id: 50, name: "Headphones" }]);
  assert.deepEqual(results[2].rows, [{ id: 50, name: "Studio headphones" }]);
  assert.deepEqual(results[3].rows, [{ id: 50 }]);
  assert.equal(Number(results.at(-1).rows[0].total_items), 4);
});

test("Database constraints reject duplicate identity, duplicate email, null and orphan references", async (t) => {
  const db = await lab(t);
  const cases = [
    ["INSERT INTO members VALUES (1, 'Other', 'other@example.test')", "23505"],
    ["INSERT INTO members VALUES (4, 'Other', 'ada@example.test')", "23505"],
    ["INSERT INTO members VALUES (4, NULL, 'other@example.test')", "23502"],
    ["INSERT INTO loans (id,member_id,item_id,due_on) VALUES (105,999,10,'2026-09-25')", "23503"],
    ["DELETE FROM items WHERE id=10", "23503"],
  ];
  for (const [sql, code] of cases) await assert.rejects(db.query(sql), error => error.code === code);
});

test("Bound SQL-looking category stays a value and cannot expand the result", async (t) => {
  const db = await lab(t);
  const input = "audio' OR TRUE --";
  assert.ok(!compileNamed("item", "get", "ByCategory").includes(input));
  assert.deepEqual((await runNamed(db, "item", "get", "ByCategory", [input])).rows, []);
  assert.equal((await runNamed(db, "item", "get", "AllItems")).rows.length, 4);
});

test("Named create, conflict handling, update and delete change actual database state", async (t) => {
  const db = await lab(t);
  const values = [50, "Headphones", "audio", JSON.stringify({ portable: true })];
  assert.deepEqual((await runNamed(db, "item", "create", "NewItem", values)).rows, [{ id: 50, name: "Headphones" }]);
  await runNamed(db, "item", "create", "EnsureItem", values);
  assert.equal((await runNamed(db, "item", "get", "AllItems")).rows.length, 5);
  await runNamed(db, "loan", "update", "MarkReturned", ["2026-09-15T12:00:00Z", 101]);
  assert.deepEqual(ids((await runNamed(db, "loan", "get", "OpenLoans")).rows), [103]);
  await runNamed(db, "item", "delete", "ById", [50]);
  assert.deepEqual((await runNamed(db, "item", "get", "ById", [50])).rows, []);
});

test("An absent write predicate fails compilation; unsupported limit is not silently relied on", () => {
  assert.throws(() => compileQuery({ table: "items", set: ["name"], values: ["$1"] }, "update"), QueryCompileError);
  assert.throws(() => compileQuery({ from: "items" }, "delete"), QueryCompileError);
  const sql = compileQuery({ select: ["id"], from: "items", limit: 1 });
  // Characterization of the current limitation, not a desired future contract.
  assert.equal(sql, "SELECT id FROM items");
});

test("Transaction rollback restores a transfer and a failed multi-step operation", async (t) => {
  const db = await lab(t);
  const results = await db.exec(await sqlFile("07-transaction.sql"));
  assert.deepEqual(results[3].rows, [{ id: 105, member_id: 2 }]);
  assert.deepEqual(results.at(-1).rows, [{ id: 101, member_id: 1 }]);
  await assert.rejects(db.transaction(async tx => {
    await runNamed(tx, "loan", "update", "MarkReturned", ["2026-09-15T12:00:00Z", 101]);
    await runNamed(tx, "loan", "create", "NewLoan", [105, 999, 10, "2026-09-25"]);
  }), error => error.code === "23503");
  assert.deepEqual(ids((await runNamed(db, "loan", "get", "OpenLoans")).rows), [101, 103]);
});

test("JSONB conditions work through raw SQL and Nectarine compilation", async (t) => {
  const db = await lab(t);
  const results = await db.exec(await sqlFile("08-json.sql"));
  assert.deepEqual(ids(results[0].rows), [10, 30]);
  assert.deepEqual(results[1].rows, [{ id: 10, input_text: "2" }, { id: 20, input_text: "8" }]);
  assert.deepEqual((await runNamed(db, "item", "get", "WithDetails", [JSON.stringify({ portable: true })])).rows, results[0].rows);
});

test("An EXPLAIN lab produces a plan without insisting on an index scan", async (t) => {
  const db = await lab(t);
  const results = await db.exec(await sqlFile("09-plan.sql"));
  assert.ok(results[0].rows.length > 0);
  assert.match(JSON.stringify(results[0].rows), /Scan/);
});

test("Real migration execution preserves renamed data, skips reruns and detects edits", async (t) => {
  const db = await lab(t);
  await db.exec("CREATE TABLE profiles (id INTEGER PRIMARY KEY, nickname TEXT); INSERT INTO profiles VALUES (1, 'Ada');");
  const migration = { version: "001_profile_handle", operations: [{ renameColumn: { table: "profiles", from: "nickname", to: "handle" } }] };
  const execute = {
    query: (sql, params) => db.query(sql, params),
    // PGlite is one session in this sequential lab; the runner owns BEGIN/COMMIT.
    withTransaction: work => work((sql, params) => db.query(sql, params)),
  };
  const first = await applyMigrations({ execute, migrations: [migration] });
  assert.deepEqual(first.applied, ["001_profile_handle"]);
  assert.deepEqual((await db.query("SELECT handle FROM profiles WHERE id=1")).rows, [{ handle: "Ada" }]);
  assert.deepEqual((await applyMigrations({ execute, migrations: [migration] })).skipped, ["001_profile_handle"]);
  const edited = { ...migration, operations: [{ renameColumn: { table: "profiles", from: "nickname", to: "alias" } }] };
  await assert.rejects(applyMigrations({ execute, migrations: [edited] }), /checksum mismatch/);
});
