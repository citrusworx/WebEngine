import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadNectarineConfig } from "../../config/loadConfig.js";
import type { DatabaseCredentials } from "../../config/types.js";
import type { NectarineConfig } from "../../config/NectarineConfig.js";

const mocks = vi.hoisted(() => ({
    createPool: vi.fn(),
    execute: vi.fn(),
    end: vi.fn(),
    getConnection: vi.fn(),
    release: vi.fn(),
}));

vi.mock("mysql2/promise", () => ({
    createPool: mocks.createPool,
}));

import { createPool } from "mysql2/promise";
import {
    createMysqlAdapter,
    createMysqlAdapterFromConfig,
    MysqlSql,
    requireMysqlCredentials,
} from "./msqlz.js";

const fixtureConfig = path.resolve(
    import.meta.dirname,
    "../../config/__fixtures__/nectarine.config.yaml",
);

const mysqlFixtureConfig = path.resolve(
    import.meta.dirname,
    "../../config/__fixtures__/nectarine.mysql.config.yaml",
);

const creds: DatabaseCredentials = {
    user: "bw",
    password: "secret",
    host: "localhost",
    port: 3306,
    database: "blackwater",
};

function mockPool() {
    return vi.mocked(createPool).mock.results.at(-1)?.value as {
        execute: typeof mocks.execute;
        end: typeof mocks.end;
        getConnection: typeof mocks.getConnection;
    };
}

describe("MysqlSql", () => {
    beforeEach(() => {
        mocks.createPool.mockReset();
        mocks.execute.mockReset();
        mocks.end.mockReset();
        mocks.getConnection.mockReset();
        mocks.release.mockReset();
        mocks.createPool.mockImplementation(() => ({
            execute: mocks.execute,
            end: mocks.end,
            getConnection: mocks.getConnection,
        }));
        mocks.getConnection.mockResolvedValue({ release: mocks.release });
        mocks.execute.mockResolvedValue([[], []]);
        mocks.end.mockResolvedValue(undefined);
    });

    it("constructs from DatabaseCredentials and does not read process.env", async () => {
        const previous = {
            MS_USER: process.env.MS_USER,
            MS_PASS: process.env.MS_PASS,
            MS_HOST: process.env.MS_HOST,
            MS_PORT: process.env.MS_PORT,
            MS_DB: process.env.MS_DB,
        };

        process.env.MS_USER = "env-user";
        process.env.MS_PASS = "env-pass";
        process.env.MS_HOST = "env-host";
        process.env.MS_PORT = "9999";
        process.env.MS_DB = "env-db";

        try {
            const adapter = createMysqlAdapter(creds);
            expect(adapter).toBeInstanceOf(MysqlSql);
            expect(adapter.connected).toBe(false);

            await adapter.connect();

            expect(createPool).toHaveBeenCalledWith({
                user: "bw",
                password: "secret",
                host: "localhost",
                port: 3306,
                database: "blackwater",
            });
            expect(mocks.getConnection).toHaveBeenCalledOnce();
            expect(mocks.release).toHaveBeenCalledOnce();
            expect(adapter.connected).toBe(true);
        } finally {
            process.env.MS_USER = previous.MS_USER;
            process.env.MS_PASS = previous.MS_PASS;
            process.env.MS_HOST = previous.MS_HOST;
            process.env.MS_PORT = previous.MS_PORT;
            process.env.MS_DB = previous.MS_DB;
        }
    });

    it("MysqlSql.fromCredentials matches createMysqlAdapter", () => {
        const fromFactory = createMysqlAdapter(creds);
        const fromStatic = MysqlSql.fromCredentials(creds);
        expect(fromFactory).toBeInstanceOf(MysqlSql);
        expect(fromStatic).toBeInstanceOf(MysqlSql);
    });

    it("rejects incomplete credentials", () => {
        expect(() => createMysqlAdapter({ ...creds, user: "" })).toThrowError(
            /complete credentials/,
        );
        expect(() => createMysqlAdapter({ ...creds, password: "" })).toThrowError(
            /complete credentials/,
        );
        expect(
            requireMysqlCredentials({ ...creds, password: "  secret  " }).password,
        ).toBe("  secret  ");
        expect(() => createMysqlAdapter({ ...creds, host: "" })).toThrowError(
            /complete credentials/,
        );
        expect(() => createMysqlAdapter({ ...creds, database: "" })).toThrowError(
            /complete credentials/,
        );
        expect(() =>
            requireMysqlCredentials(null),
        ).toThrowError(/requires DatabaseCredentials/);
        expect(() => createMysqlAdapter({ ...creds, port: Number.NaN })).toThrowError(
            /finite number/,
        );
        expect(() =>
            requireMysqlCredentials({ ...creds, port: "3306" as unknown as number }),
        ).not.toThrow();
        expect(
            requireMysqlCredentials({ ...creds, port: "3306" as unknown as number }).port,
        ).toBe(3306);
    });

    it("query() runs parameterized SQL on the connected pool", async () => {
        mocks.execute.mockResolvedValue([[{ id: 1 }], []]);
        const adapter = createMysqlAdapter(creds);
        await adapter.connect();

        const result = await adapter.query("SELECT id FROM users WHERE id = ?", [1]);

        expect(mockPool().execute).toHaveBeenCalledWith(
            "SELECT id FROM users WHERE id = ?",
            [1],
        );
        expect(result.rows).toEqual([{ id: 1 }]);
    });

    it("query() rewrites compiler $1 SQL to ? and binds params", async () => {
        mocks.execute.mockResolvedValue([[{ id: 1 }], []]);
        const adapter = createMysqlAdapter(creds);
        await adapter.connect();

        const result = await adapter.query("SELECT id FROM users WHERE id = $1", [1]);

        expect(mockPool().execute).toHaveBeenCalledWith(
            "SELECT id FROM users WHERE id = ?",
            [1],
        );
        expect(result.rows).toEqual([{ id: 1 }]);
    });

    it("query() maps $N::jsonb to CAST(? AS JSON) and stringifies objects", async () => {
        const adapter = createMysqlAdapter(creds);
        await adapter.connect();

        await adapter.query("INSERT INTO products (id, payload) VALUES ($1, $2::jsonb)", [
            "sku-1",
            { sku: "sku-1" },
        ]);

        expect(mockPool().execute).toHaveBeenCalledWith(
            "INSERT INTO products (id, payload) VALUES (?, CAST(? AS JSON))",
            ["sku-1", '{"sku":"sku-1"}'],
        );
    });

    it("query() throws on unsupported casts before execute", async () => {
        const adapter = createMysqlAdapter(creds);
        await adapter.connect();
        await expect(adapter.query("SELECT * FROM t WHERE id = $1::int", [1])).rejects.toThrowError(
            /unsupported bind cast \$1::int/,
        );
        expect(mocks.execute).not.toHaveBeenCalled();
    });

    it("query() throws when not connected", async () => {
        const adapter = createMysqlAdapter(creds);
        await expect(adapter.query("SELECT 1")).rejects.toThrowError(/not connected/);
        expect(mocks.execute).not.toHaveBeenCalled();
    });

    it("query() throws on empty SQL", async () => {
        const adapter = createMysqlAdapter(creds);
        await adapter.connect();
        await expect(adapter.query("   ")).rejects.toThrowError(/SQL string/);
    });

    it("connect() is idempotent", async () => {
        const adapter = createMysqlAdapter(creds);
        const first = await adapter.connect();
        const second = await adapter.connect();
        expect(first).toBe(second);
        expect(createPool).toHaveBeenCalledOnce();
        expect(mocks.getConnection).toHaveBeenCalledOnce();
    });

    it("connect() serializes overlapping callers onto one pool", async () => {
        let releaseHold: ((connection: { release: typeof mocks.release }) => void) | undefined;
        mocks.getConnection.mockImplementation(
            () =>
                new Promise((resolve) => {
                    releaseHold = resolve;
                }),
        );

        const adapter = createMysqlAdapter(creds);
        const first = adapter.connect();
        const second = adapter.connect();

        expect(createPool).toHaveBeenCalledOnce();
        expect(releaseHold).toBeTypeOf("function");
        releaseHold!({ release: mocks.release });

        const [a, b] = await Promise.all([first, second]);
        expect(a).toBe(b);
        expect(mocks.getConnection).toHaveBeenCalledOnce();
        expect(adapter.connected).toBe(true);
    });

    it("preserves leading and trailing password whitespace", async () => {
        const adapter = createMysqlAdapter({ ...creds, password: "  secret  " });
        await adapter.connect();
        expect(createPool).toHaveBeenCalledWith({
            user: "bw",
            password: "  secret  ",
            host: "localhost",
            port: 3306,
            database: "blackwater",
        });
    });

    it("connect() ends the pool when getConnection fails", async () => {
        const failure = new Error("ECONNREFUSED");
        mocks.getConnection.mockRejectedValue(failure);
        const adapter = createMysqlAdapter(creds);

        await expect(adapter.connect()).rejects.toBe(failure);
        expect(mocks.end).toHaveBeenCalledOnce();
        expect(adapter.connected).toBe(false);
    });

    it("disconnect() / end() close the pool and require reconnect", async () => {
        const adapter = createMysqlAdapter(creds);
        await adapter.connect();
        await adapter.disconnect();

        expect(mocks.end).toHaveBeenCalledOnce();
        expect(adapter.connected).toBe(false);
        await expect(adapter.query("SELECT 1")).rejects.toThrowError(/not connected/);

        await adapter.connect();
        await adapter.end();
        expect(mocks.end).toHaveBeenCalledTimes(2);
        expect(adapter.connected).toBe(false);
    });

    it("disconnect() is a no-op when not connected", async () => {
        const adapter = createMysqlAdapter(creds);
        await expect(adapter.disconnect()).resolves.toBeUndefined();
        expect(mocks.end).not.toHaveBeenCalled();
    });
});

describe("createMysqlAdapterFromConfig", () => {
    it("builds an adapter from NectarineConfig.resolveCredentials()", () => {
        const config = loadNectarineConfig(mysqlFixtureConfig, {
            env: {
                MS_USER: "bw",
                MS_PASS: "secret",
                MS_HOST: "localhost",
                MS_PORT: "3306",
                MS_DB: "blackwater",
            },
            loadResources: false,
        });

        const adapter = createMysqlAdapterFromConfig(config);
        expect(adapter).toBeInstanceOf(MysqlSql);
        expect(config.getVendor()).toBe("mysql");
        expect(config.resolveCredentials()).toEqual(creds);
    });

    it("builds from a postgres-default config when vendor is mysql", () => {
        const config = loadNectarineConfig(fixtureConfig, {
            env: {
                MS_USER: "bw",
                MS_PASS: "secret",
                MS_HOST: "localhost",
                MS_PORT: "3306",
                MS_DB: "blackwater",
            },
            loadResources: false,
        });

        expect(createMysqlAdapterFromConfig(config)).toBeNull();
        expect(createMysqlAdapterFromConfig(config, "mysql")).toBeInstanceOf(MysqlSql);
    });

    it("returns null when credentials are incomplete", () => {
        const config = loadNectarineConfig(mysqlFixtureConfig, {
            env: { MS_USER: "bw" },
            loadResources: false,
        });

        expect(createMysqlAdapterFromConfig(config)).toBeNull();
    });

    it("returns null when the active vendor is not mysql", () => {
        const config = {
            getVendor: () => "postgres" as const,
            resolveCredentials: () => creds,
        };

        expect(createMysqlAdapterFromConfig(config as unknown as NectarineConfig)).toBeNull();
    });
});
