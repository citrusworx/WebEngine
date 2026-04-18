"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.Mysql = Mysql;
exports.closeSql = closeSql;
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
/**
 * Connects to a Postgres database and executes a query based on
 * provided values.
 *
 * @param query - The SQL query to be executed.
 * @param values - The values to be inserted into placeholder values.
 * @returns Promise resolving to an array of query results.
 */
exports.pool = mysql.createPool({
    host: process.env.MS_HOST,
    user: process.env.MS_USER,
    password: process.env.MS_PASS,
    database: process.env.MS_DB,
    port: process.env.MS_PORT,
    // waitForConnections: true,
    // connectionLimit: 10,
    // queueLimit: 0
});
async function Mysql(query, values = []) {
    try {
        const [rows] = await exports.pool.execute(query, values);
        return rows;
    }
    catch (err) {
        console.error('ERROR:', err.stack);
        throw err;
    }
}
async function closeSql() {
    await exports.pool.end();
    console.log('MySQL connection terminated');
}
//# sourceMappingURL=msqlz.js.map