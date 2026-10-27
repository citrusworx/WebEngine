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

    const install = (name: string, value: unknown) => {
        if (value != null) (globalThis as Record<string, unknown>)[name] = value;
    };

    install("Document", dom.window.Document);
    install("Element", dom.window.Element);
    install("HTMLAnchorElement", dom.window.HTMLAnchorElement);
    install("HTMLButtonElement", dom.window.HTMLButtonElement);
    install("HTMLImageElement", dom.window.HTMLImageElement);
    install("HTMLInputElement", dom.window.HTMLInputElement);
    install("HTMLTextAreaElement", dom.window.HTMLTextAreaElement);
    install("HTMLSelectElement", dom.window.HTMLSelectElement);
    install("HTMLTableElement", dom.window.HTMLTableElement);
    install("HTMLTableCellElement", dom.window.HTMLTableCellElement);
    install("HTMLTableRowElement", dom.window.HTMLTableRowElement);
    install("HTMLTableSectionElement", dom.window.HTMLTableSectionElement);
    install("SVGElement", dom.window.SVGElement);
    install("Event", dom.window.Event);
    install("CustomEvent", dom.window.CustomEvent);
    install("MouseEvent", dom.window.MouseEvent);
    install("KeyboardEvent", dom.window.KeyboardEvent);
    install("DocumentFragment", dom.window.DocumentFragment);

    const frame = (callback: FrameRequestCallback) =>
        setTimeout(() => callback(Date.now()), 0) as unknown as number;
    const cancel = (id: number) => clearTimeout(id);
    if (typeof dom.window.requestAnimationFrame !== "function") {
        dom.window.requestAnimationFrame = frame;
        dom.window.cancelAnimationFrame = cancel;
    }
    if (typeof global.requestAnimationFrame !== "function") {
        global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
        global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
    }
}
