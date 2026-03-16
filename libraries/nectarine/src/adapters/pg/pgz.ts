import { Client } from 'pg';

/**
 * Connects to a Postgres database and executes a query based on
 * provided values.
 *
 * @param query - The SQL query to be executed.
 * @param values - The values to be inserted into placeholder values.
 * @returns Promise resolving to an array of query results.
 */
export async function Pgsql<T = any>(query: string, values: any[] = []): Promise<T[]> {
  const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    password: process.env.PG_PASS,
    database: process.env.PG_DB,
    port: Number(process.env.PG_PORT),
  });

  try {
    await client.connect();

    // No generics needed here, just use QueryResult
    const dbNameResult = await client.query('SELECT current_database();');
    console.log('Connected to database:', dbNameResult.rows[0].current_database);

    // Use QueryResult without generics, rows will be typed separately
    const result = await client.query(query, values);

    // Cast rows to generic T[]
    return result.rows as T[];
  } catch (err: any) {
    if (err instanceof Error) {
      console.error('ERROR:', err);
    } else {
      console.error('ERROR: unknown error occurred', err);
    }
    throw err;
  } finally {
    await client.end();
  }
}
