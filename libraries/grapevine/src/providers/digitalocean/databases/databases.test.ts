import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import {
    createDatabase,
    deleteDatabase,
    getDatabase,
    listDatabases,
    pickDatabaseConnection,
    waitForDatabase
} from "./databases.js";

vi.mock("../client.js", () => ({
    doRequest: vi.fn()
}));

const mockedRequest = vi.mocked(doRequest);

describe("digitalocean databases", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("covers managed database CRUD payloads", async () => {
        const database = {
            id: "db-1",
            name: "kiwipress-pg",
            engine: "pg",
            status: "online"
        };
        mockedRequest.mockResolvedValueOnce({ databases: [database] });
        await expect(listDatabases()).resolves.toEqual([database]);

        mockedRequest.mockResolvedValueOnce({ database });
        await expect(getDatabase("db-1")).resolves.toEqual(database);

        mockedRequest.mockResolvedValueOnce({ database });
        await createDatabase({
            name: "kiwipress-pg",
            engine: "pg",
            version: "15",
            region: "nyc1",
            size: "db-s-1vcpu-1gb",
            private_network_uuid: "vpc-1"
        });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/databases",
            data: {
                name: "kiwipress-pg",
                engine: "pg",
                version: "15",
                region: "nyc1",
                size: "db-s-1vcpu-1gb",
                num_nodes: 1,
                private_network_uuid: "vpc-1"
            }
        });

        mockedRequest.mockResolvedValueOnce(undefined);
        await deleteDatabase("db-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/databases/db-1"
        });
    });

    it("waits until status is online", async () => {
        mockedRequest
            .mockResolvedValueOnce({
                database: { id: "db-1", name: "wp", engine: "mysql", status: "creating" }
            })
            .mockResolvedValueOnce({
                database: { id: "db-1", name: "wp", engine: "mysql", status: "online" }
            });

        const sleeps: number[] = [];
        const ready = await waitForDatabase("db-1", {
            intervalMs: 5,
            sleep: async (ms) => {
                sleeps.push(ms);
            }
        });
        expect(ready.status).toBe("online");
        expect(sleeps).toEqual([5]);
    });

    it("prefers the private connection when present", () => {
        const picked = pickDatabaseConnection({
            id: "db-1",
            name: "wp",
            engine: "mysql",
            status: "online",
            connection: { host: "public.example", port: 25060 },
            private_connection: { host: "private.example", port: 25060 }
        });
        expect(picked?.host).toBe("private.example");
    });
});
