import {MongoClient, Db} from 'mongodb';




const uri = `mongodb://${process.env.MG_USER}:${process.env.MG_PASS}@${process.env.MG_HOST}:${process.env.MG_PORT}/${process.env.MG_DB}?authSource=admin`;

interface dbName {
	user: string;
}


 export const mngzClient = new MongoClient(uri);

/**
 * Connects to a MongoDB database and provides functions to CRUD based on
 * provided document.
 *
 * @param none - Connects to the DB via the URI provided in the .env file.
 * @returns the MongoClient.
 */

// Start the connection to DB
export async function connectMngz(): Promise<MongoClient>{

		await mngzClient.connect();
		console.log('Connected to Mongo');
		return mngzClient;
}

/**
 * Connects to a MongoDB database and provides functions to CRUD based on
 * provided document.
 *
 * @param client - the MongoClient to be closed.
 * @returns the MongoClient.
 */

//Close Connection to Database
export async function closeMngz(client: MongoClient): Promise<void>{
	await mngzClient.close()
	console.log("Connection to database is terminated");
}

/**
 * Connects to a MongoDB database and provides functions to CRUD based on
 * provided document.
 *
 * @param client - the MongoClient
 * @returns nothing
 */
// Connect to database and perform operation by callback
export async function Mngz(callback: (client: MongoClient) => Promise<void>): Promise<void> {
	try {
		const client = await connectMngz();
		await callback(client);
	}
	catch(error: any){
		console.error('ERROR', error.message, error.code, error.stack);
	}
}

/**
 * Connects to a MongoDB database and provides functions to CRUD based on
 * provided document.
 *
 * @param client - the MongoClient to be closed.
 * @param dbName - the name of the database to be created.
 * @returns the MongoClient.
 */

export async function createCollection(client: MongoClient, dbName: string): Promise<void>{
	try{
		const db: Db = mngzClient.db(process.env.MG_DB);
		await db.createCollection<dbName>(dbName);
		console.log('Created collection successfully');
		await closeMngz(client);
	}
	catch(error: any){
		console.error('ERROR', error.message, error.code);
	}
}

/**
 * Connects to a MongoDB database and provides functions to CRUD based on
 * provided document.
 *
 * @param client - the MongoClient to be closed.
 * @param collection - the name of the database to be edited.
 * @param document - the document to be inserted.
 * @returns the MongoClient.
 */

export async function insertOne(client: MongoClient, collection: string, document: any = {}): Promise<void>{
	const db: Db = client.db(process.env.MG_DB);
	const varCollection = db.collection(collection);
	await varCollection.insertOne(document);
	console.log('Document inserted successfully')
	await closeMngz(client);
}

/**
 * Connects to a MongoDB database and inserts many documents into a collection.
 *
 * @param client - the MongoClient to be closed.
 * @param collection - the name of the database to be edited.
 * @param documents - the documents to be inserted.
 * @returns the MongoClient.
 */

export async function insertMany(client: MongoClient, collection: string, documents: any[] = []): Promise<void>{
	try {
		const db: Db = client.db(process.env.MG_DB);
		const varCollection = db.collection(collection);
		await varCollection.insertMany(documents);
		console.log('Documents inserted successfully')
		await closeMngz(client);
	}
		catch(error: any){
			console.error('ERROR', error.message, error.code);
	}
}
