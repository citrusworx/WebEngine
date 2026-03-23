import { test, expect } from "@playwright/test";
import { SigRouter } from "./sig-router.js";

test("SigRouter registers a route", () => {
    const router = new SigRouter();
    router.set("/home", null);
    expect(router.has("/home")).toBe(true);
});

test("SigRouter registers a named route", () => {
    const router = new SigRouter();
    router.set("/about", null, "about");
    expect(router.get("about")).toBe("/about");
})