import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { DigitalOceanError, authHeaders, doRequest, getDoToken, wrapDoError } from "./client.js";

vi.mock("axios", () => {
    const request = vi.fn();
    const isAxiosError = (error: unknown) => Boolean(error && typeof error === "object" && "isAxiosError" in error);
    return {
        default: {
            request,
            isAxiosError
        },
        isAxiosError
    };
});

const mockedAxios = vi.mocked(axios);

describe("DigitalOcean client", () => {
    const previous = process.env.DO_TOKEN;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DO_TOKEN = "fake-token";
    });

    afterEach(() => {
        if (previous === undefined) {
            delete process.env.DO_TOKEN;
        } else {
            process.env.DO_TOKEN = previous;
        }
    });

    it("reads DO_TOKEN for Bearer auth", () => {
        expect(getDoToken()).toBe("fake-token");
        expect(authHeaders()).toMatchObject({
            Authorization: "Bearer fake-token",
            "Content-Type": "application/json"
        });
    });

    it("throws when DO_TOKEN is missing", () => {
        delete process.env.DO_TOKEN;
        expect(() => getDoToken()).toThrow(/DO_TOKEN is not set/);
    });

    it("sends requests against the v2 base URL", async () => {
        mockedAxios.request.mockResolvedValue({ data: { ok: true } });

        const data = await doRequest<{ ok: boolean }>({ method: "GET", url: "/droplets" });

        expect(data).toEqual({ ok: true });
        expect(mockedAxios.request).toHaveBeenCalledWith(
            expect.objectContaining({
                baseURL: "https://api.digitalocean.com/v2",
                method: "GET",
                url: "/droplets",
                headers: expect.objectContaining({
                    Authorization: "Bearer fake-token"
                })
            })
        );
    });

    it("wraps DigitalOcean API errors", () => {
        const error = {
            isAxiosError: true,
            message: "Request failed",
            response: {
                status: 401,
                data: { id: "unauthorized", message: "Unable to authenticate", request_id: "req-1" }
            }
        };

        const wrapped = wrapDoError(error);
        expect(wrapped).toBeInstanceOf(DigitalOceanError);
        expect(wrapped.message).toBe("Unable to authenticate");
        expect(wrapped.status).toBe(401);
        expect(wrapped.id).toBe("unauthorized");
    });
});
