import { MongoClient } from 'mongodb';
export declare const mngzClient: MongoClient;
/**
 * Connects to a MongoDB database and provides functions to CRUD based on
 * provided document.
 *
 * @param none - Connects to the DB via the URI provided in the .env file.
 * @returns the MongoClient.
 */
export declare function connectMngz(): Promise<MongoClient>;
/**
 * Connects to a MongoDB database and provides functions to CRUD based on
 * provided document.
 *
 * @param client - the MongoClient to be closed.
 * @returns the MongoClient.
 */
export declare function closeMngz(client: MongoClient): Promise<void>;
/**
 * Connects to a MongoDB database and provides functions to CRUD based on
 * provided document.
 *
 * @param client - the MongoClient
 * @returns nothing
 */
export declare function Mngz(callback: (client: MongoClient) => Promise<void>): Promise<void>;
/**
 * Connects to a MongoDB database and provides functions to CRUD based on
 * provided document.
 *
 * @param client - the MongoClient to be closed.
 * @param dbName - the name of the database to be created.
 * @returns the MongoClient.
 */
export declare function createCollection(client: MongoClient, dbName: string): Promise<void>;
/**
 * Connects to a MongoDB database and provides functions to CRUD based on
 * provided document.
 *
 * @param client - the MongoClient to be closed.
 * @param collection - the name of the database to be edited.
 * @param document - the document to be inserted.
 * @returns the MongoClient.
 */
export declare function insertOne(client: MongoClient, collection: string, document?: any): Promise<void>;
/**
 * Connects to a MongoDB database and inserts many documents into a collection.
 *
 * @param client - the MongoClient to be closed.
 * @param collection - the name of the database to be edited.
 * @param documents - the documents to be inserted.
 * @returns the MongoClient.
 */
export declare function insertMany(client: MongoClient, collection: string, documents?: any[]): Promise<void>;
