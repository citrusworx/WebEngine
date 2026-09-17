import { openLab, sqlFile, runNamed } from "./runtime.mjs";

const db = await openLab();
try {
  const name = process.argv[2] ?? "01-select.sql";
  console.log("Fresh learning database; SQL lab:", name);
  const sql = await sqlFile(name);
  console.log(sql);
  for (const [index, result] of (await db.exec(sql)).entries()) {
    console.log("Result", index + 1);
    console.table(result.rows);
  }
  if (name === "01-select.sql") {
    console.log("Same question through named Nectarine YAML:");
    console.table((await runNamed(db, "item", "get", "ByCategory", ["audio"])).rows);
  }
} finally {
  await db.close();
}
