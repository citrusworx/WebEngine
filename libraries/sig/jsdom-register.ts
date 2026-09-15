import { JSDOM } from "jsdom";

const global = globalThis as typeof globalThis & {
    window: Window & typeof globalThis;
    document: Document;
    Node: typeof Node;
    HTMLElement: typeof HTMLElement;
    PopStateEvent: typeof PopStateEvent;
};

if (typeof global.document === "undefined") {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
        url: "http://localhost/",
    });

    global.window = dom.window as unknown as Window & typeof globalThis;
    global.document = dom.window.document;
    global.Node = dom.window.Node;
    global.HTMLElement = dom.window.HTMLElement;
    global.PopStateEvent = dom.window.PopStateEvent;
}
