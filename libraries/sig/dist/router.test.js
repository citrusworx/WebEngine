import { test, expect } from "@playwright/test";
import { SigRouter } from "./sig-router.js";
test("SigRouter registers a route", () => {
    const router = new SigRouter();
    router.set("/home", null);
    expect(router.has("/home")).toBe(true);
});
test("SigRouter registers routes from an object map", () => {
    const router = new SigRouter();
    router.set({
        home: null,
        dashboard: null,
        "/": null,
    });
    expect(router.has("/")).toBe(true);
    expect(router.has("/home")).toBe(true);
    expect(router.has("/dashboard")).toBe(true);
    expect(router.get("home")).toBe("/home");
});
test("SigRouter registers a named route", () => {
    const router = new SigRouter();
    router.set("/about", null, "about");
    expect(router.get("about")).toBe("/about");
});
test("SigRouter re-renders routes from factories after navigation cleanup", () => {
    document.body.innerHTML = '<div id="app"></div>';
    window.history.pushState({}, "", "/");
    const router = new SigRouter("#app");
    let homeRenders = 0;
    router.set({
        "/": () => {
            homeRenders++;
            const el = document.createElement("div");
            el.textContent = `home-${homeRenders}`;
            return el;
        },
        about: () => {
            const el = document.createElement("div");
            el.textContent = "about";
            return el;
        },
    });
    router.start();
    router.navigate("/about");
    router.navigate("/");
    expect(homeRenders).toBe(2);
    expect(document.querySelector("#app")?.textContent).toBe("home-2");
    router.stop();
});
//# sourceMappingURL=router.test.js.map