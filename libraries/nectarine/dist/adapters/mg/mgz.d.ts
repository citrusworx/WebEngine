import { MongoClient } from "mongodb";
/** Lazy Mongo client — never construct at module import time. */
export declare function getMngzClient(): MongoClient;
export declare function connectMngz(): Promise<MongoClient>;
export declare function closeMngz(client: MongoClient): Promise<void>;
export declare function Mngz(callback: (client: MongoClient) => Promise<void>): Promise<void>;
export declare function createCollection(client: MongoClient, name: string): Promise<void>;
export declare function insertOne(client: MongoClient, collection: string, document?: any): Promise<void>;
export declare function insertMany(client: MongoClient, collection: string, documents?: any[]): Promise<void>;
