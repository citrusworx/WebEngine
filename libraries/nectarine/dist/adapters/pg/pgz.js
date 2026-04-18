"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgSql = void 0;
const pg_1 = require("pg");
class PgSql {
    constructor() {
        this.tables = new Map();
        this.dbs = new Map();
        this.creds = {
            user: process.env.PG_USER,
            password: process.env.PG_PASS,
            host: process.env.PG_HOST,
            port: process.env.PG_PORT
        };
    }
    async client(db) {
        // TODO: detect the prescence of a .env file
        if (!db) {
            console.log("Must have a .env file");
        }
        try {
            const client = new pg_1.Client({
                ...this.creds,
                database: this.dbs.get(db)
            });
            return client;
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("Error creating client:", error.message);
            }
        }
    }
    async connect(db) {
        const client = await this.client(db);
        await client?.connect();
        return client;
    }
    async disconnect(client) {
        await client.end();
    }
    // Config-based query execution
    // 
    // @param client - the database client to use for executing the query
    // @param config - the configuration object containing the SQL query and parameters
    async query(client, config) {
        if (!this.client) {
            console.log("No client found. Please connect to the database first.");
            return;
        }
        try {
            const res = await client.query(config.sql, config.params);
            return res;
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("Error executing query:", error.message);
            }
        }
    }
    // Adds a table to the list of tables that the adapter can use
    // 
    // @param table - the name of the table to add to the list of tables
    // 
    // 
    addTable(table) {
        this.tables.set(table, table);
    }
    addDb(db) {
        this.dbs.set(db, db);
    }
}
exports.PgSql = PgSql;
//# sourceMappingURL=pgz.js.map