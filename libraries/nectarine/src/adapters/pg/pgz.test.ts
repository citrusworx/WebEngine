import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadNectarineConfig } from "../../config/loadConfig.js";
import type { DatabaseCredentials } from "../../config/types.js";
import type { NectarineConfig } from "../../config/NectarineConfig.js";

const mocks = vi.hoisted(() => ({
    poolConnect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
    release: vi.fn(),
}));

vi.mock("pg", () => ({
    Pool: vi.fn(function MockPool() {
        return {
            connect: mocks.poolConnect,
            query: mocks.query,
            end: mocks.end,
            on: mocks.on,
        };
    }),
}));

import { Pool } from "pg";
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

function mockPool() {
    return vi.mocked(Pool).mock.results.at(-1)?.value as {
        connect: typeof mocks.poolConnect;
        query: typeof mocks.query;
        end: typeof mocks.end;
        on: typeof mocks.on;
    };
}

describe("PgSql", () => {
    beforeEach(() => {
        vi.mocked(Pool).mockClear();
        mocks.poolConnect.mockReset();
        mocks.query.mockReset();
        mocks.end.mockReset();
        mocks.on.mockReset();
        mocks.release.mockReset();
        mocks.poolConnect.mockResolvedValue({ release: mocks.release });
        mocks.query.mockResolvedValue({ rows: [] });
        mocks.end.mockResolvedValue(undefined);
        mocks.on.mockReturnValue(undefined);
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

            expect(Pool).toHaveBeenCalledWith({
                user: "bw",
                password: "secret",
                host: "localhost",
                port: 5432,
                database: "blackwater",
                max: 10,
                idleTimeoutMillis: 30_000,
                connectionTimeoutMillis: 5_000,
            });
            expect(mocks.poolConnect).toHaveBeenCalledOnce();
            expect(mocks.release).toHaveBeenCalledOnce();
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
        expect(() => createPgAdapter({ ...creds, password: "" })).toThrowError(
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

    it("preserves leading and trailing password whitespace", async () => {
        const adapter = createPgAdapter({ ...creds, password: "  secret  " });
        await adapter.connect();
        expect(Pool).toHaveBeenCalledWith(
            expect.objectContaining({ password: "  secret  " }),
        );
    });

    it("query() runs parameterized SQL on the connected pool", async () => {
        mocks.query.mockResolvedValue({ rows: [{ id: 1 }] });
        const adapter = createPgAdapter(creds);
        await adapter.connect();

        const result = await adapter.query("SELECT id FROM users WHERE id = $1", [1]);

        expect(mockPool().query).toHaveBeenCalledWith(
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
        expect(Pool).toHaveBeenCalledOnce();
        expect(mocks.poolConnect).toHaveBeenCalledOnce();
    });

    it("connect() serializes overlapping callers onto one pool", async () => {
        let releaseHold: ((connection: { release: typeof mocks.release }) => void) | undefined;
        mocks.poolConnect.mockImplementation(
            () =>
                new Promise((resolve) => {
                    releaseHold = resolve;
                }),
        );

        const adapter = createPgAdapter(creds);
        const first = adapter.connect();
        const second = adapter.connect();

        expect(Pool).toHaveBeenCalledOnce();
        expect(releaseHold).toBeTypeOf("function");
        releaseHold!({ release: mocks.release });

        const [a, b] = await Promise.all([first, second]);
        expect(a).toBe(b);
        expect(mocks.poolConnect).toHaveBeenCalledOnce();
        expect(adapter.connected).toBe(true);
    });

    it("connect() ends the pool when checkout fails", async () => {
        const failure = new Error("ECONNREFUSED");
        mocks.poolConnect.mockRejectedValue(failure);
        const adapter = createPgAdapter(creds);

        await expect(adapter.connect()).rejects.toBe(failure);
        expect(mocks.end).toHaveBeenCalledOnce();
        expect(adapter.connected).toBe(false);
    });

    it("registers an idle-client error handler so pool errors are not unhandled", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const adapter = createPgAdapter(creds);
        await adapter.connect();

        expect(mocks.on).toHaveBeenCalledWith("error", expect.any(Function));
        const handler = mocks.on.mock.calls.find((call) => call[0] === "error")?.[1] as (
            error: Error,
        ) => void;
        const idleError = new Error("idle client boom");
        handler(idleError);

        expect(spy).toHaveBeenCalledWith(
            "Nectarine Postgres pool idle client error:",
            idleError,
        );
        spy.mockRestore();
    });

    it("disconnect() / end() close the pool and require reconnect", async () => {
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
