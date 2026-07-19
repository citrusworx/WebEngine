// eslint-disable-next-line @typescript-eslint/no-require-imports
const mysql = require("mysql2/promise");

let pool: any = null;

function getPool() {
    if (!pool) {
        const host = process.env.MS_HOST;
        const user = process.env.MS_USER;
        const password = process.env.MS_PASS;
        const database = process.env.MS_DB;
        const port = process.env.MS_PORT;

        if (!host || !user || !password || !database || !port) {
            throw new Error(
                "MySQL adapter requires MS_HOST, MS_USER, MS_PASS, MS_DB, and MS_PORT",
            );
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

export async function Mysql<T = any>(query: string, values: any[] = []): Promise<any> {
    try {
        const [rows] = await getPool().execute(query, values);
        return rows as T[];
    } catch (err: any) {
        console.error("ERROR:", err.stack);
        throw err;
    }
}

export async function closeSql(): Promise<void> {
    if (!pool) {
        return;
    }
    await pool.end();
    pool = null;
    console.log("MySQL connection terminated");
}
