import { MongoClient, Db } from "mongodb";

interface dbName {
    name: string;
}

let mngzClient: MongoClient | null = null;

function buildMongoUri() {
    const user = process.env.MG_USER;
    const password = process.env.MG_PASS;
    const host = process.env.MG_HOST;
    const port = process.env.MG_PORT;
    const database = process.env.MG_DB;

    if (!user || !password || !host || !port || !database) {
        throw new Error(
            "MongoDB adapter requires MG_USER, MG_PASS, MG_HOST, MG_PORT, and MG_DB",
        );
    }

    return `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`;
}

/** Lazy Mongo client — never construct at module import time. */
export function getMngzClient(): MongoClient {
    if (!mngzClient) {
        mngzClient = new MongoClient(buildMongoUri());
    }
    return mngzClient;
}

export async function connectMngz(): Promise<MongoClient> {
    const client = getMngzClient();
    await client.connect();
    console.log("Connected to Mongo");
    return client;
}

export async function closeMngz(client: MongoClient): Promise<void> {
    await client.close();
    if (mngzClient === client) {
        mngzClient = null;
    }
    console.log("Connection to database is terminated");
}

export async function Mngz(callback: (client: MongoClient) => Promise<void>): Promise<void> {
    try {
        const client = await connectMngz();
        await callback(client);
    } catch (error: any) {
        console.error("ERROR", error.message, error.code, error.stack);
    }
}

export async function createCollection(client: MongoClient, name: string): Promise<void> {
    try {
        const db: Db = client.db(process.env.MG_DB);
        await db.createCollection<dbName>(name);
        console.log("Created collection successfully");
        await closeMngz(client);
    } catch (error: any) {
        console.error("ERROR", error.message, error.code);
    }
}

export async function insertOne(
    client: MongoClient,
    collection: string,
    document: any = {},
): Promise<void> {
    const db: Db = client.db(process.env.MG_DB);
    const varCollection = db.collection(collection);
    await varCollection.insertOne(document);
    console.log("Document inserted successfully");
    await closeMngz(client);
}

export async function insertMany(
    client: MongoClient,
    collection: string,
    documents: any[] = [],
): Promise<void> {
    try {
        const db: Db = client.db(process.env.MG_DB);
        const varCollection = db.collection(collection);
        await varCollection.insertMany(documents);
        console.log("Documents inserted successfully");
        await closeMngz(client);
    } catch (error: any) {
        console.error("ERROR", error.message, error.code);
    }
}
