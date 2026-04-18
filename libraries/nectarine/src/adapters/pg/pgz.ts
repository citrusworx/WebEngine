import { connect } from 'node:http2';
import { Client } from 'pg';

export class PgSql {
  private tables: Map<string, string> = new Map();
  private dbs: Map<string, string> = new Map();
  private readonly creds: Record<string, string> = {
    user: process.env.PG_USER!,
    password: process.env.PG_PASS!,
    host: process.env.PG_HOST!,
    port: process.env.PG_PORT!
  }

  async client(db: string){
    // TODO: detect the prescence of a .env file
    if(!db){
      console.log("Must have a .env file")
    }
    try{ 
      const client = new Client({
      ...this.creds,
      database: this.dbs.get(db)
    })

      return client;
    }
    catch(error){
      if(error instanceof Error){
        console.error("Error creating client:", error.message);
      }
    }
  }
  async connect(db: string){
    const client = await this.client(db);
    await client?.connect();
    return client;
  }
    
  async disconnect(client: Client){
      await client.end();
  }

  // Config-based query execution
  // 
  // @param client - the database client to use for executing the query
  // @param config - the configuration object containing the SQL query and parameters
  async query(client: Client, config: { sql: string, params?: any[] }){
    if(!this.client){
      console.log("No client found. Please connect to the database first.");
      return;
    }
    try {
      const res = await client.query(config.sql, config.params);
      return res;
    }
    catch(error){
      if(error instanceof Error){
        console.error("Error executing query:", error.message);
      }
    }
  }

  // Adds a table to the list of tables that the adapter can use
  // 
  // @param table - the name of the table to add to the list of tables
  // 
  // 
  addTable(table: string){
    this.tables.set(table, table);
  }

  addDb(db: string){
    this.dbs.set(db, db);
  }
}
