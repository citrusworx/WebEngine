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

test("SigRouter.navigate normalizes paths the same way as set and has", () => {
    document.body.innerHTML = '<div id="app"></div>';
    window.history.pushState({}, "", "/");

    const router = new SigRouter("#app");
    router.set({
        "/": () => {
            const el = document.createElement("div");
            el.textContent = "home";
            return el;
        },
        about: () => {
            const el = document.createElement("div");
            el.textContent = "about";
            return el;
        },
    });

    router.start();
    router.navigate("about");

    expect(window.location.pathname).toBe("/about");
    expect(document.querySelector("#app")?.textContent).toBe("about");
    router.stop();
});

test("SigRouter.navigate is a no-op for unknown paths without a fallback", () => {
    document.body.innerHTML = '<div id="app"></div>';
    window.history.pushState({}, "", "/");

    const router = new SigRouter("#app");
    router.set({
        "/": () => {
            const el = document.createElement("div");
            el.textContent = "home";
            return el;
        },
    });

    router.start();
    router.navigate("/missing");

    expect(window.location.pathname).toBe("/");
    expect(document.querySelector("#app")?.textContent).toBe("home");
    router.stop();
});

test("SigRouter renders a * fallback for unknown paths", () => {
    document.body.innerHTML = '<div id="app"></div>';
    window.history.pushState({}, "", "/");

    const router = new SigRouter("#app");
    router.set({
        "/": () => {
            const el = document.createElement("div");
            el.textContent = "home";
            return el;
        },
        "*": () => {
            const el = document.createElement("div");
            el.textContent = "not found";
            return el;
        },
    });

    router.start();
    router.navigate("/missing");

    expect(router.has("*")).toBe(true);
    expect(router.has("/missing")).toBe(false);
    expect(window.location.pathname).toBe("/missing");
    expect(document.querySelector("#app")?.textContent).toBe("not found");
    router.stop();
});

test("SigRouter popstate renders the * fallback for an unknown path", () => {
    document.body.innerHTML = '<div id="app"></div>';
    window.history.pushState({}, "", "/");

    const router = new SigRouter("#app");
    router.set({
        "/": () => {
            const el = document.createElement("div");
            el.textContent = "home";
            return el;
        },
        "*": () => {
            const el = document.createElement("div");
            el.textContent = "not found";
            return el;
        },
    });

    router.start();
    window.history.pushState({}, "", "/ghost");
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(document.querySelector("#app")?.textContent).toBe("not found");
    router.stop();
});
