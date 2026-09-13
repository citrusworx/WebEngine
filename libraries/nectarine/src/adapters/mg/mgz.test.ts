import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadNectarineConfig } from "../../config/loadConfig.js";
import type { DatabaseCredentials } from "../../config/types.js";
import type { NectarineConfig } from "../../config/NectarineConfig.js";

const mocks = vi.hoisted(() => ({
    connect: vi.fn(),
    close: vi.fn(),
    db: vi.fn(),
    collection: vi.fn(),
    createCollection: vi.fn(),
    insertOne: vi.fn(),
    insertMany: vi.fn(),
}));

vi.mock("mongodb", () => ({
    MongoClient: vi.fn(function MockMongoClient() {
        return {
            connect: mocks.connect,
            close: mocks.close,
            db: mocks.db,
        };
    }),
}));

import { MongoClient } from "mongodb";
import {
    buildMongoUri,
    createMongoAdapter,
    createMongoAdapterFromConfig,
    Mngz,
    requireMongoCredentials,
} from "./mgz.js";

const fixtureConfig = path.resolve(
    import.meta.dirname,
    "../../config/__fixtures__/nectarine.config.yaml",
);

const mongoFixtureConfig = path.resolve(
    import.meta.dirname,
    "../../config/__fixtures__/nectarine.mongodb.config.yaml",
);

const creds: DatabaseCredentials = {
    user: "bw",
    password: "secret",
    host: "localhost",
    port: 27017,
    database: "blackwater",
};

const expectedUri =
    "mongodb://bw:secret@localhost:27017/blackwater?authSource=admin";

function mockClient() {
    return vi.mocked(MongoClient).mock.results.at(-1)?.value as {
        connect: typeof mocks.connect;
        close: typeof mocks.close;
        db: typeof mocks.db;
    };
}

describe("Mngz", () => {
    beforeEach(() => {
        vi.mocked(MongoClient).mockClear();
        mocks.connect.mockReset();
        mocks.close.mockReset();
        mocks.db.mockReset();
        mocks.collection.mockReset();
        mocks.createCollection.mockReset();
        mocks.insertOne.mockReset();
        mocks.insertMany.mockReset();
        mocks.connect.mockResolvedValue(undefined);
        mocks.close.mockResolvedValue(undefined);
        mocks.db.mockReturnValue({
            collection: mocks.collection,
            createCollection: mocks.createCollection,
        });
        mocks.collection.mockReturnValue({
            insertOne: mocks.insertOne,
            insertMany: mocks.insertMany,
        });
        mocks.createCollection.mockResolvedValue({ name: "users" });
        mocks.insertOne.mockResolvedValue({ acknowledged: true, insertedId: "1" });
        mocks.insertMany.mockResolvedValue({ acknowledged: true, insertedCount: 2 });
    });

    it("constructs from DatabaseCredentials and does not read process.env", async () => {
        const previous = {
            MG_USER: process.env.MG_USER,
            MG_PASS: process.env.MG_PASS,
            MG_HOST: process.env.MG_HOST,
            MG_PORT: process.env.MG_PORT,
            MG_DB: process.env.MG_DB,
        };

        process.env.MG_USER = "env-user";
        process.env.MG_PASS = "env-pass";
        process.env.MG_HOST = "env-host";
        process.env.MG_PORT = "9999";
        process.env.MG_DB = "env-db";

        try {
            const adapter = createMongoAdapter(creds);
            expect(adapter).toBeInstanceOf(Mngz);
            expect(adapter.connected).toBe(false);

            await adapter.connect();

            expect(MongoClient).toHaveBeenCalledWith(expectedUri);
            expect(mocks.connect).toHaveBeenCalledOnce();
            expect(adapter.connected).toBe(true);
        } finally {
            process.env.MG_USER = previous.MG_USER;
            process.env.MG_PASS = previous.MG_PASS;
            process.env.MG_HOST = previous.MG_HOST;
            process.env.MG_PORT = previous.MG_PORT;
            process.env.MG_DB = previous.MG_DB;
        }
    });

    it("Mngz.fromCredentials matches createMongoAdapter", () => {
        const fromFactory = createMongoAdapter(creds);
        const fromStatic = Mngz.fromCredentials(creds);
        expect(fromFactory).toBeInstanceOf(Mngz);
        expect(fromStatic).toBeInstanceOf(Mngz);
    });

    it("rejects incomplete credentials", () => {
        expect(() => createMongoAdapter({ ...creds, user: "" })).toThrowError(
            /complete credentials/,
        );
        expect(() => createMongoAdapter({ ...creds, password: "   " })).toThrowError(
            /complete credentials/,
        );
        expect(() => createMongoAdapter({ ...creds, host: "" })).toThrowError(
            /complete credentials/,
        );
        expect(() => createMongoAdapter({ ...creds, database: "" })).toThrowError(
            /complete credentials/,
        );
        expect(() =>
            requireMongoCredentials(null),
        ).toThrowError(/requires DatabaseCredentials/);
        expect(() => createMongoAdapter({ ...creds, port: Number.NaN })).toThrowError(
            /finite number/,
        );
        expect(() =>
            requireMongoCredentials({ ...creds, port: "27017" as unknown as number }),
        ).not.toThrow();
        expect(
            requireMongoCredentials({ ...creds, port: "27017" as unknown as number }).port,
        ).toBe(27017);
    });

    it("buildMongoUri encodes user and password", () => {
        expect(buildMongoUri(creds)).toBe(expectedUri);
        expect(
            buildMongoUri({ ...creds, user: "a b", password: "p@ss/w" }),
        ).toBe("mongodb://a%20b:p%40ss%2Fw@localhost:27017/blackwater?authSource=admin");
    });

    it("insertOne() writes on the connected client and does not close", async () => {
        const adapter = createMongoAdapter(creds);
        await adapter.connect();

        const document = { email: "a@example.com" };
        const result = await adapter.insertOne("users", document);

        expect(mockClient().db).toHaveBeenCalledWith("blackwater");
        expect(mocks.collection).toHaveBeenCalledWith("users");
        expect(mocks.insertOne).toHaveBeenCalledWith(document);
        expect(result).toEqual({ acknowledged: true, insertedId: "1" });
        expect(mocks.close).not.toHaveBeenCalled();
        expect(adapter.connected).toBe(true);
    });

    it("insertMany() writes on the connected client and does not close", async () => {
        const adapter = createMongoAdapter(creds);
        await adapter.connect();

        const documents = [{ name: "a" }, { name: "b" }];
        const result = await adapter.insertMany("users", documents);

        expect(mocks.insertMany).toHaveBeenCalledWith(documents);
        expect(result).toEqual({ acknowledged: true, insertedCount: 2 });
        expect(mocks.close).not.toHaveBeenCalled();
        expect(adapter.connected).toBe(true);
    });

    it("createCollection() uses the connected database and does not close", async () => {
        const adapter = createMongoAdapter(creds);
        await adapter.connect();

        await adapter.createCollection("orders");

        expect(mocks.createCollection).toHaveBeenCalledWith("orders");
        expect(mocks.close).not.toHaveBeenCalled();
        expect(adapter.connected).toBe(true);
    });

    it("collection helpers throw when not connected", async () => {
        const adapter = createMongoAdapter(creds);
        expect(() => adapter.db()).toThrowError(/not connected/);
        expect(() => adapter.collection("users")).toThrowError(/not connected/);
        await expect(adapter.createCollection("users")).rejects.toThrowError(/not connected/);
        await expect(adapter.insertOne("users", { x: 1 })).rejects.toThrowError(/not connected/);
        await expect(adapter.insertMany("users", [{ x: 1 }])).rejects.toThrowError(/not connected/);
        expect(mocks.insertOne).not.toHaveBeenCalled();
    });

    it("collection helpers throw on empty collection name", async () => {
        const adapter = createMongoAdapter(creds);
        await adapter.connect();
        expect(() => adapter.collection("   ")).toThrowError(/collection name/);
        await expect(adapter.createCollection("")).rejects.toThrowError(/collection name/);
        await expect(adapter.insertOne("", { x: 1 })).rejects.toThrowError(/collection name/);
    });

    it("insertOne() / insertMany() reject invalid documents", async () => {
        const adapter = createMongoAdapter(creds);
        await adapter.connect();
        await expect(
            adapter.insertOne("users", null as unknown as object),
        ).rejects.toThrowError(/document object/);
        await expect(adapter.insertMany("users", [])).rejects.toThrowError(/non-empty documents/);
        await expect(
            adapter.insertMany("users", null as unknown as object[]),
        ).rejects.toThrowError(/non-empty documents/);
    });

    it("connect() is idempotent", async () => {
        const adapter = createMongoAdapter(creds);
        const first = await adapter.connect();
        const second = await adapter.connect();
        expect(first).toBe(second);
        expect(MongoClient).toHaveBeenCalledOnce();
        expect(mocks.connect).toHaveBeenCalledOnce();
    });

    it("connect() shares one in-flight client", async () => {
        let release!: (value: undefined) => void;
        mocks.connect.mockImplementation(
            () =>
                new Promise((resolve) => {
                    release = resolve;
                }),
        );

        const adapter = createMongoAdapter(creds);
        const first = adapter.connect();
        const second = adapter.connect();
        release(undefined);

        expect(await first).toBe(await second);
        expect(MongoClient).toHaveBeenCalledOnce();
        expect(mocks.connect).toHaveBeenCalledOnce();
    });

    it("connect() closes the client when connect fails", async () => {
        const failure = new Error("ECONNREFUSED");
        mocks.connect.mockRejectedValue(failure);
        const adapter = createMongoAdapter(creds);

        await expect(adapter.connect()).rejects.toBe(failure);
        expect(mocks.close).toHaveBeenCalledOnce();
        expect(adapter.connected).toBe(false);
    });

    it("disconnect() / end() close the client and require reconnect", async () => {
        const adapter = createMongoAdapter(creds);
        await adapter.connect();
        await adapter.insertOne("users", { x: 1 });
        await adapter.disconnect();

        expect(mocks.close).toHaveBeenCalledOnce();
        expect(adapter.connected).toBe(false);
        await expect(adapter.insertOne("users", { x: 2 })).rejects.toThrowError(/not connected/);

        await adapter.connect();
        await adapter.end();
        expect(mocks.close).toHaveBeenCalledTimes(2);
        expect(adapter.connected).toBe(false);
    });

    it("disconnect() is a no-op when not connected", async () => {
        const adapter = createMongoAdapter(creds);
        await expect(adapter.disconnect()).resolves.toBeUndefined();
        expect(mocks.close).not.toHaveBeenCalled();
    });
});

describe("createMongoAdapterFromConfig", () => {
    it("builds an adapter from NectarineConfig.resolveCredentials()", () => {
        const config = loadNectarineConfig(mongoFixtureConfig, {
            env: {
                MG_USER: "bw",
                MG_PASS: "secret",
                MG_HOST: "localhost",
                MG_PORT: "27017",
                MG_DB: "blackwater",
            },
            loadResources: false,
        });

        const adapter = createMongoAdapterFromConfig(config);
        expect(adapter).toBeInstanceOf(Mngz);
        expect(config.getVendor()).toBe("mongodb");
        expect(config.resolveCredentials()).toEqual(creds);
    });

    it("builds from a postgres-default config when vendor is mongodb", () => {
        const config = loadNectarineConfig(fixtureConfig, {
            env: {
                MG_USER: "bw",
                MG_PASS: "secret",
                MG_HOST: "localhost",
                MG_PORT: "27017",
                MG_DB: "blackwater",
            },
            loadResources: false,
        });

        expect(createMongoAdapterFromConfig(config)).toBeNull();
        expect(createMongoAdapterFromConfig(config, "mongodb")).toBeInstanceOf(Mngz);
    });

    it("returns null when credentials are incomplete", () => {
        const config = loadNectarineConfig(mongoFixtureConfig, {
            env: { MG_USER: "bw" },
            loadResources: false,
        });

        expect(createMongoAdapterFromConfig(config)).toBeNull();
    });

    it("returns null when the active vendor is not mongodb", () => {
        const config = {
            getVendor: () => "postgres" as const,
            resolveCredentials: () => creds,
        };

        expect(createMongoAdapterFromConfig(config as unknown as NectarineConfig)).toBeNull();
    });
});
