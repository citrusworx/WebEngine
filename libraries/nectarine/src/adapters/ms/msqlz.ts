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

export const pool = mysql.createPool({
	host: process.env.MS_HOST,
	user: process.env.MS_USER,
	password: process.env.MS_PASS,
	database: process.env.MS_DB,
	port: process.env.MS_PORT,
	// waitForConnections: true,
	// connectionLimit: 10,
	// queueLimit: 0
})

export async function Mysql<T = any>(query: string, values: any[] = []): Promise<any>{
	try{
		const [rows] = await pool.execute(query, values);
		return rows as T[];
	}
	catch(err: any){
		console.error('ERROR:', err.stack);
		throw err;
	}
}

export async function closeSql(): Promise<void>{
	await pool.end()
	console.log('MySQL connection terminated');
}
