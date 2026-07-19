"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mysql = Mysql;
exports.closeSql = closeSql;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mysql = require("mysql2/promise");
let pool = null;
function getPool() {
    if (!pool) {
        const host = process.env.MS_HOST;
        const user = process.env.MS_USER;
        const password = process.env.MS_PASS;
        const database = process.env.MS_DB;
        const port = process.env.MS_PORT;
        if (!host || !user || !password || !database || !port) {
            throw new Error("MySQL adapter requires MS_HOST, MS_USER, MS_PASS, MS_DB, and MS_PORT");
        }
        pool = mysql.createPool({
            host,
            user,
            password,
            database,
            port: Number(port),
        });
    }
    return pool;
}
async function Mysql(query, values = []) {
    try {
        const [rows] = await getPool().execute(query, values);
        return rows;
    }
    catch (err) {
        console.error("ERROR:", err.stack);
        throw err;
    }
}
async function closeSql() {
    if (!pool) {
        return;
    }
    await pool.end();
    pool = null;
    console.log("MySQL connection terminated");
}
//# sourceMappingURL=msqlz.js.map