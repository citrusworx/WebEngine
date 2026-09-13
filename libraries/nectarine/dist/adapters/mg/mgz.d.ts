import { MongoClient } from "mongodb";
import type { Collection, Db, Document, InsertManyResult, InsertOneResult, OptionalUnlessRequiredId } from "mongodb";
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
export declare class Mngz {
    private client;
    private connecting;
    private readonly credentials;
    private readonly uri;
    constructor(credentials: DatabaseCredentials);
    static fromCredentials(credentials: DatabaseCredentials): Mngz;
    get connected(): boolean;
    connect(): Promise<MongoClient>;
    private openClient;
    /**
     * The connected driver's database for {@link DatabaseCredentials.database}.
     */
    db(): Db;
    /**
     * A collection on the connected database. Does not create it.
     */
    collection<T extends Document = Document>(name: string): Collection<T>;
    createCollection<T extends Document = Document>(name: string): Promise<Collection<T>>;
    insertOne<T extends Document = Document>(collection: string, document: OptionalUnlessRequiredId<T>): Promise<InsertOneResult<T>>;
    insertMany<T extends Document = Document>(collection: string, documents: ReadonlyArray<OptionalUnlessRequiredId<T>>): Promise<InsertManyResult<T>>;
    disconnect(): Promise<void>;
    end(): Promise<void>;
    private requireClient;
}
export declare function createMongoAdapter(credentials: DatabaseCredentials): Mngz;
/**
 * Build a MongoDB adapter from a loaded config when the active vendor is
 * mongodb and env values resolve. Returns `null` when the vendor is not
 * mongodb or credentials are incomplete (same as `resolveCredentials()`).
 */
export declare function createMongoAdapterFromConfig(config: NectarineConfig, vendor?: DatabaseVendor): Mngz | null;
export declare function requireMongoCredentials(credentials: Partial<DatabaseCredentials> | null | undefined): DatabaseCredentials;
export declare function buildMongoUri(credentials: DatabaseCredentials): string;
