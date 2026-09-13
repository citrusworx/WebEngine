import { MongoClient } from "mongodb";
import type {
    Collection,
    Db,
    Document,
    InsertManyResult,
    InsertOneResult,
    OptionalUnlessRequiredId,
} from "mongodb";
import type { NectarineConfig } from "../../config/NectarineConfig.js";
import type { DatabaseCredentials, DatabaseVendor } from "../../config/types.js";

export type { DatabaseCredentials, DatabaseVendor } from "../../config/types.js";

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
export class Mngz {
    private client: MongoClient | null = null;
    private connecting: Promise<MongoClient> | null = null;
    private readonly credentials: DatabaseCredentials;
    private readonly uri: string;

    constructor(credentials: DatabaseCredentials) {
        this.credentials = requireMongoCredentials(credentials);
        this.uri = buildMongoUri(this.credentials);
    }

    static fromCredentials(credentials: DatabaseCredentials): Mngz {
        return new Mngz(credentials);
    }

    get connected(): boolean {
        return this.client !== null;
    }

    async connect(): Promise<MongoClient> {
        if (this.client) {
            return this.client;
        }
        if (this.connecting) {
            return this.connecting;
        }

        this.connecting = this.openClient();
        try {
            return await this.connecting;
        } finally {
            this.connecting = null;
        }
    }

    private async openClient(): Promise<MongoClient> {
        const client = new MongoClient(this.uri);

        try {
            await client.connect();
        } catch (error) {
            await client.close().catch(() => undefined);
            throw error;
        }

        this.client = client;
        return client;
    }

    /**
     * The connected driver's database for {@link DatabaseCredentials.database}.
     */
    db(): Db {
        return this.requireClient().db(this.credentials.database);
    }

    /**
     * A collection on the connected database. Does not create it.
     */
    collection<T extends Document = Document>(name: string): Collection<T> {
        return this.db().collection<T>(requireCollectionName(name));
    }

    async createCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
        return this.db().createCollection<T>(requireCollectionName(name));
    }

    async insertOne<T extends Document = Document>(
        collection: string,
        document: OptionalUnlessRequiredId<T>,
    ): Promise<InsertOneResult<T>> {
        if (document == null || typeof document !== "object" || Array.isArray(document)) {
            throw new Error("MongoDB adapter insertOne() requires a document object");
        }

        return this.collection<T>(collection).insertOne(document);
    }

    async insertMany<T extends Document = Document>(
        collection: string,
        documents: ReadonlyArray<OptionalUnlessRequiredId<T>>,
    ): Promise<InsertManyResult<T>> {
        if (!Array.isArray(documents) || documents.length === 0) {
            throw new Error("MongoDB adapter insertMany() requires a non-empty documents array");
        }

        return this.collection<T>(collection).insertMany([...documents]);
    }

    async disconnect(): Promise<void> {
        if (this.connecting) {
            await this.connecting.catch(() => undefined);
        }

        const client = this.client;
        if (!client) {
            return;
        }
        this.client = null;
        await client.close();
    }

    async end(): Promise<void> {
        return this.disconnect();
    }

    private requireClient(): MongoClient {
        if (!this.client) {
            throw new Error(
                "MongoDB adapter is not connected. Call connect() before using the client",
            );
        }
        return this.client;
    }
}

export function createMongoAdapter(credentials: DatabaseCredentials): Mngz {
    return Mngz.fromCredentials(credentials);
}

/**
 * Build a MongoDB adapter from a loaded config when the active vendor is
 * mongodb and env values resolve. Returns `null` when the vendor is not
 * mongodb or credentials are incomplete (same as `resolveCredentials()`).
 */
export function createMongoAdapterFromConfig(
    config: NectarineConfig,
    vendor?: DatabaseVendor,
): Mngz | null {
    if (config.getVendor(vendor) !== "mongodb") {
        return null;
    }

    const credentials = config.resolveCredentials("mongodb");
    if (!credentials) {
        return null;
    }

    return createMongoAdapter(credentials);
}

export function requireMongoCredentials(
    credentials: Partial<DatabaseCredentials> | null | undefined,
): DatabaseCredentials {
    if (!credentials) {
        throw new Error("MongoDB adapter requires DatabaseCredentials");
    }

    const user = credentials.user?.trim();
    const password = credentials.password?.trim();
    const host = credentials.host?.trim();
    const database = credentials.database?.trim();
    const port = Number(credentials.port);

    if (!user || !password || !host || !database) {
        throw new Error(
            "MongoDB adapter requires complete credentials: user, password, host, port, and database",
        );
    }

    if (!Number.isFinite(port)) {
        throw new Error(
            `MongoDB adapter port must be a finite number, got ${JSON.stringify(credentials.port)}`,
        );
    }

    return { user, password, host, port, database };
}

export function buildMongoUri(credentials: DatabaseCredentials): string {
    const complete = requireMongoCredentials(credentials);
    const user = encodeURIComponent(complete.user);
    const password = encodeURIComponent(complete.password);
    return `mongodb://${user}:${password}@${complete.host}:${complete.port}/${complete.database}?authSource=admin`;
}

function requireCollectionName(name: string): string {
    const collection = name?.trim();
    if (!collection) {
        throw new Error("MongoDB adapter requires a collection name");
    }
    return collection;
}
