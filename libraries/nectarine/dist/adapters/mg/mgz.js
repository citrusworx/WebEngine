"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMngzClient = getMngzClient;
exports.connectMngz = connectMngz;
exports.closeMngz = closeMngz;
exports.Mngz = Mngz;
exports.createCollection = createCollection;
exports.insertOne = insertOne;
exports.insertMany = insertMany;
const mongodb_1 = require("mongodb");
let mngzClient = null;
function buildMongoUri() {
    const user = process.env.MG_USER;
    const password = process.env.MG_PASS;
    const host = process.env.MG_HOST;
    const port = process.env.MG_PORT;
    const database = process.env.MG_DB;
    if (!user || !password || !host || !port || !database) {
        throw new Error("MongoDB adapter requires MG_USER, MG_PASS, MG_HOST, MG_PORT, and MG_DB");
    }
    return `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`;
}
/** Lazy Mongo client — never construct at module import time. */
function getMngzClient() {
    if (!mngzClient) {
        mngzClient = new mongodb_1.MongoClient(buildMongoUri());
    }
    return mngzClient;
}
async function connectMngz() {
    const client = getMngzClient();
    await client.connect();
    console.log("Connected to Mongo");
    return client;
}
async function closeMngz(client) {
    await client.close();
    if (mngzClient === client) {
        mngzClient = null;
    }
    console.log("Connection to database is terminated");
}
async function Mngz(callback) {
    try {
        const client = await connectMngz();
        await callback(client);
    }
    catch (error) {
        console.error("ERROR", error.message, error.code, error.stack);
    }
}
async function createCollection(client, name) {
    try {
        const db = client.db(process.env.MG_DB);
        await db.createCollection(name);
        console.log("Created collection successfully");
        await closeMngz(client);
    }
    catch (error) {
        console.error("ERROR", error.message, error.code);
    }
}
async function insertOne(client, collection, document = {}) {
    const db = client.db(process.env.MG_DB);
    const varCollection = db.collection(collection);
    await varCollection.insertOne(document);
    console.log("Document inserted successfully");
    await closeMngz(client);
}
async function insertMany(client, collection, documents = []) {
    try {
        const db = client.db(process.env.MG_DB);
        const varCollection = db.collection(collection);
        await varCollection.insertMany(documents);
        console.log("Documents inserted successfully");
        await closeMngz(client);
    }
    catch (error) {
        console.error("ERROR", error.message, error.code);
    }
}
//# sourceMappingURL=mgz.js.map