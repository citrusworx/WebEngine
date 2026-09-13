import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadNectarineConfig } from "../../config/loadConfig.js";
import type { DatabaseCredentials } from "../../config/types.js";
import type { NectarineConfig } from "../../config/NectarineConfig.js";

const mocks = vi.hoisted(() => ({
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
}));

vi.mock("pg", () => ({
    Client: vi.fn(function MockClient() {
        return {
            connect: mocks.connect,
            query: mocks.query,
            end: mocks.end,
        };
    }),
}));

import { Client } from "pg";
import {
    createPgAdapter,
    createPgAdapterFromConfig,
    PgSql,
    requirePgCredentials,
} from "./pgz.js";

const fixtureConfig = path.resolve(
    import.meta.dirname,
    "../../config/__fixtures__/nectarine.config.yaml",
);

const creds: DatabaseCredentials = {
    user: "bw",
    password: "secret",
    host: "localhost",
    port: 5432,
    database: "blackwater",
};

function mockClient() {
    return vi.mocked(Client).mock.results.at(-1)?.value as {
        connect: typeof mocks.connect;
        query: typeof mocks.query;
        end: typeof mocks.end;
    };
}

describe("PgSql", () => {
    beforeEach(() => {
        vi.mocked(Client).mockClear();
        mocks.connect.mockReset();
        mocks.query.mockReset();
        mocks.end.mockReset();
        mocks.connect.mockResolvedValue(undefined);
        mocks.query.mockResolvedValue({ rows: [] });
        mocks.end.mockResolvedValue(undefined);
    });

    it("constructs from DatabaseCredentials and does not read process.env", async () => {
        const previous = {
            PG_USER: process.env.PG_USER,
            PG_PASS: process.env.PG_PASS,
            PG_HOST: process.env.PG_HOST,
            PG_PORT: process.env.PG_PORT,
            PG_DB: process.env.PG_DB,
        };

        process.env.PG_USER = "env-user";
        process.env.PG_PASS = "env-pass";
        process.env.PG_HOST = "env-host";
        process.env.PG_PORT = "9999";
        process.env.PG_DB = "env-db";

        try {
            const adapter = createPgAdapter(creds);
            expect(adapter).toBeInstanceOf(PgSql);
            expect(adapter.connected).toBe(false);

            await adapter.connect();

            expect(Client).toHaveBeenCalledWith({
                user: "bw",
                password: "secret",
                host: "localhost",
                port: 5432,
                database: "blackwater",
            });
            expect(mocks.connect).toHaveBeenCalledOnce();
            expect(adapter.connected).toBe(true);
        } finally {
            process.env.PG_USER = previous.PG_USER;
            process.env.PG_PASS = previous.PG_PASS;
            process.env.PG_HOST = previous.PG_HOST;
            process.env.PG_PORT = previous.PG_PORT;
            process.env.PG_DB = previous.PG_DB;
        }
    });

    it("PgSql.fromCredentials matches createPgAdapter", () => {
        const fromFactory = createPgAdapter(creds);
        const fromStatic = PgSql.fromCredentials(creds);
        expect(fromFactory).toBeInstanceOf(PgSql);
        expect(fromStatic).toBeInstanceOf(PgSql);
    });

    it("rejects incomplete credentials", () => {
        expect(() => createPgAdapter({ ...creds, user: "" })).toThrowError(
            /complete credentials/,
        );
        expect(() => createPgAdapter({ ...creds, password: "   " })).toThrowError(
            /complete credentials/,
        );
        expect(() => createPgAdapter({ ...creds, host: "" })).toThrowError(
            /complete credentials/,
        );
        expect(() => createPgAdapter({ ...creds, database: "" })).toThrowError(
            /complete credentials/,
        );
        expect(() =>
            requirePgCredentials(null),
        ).toThrowError(/requires DatabaseCredentials/);
        expect(() => createPgAdapter({ ...creds, port: Number.NaN })).toThrowError(
            /finite number/,
        );
        expect(() =>
            requirePgCredentials({ ...creds, port: "5432" as unknown as number }),
        ).not.toThrow();
        expect(
            requirePgCredentials({ ...creds, port: "5432" as unknown as number }).port,
        ).toBe(5432);
    });

    it("query() runs parameterized SQL on the connected client", async () => {
        mocks.query.mockResolvedValue({ rows: [{ id: 1 }] });
        const adapter = createPgAdapter(creds);
        await adapter.connect();

        const result = await adapter.query("SELECT id FROM users WHERE id = $1", [1]);

        expect(mockClient().query).toHaveBeenCalledWith(
            "SELECT id FROM users WHERE id = $1",
            [1],
        );
        expect(result.rows).toEqual([{ id: 1 }]);
    });

    it("query() throws when not connected", async () => {
        const adapter = createPgAdapter(creds);
        await expect(adapter.query("SELECT 1")).rejects.toThrowError(/not connected/);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("query() throws on empty SQL", async () => {
        const adapter = createPgAdapter(creds);
        await adapter.connect();
        await expect(adapter.query("   ")).rejects.toThrowError(/SQL string/);
    });

    it("connect() is idempotent", async () => {
        const adapter = createPgAdapter(creds);
        const first = await adapter.connect();
        const second = await adapter.connect();
        expect(first).toBe(second);
        expect(Client).toHaveBeenCalledOnce();
        expect(mocks.connect).toHaveBeenCalledOnce();
    });

    it("disconnect() / end() close the client and require reconnect", async () => {
        const adapter = createPgAdapter(creds);
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
        const adapter = createPgAdapter(creds);
        await expect(adapter.disconnect()).resolves.toBeUndefined();
        expect(mocks.end).not.toHaveBeenCalled();
    });
});

describe("createPgAdapterFromConfig", () => {
    it("builds an adapter from NectarineConfig.resolveCredentials()", () => {
        const config = loadNectarineConfig(fixtureConfig, {
            env: {
                PG_USER: "bw",
                PG_PASS: "secret",
                PG_HOST: "localhost",
                PG_PORT: "5432",
                PG_DB: "blackwater",
            },
            loadResources: false,
        });

        const adapter = createPgAdapterFromConfig(config);
        expect(adapter).toBeInstanceOf(PgSql);
        expect(config.getVendor()).toBe("postgres");
        expect(config.resolveCredentials()).toEqual(creds);
    });

    it("returns null when credentials are incomplete", () => {
        const config = loadNectarineConfig(fixtureConfig, {
            env: { PG_USER: "bw" },
            loadResources: false,
        });

        expect(createPgAdapterFromConfig(config)).toBeNull();
    });

    it("returns null when the active vendor is not postgres", () => {
        const config = {
            getVendor: () => "mysql" as const,
            resolveCredentials: () => creds,
        };

        expect(createPgAdapterFromConfig(config as unknown as NectarineConfig)).toBeNull();
    });
});
