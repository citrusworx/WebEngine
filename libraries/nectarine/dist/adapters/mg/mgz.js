"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mngz = void 0;
exports.createMongoAdapter = createMongoAdapter;
exports.createMongoAdapterFromConfig = createMongoAdapterFromConfig;
exports.requireMongoCredentials = requireMongoCredentials;
exports.buildMongoUri = buildMongoUri;
const mongodb_1 = require("mongodb");
/**
 * MongoDB adapter for collection helpers on a connected client.
 *
 * Credentials are {@link DatabaseCredentials} from
 * {@link NectarineConfig.resolveCredentials} — YAML names the env keys;
 * this adapter receives the resolved values. It does not read `process.env`
 * itself.
 *
 * Connect once, run collection helpers, then disconnect. Helpers do not
 * close the client after a single operation.
 *
 * @example
 * ```ts
 * const creds = config.resolveCredentials("mongodb");
 * if (!creds) throw new Error("MongoDB env is incomplete");
 * const mg = createMongoAdapter(creds);
 * await mg.connect();
 * await mg.insertOne("users", { email: "a@example.com" });
 * await mg.disconnect();
 * ```
 */
class Mngz {
    constructor(credentials) {
        this.client = null;
        this.credentials = requireMongoCredentials(credentials);
        this.uri = buildMongoUri(this.credentials);
    }
    static fromCredentials(credentials) {
        return new Mngz(credentials);
    }
    get connected() {
        return this.client !== null;
    }
    async connect() {
        if (this.client) {
            return this.client;
        }
        const client = new mongodb_1.MongoClient(this.uri);
        try {
            await client.connect();
        }
        catch (error) {
            await client.close().catch(() => undefined);
            throw error;
        }
        this.client = client;
        return client;
    }
    /**
     * The connected driver's database for {@link DatabaseCredentials.database}.
     */
    db() {
        return this.requireClient().db(this.credentials.database);
    }
    /**
     * A collection on the connected database. Does not create it.
     */
    collection(name) {
        return this.db().collection(requireCollectionName(name));
    }
    async createCollection(name) {
        return this.db().createCollection(requireCollectionName(name));
    }
    async insertOne(collection, document) {
        if (document == null || typeof document !== "object" || Array.isArray(document)) {
            throw new Error("MongoDB adapter insertOne() requires a document object");
        }
        return this.collection(collection).insertOne(document);
    }
    async insertMany(collection, documents) {
        if (!Array.isArray(documents) || documents.length === 0) {
            throw new Error("MongoDB adapter insertMany() requires a non-empty documents array");
        }
        return this.collection(collection).insertMany([...documents]);
    }
    async disconnect() {
        const client = this.client;
        if (!client) {
            return;
        }
        this.client = null;
        await client.close();
    }
    async end() {
        return this.disconnect();
    }
    requireClient() {
        if (!this.client) {
            throw new Error("MongoDB adapter is not connected. Call connect() before using the client");
        }
        return this.client;
    }
}
exports.Mngz = Mngz;
function createMongoAdapter(credentials) {
    return Mngz.fromCredentials(credentials);
}
/**
 * Build a MongoDB adapter from a loaded config when the active vendor is
 * mongodb and env values resolve. Returns `null` when the vendor is not
 * mongodb or credentials are incomplete (same as `resolveCredentials()`).
 */
function createMongoAdapterFromConfig(config, vendor) {
    if (config.getVendor(vendor) !== "mongodb") {
        return null;
    }
    const credentials = config.resolveCredentials("mongodb");
    if (!credentials) {
        return null;
    }
    return createMongoAdapter(credentials);
}
function requireMongoCredentials(credentials) {
    if (!credentials) {
        throw new Error("MongoDB adapter requires DatabaseCredentials");
    }
    const user = credentials.user?.trim();
    const password = credentials.password?.trim();
    const host = credentials.host?.trim();
    const database = credentials.database?.trim();
    const port = Number(credentials.port);
    if (!user || !password || !host || !database) {
        throw new Error("MongoDB adapter requires complete credentials: user, password, host, port, and database");
    }
    if (!Number.isFinite(port)) {
        throw new Error(`MongoDB adapter port must be a finite number, got ${JSON.stringify(credentials.port)}`);
    }
    return { user, password, host, port, database };
}
function buildMongoUri(credentials) {
    const complete = requireMongoCredentials(credentials);
    const user = encodeURIComponent(complete.user);
    const password = encodeURIComponent(complete.password);
    return `mongodb://${user}:${password}@${complete.host}:${complete.port}/${complete.database}?authSource=admin`;
}
function requireCollectionName(name) {
    const collection = name?.trim();
    if (!collection) {
        throw new Error("MongoDB adapter requires a collection name");
    }
    return collection;
}
//# sourceMappingURL=mgz.js.map