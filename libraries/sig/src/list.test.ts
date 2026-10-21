import "../jsdom-register.js";
import { test, expect } from "@playwright/test";
import { jsx, mount, disposeTree } from "./jsx-runtime.js";
import { Signal, effect, batch, memo } from "./signal.js";
import { bindList } from "./list.js";

type Row = { id: string; text: string };

function row(id: string, text = id): Row {
    return { id, text };
}

function listOf(items: Row[]) {
    const source = Signal(items);
    const parent = document.createElement("ul");
    return { source, parent };
}

test("array source adds, removes, and reorders without recreating kept nodes", () => {
    const a = row("a", "A");
    const b = row("b", "B");
    const c = row("c", "C");
    const { source, parent } = listOf([a, b]);
    const renders: string[] = [];

    bindList(parent, source, (item) => item.id, (item) => {
        renders.push(item.get().id);
        const li = document.createElement("li");
        li.dataset.id = item.get().id;
        effect(() => {
            li.textContent = item.get().text;
        });
        return li;
    });

    const first = parent.children[0];
    const second = parent.children[1];
    expect(parent.textContent).toBe("AB");
    expect(renders).toEqual(["a", "b"]);

    source.set([a, b, c]);
    const third = parent.children[2];
    expect(parent.children[0]).toBe(first);
    expect(parent.children[1]).toBe(second);
    expect(third.textContent).toBe("C");
    expect(renders).toEqual(["a", "b", "c"]);

    source.set([c, a]);
    expect(parent.children[0]).toBe(third);
    expect(parent.children[1]).toBe(first);
    expect(parent.children).toHaveLength(2);
    expect(renders).toEqual(["a", "b", "c"]);

    source.set([a]);
    expect(parent.children).toHaveLength(1);
    expect(parent.children[0]).toBe(first);
    expect(renders).toEqual(["a", "b", "c"]);
});

test("a kept key updates through the row getter and keeps the same node", () => {
    const { source, parent } = listOf([row("a", "A"), row("b", "B")]);
    let renders = 0;

    bindList(parent, source, (item) => item.id, (item) => {
        renders += 1;
        item.get();
        return jsx("li", {
            children: () => item.get().text,
        });
    });

    const first = parent.children[0];
    source.set([row("a", "Updated"), row("b", "B")]);

    expect(renders).toBe(2);
    expect(parent.children[0]).toBe(first);
    expect(parent.textContent).toBe("UpdatedB");
});

test("reorder moves only the nodes that are out of position", () => {
    const a = row("a");
    const b = row("b");
    const c = row("c");
    const { source, parent } = listOf([a, b, c]);

    bindList(parent, source, (item) => item.id, (item) => {
        const li = document.createElement("li");
        li.dataset.id = item.get().id;
        return li;
    });

    const nodes = {
        a: parent.children[0],
        b: parent.children[1],
        c: parent.children[2],
    };
    const moved: Node[] = [];
    const insertBefore = parent.insertBefore.bind(parent);
    parent.insertBefore = ((node: Node, child: Node | null) => {
        moved.push(node);
        return insertBefore(node, child);
    }) as typeof parent.insertBefore;

    source.set([row("a", "A2"), b, c]);
    expect(moved).toEqual([]);
    expect(parent.children[0]).toBe(nodes.a);
    expect(parent.children[1]).toBe(nodes.b);
    expect(parent.children[2]).toBe(nodes.c);

    source.set([a, c, b]);
    expect(moved).toEqual([nodes.c]);
    expect([...parent.children]).toEqual([nodes.a, nodes.c, nodes.b]);

    moved.length = 0;
    source.set([c, a, b]);
    expect(moved).toEqual([nodes.c]);
    expect([...parent.children]).toEqual([nodes.c, nodes.a, nodes.b]);
});

test("reorder keeps focus on the moved row", () => {
    const a = row("a", "A");
    const b = row("b", "B");
    const { source, parent } = listOf([a, b]);
    document.body.replaceChildren(parent);

    bindList(parent, source, (item) => item.id, (item) => {
        const li = document.createElement("li");
        const input = document.createElement("input");
        input.value = item.get().text;
        li.append(input);
        return li;
    });

    const input = parent.querySelectorAll("input")[1] as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    source.set([b, a]);
    expect(document.activeElement).toBe(input);
    expect(parent.querySelector("input")).toBe(input);
});

test("an unchanged item reference does not re-run the row effect on reorder", () => {
    const a = row("a", "A");
    const b = row("b", "B");
    const { source, parent } = listOf([a, b]);
    const runs = new Map<string, number>();

    bindList(parent, source, (item) => item.id, (item) => {
        const li = document.createElement("li");
        effect(() => {
            const current = item.get();
            runs.set(current.id, (runs.get(current.id) ?? 0) + 1);
            li.textContent = current.text;
        });
        return li;
    });

    expect(runs.get("a")).toBe(1);
    expect(runs.get("b")).toBe(1);

    source.set([b, a]);
    expect(runs.get("a")).toBe(1);
    expect(runs.get("b")).toBe(1);
    expect(parent.textContent).toBe("BA");

    source.set([row("a", "A2"), b]);
    expect(runs.get("a")).toBe(2);
    expect(runs.get("b")).toBe(1);
    expect(parent.textContent).toBe("A2B");
});

test("Map source uses map order and the map key", () => {
    const source = Signal(new Map<string, Row>([
        ["b", row("b", "B")],
        ["a", row("a", "A")],
    ]));
    const parent = document.createElement("ul");
    let sawKey = "";

    bindList(parent, source, (item, key) => {
        sawKey = key;
        const li = document.createElement("li");
        li.dataset.id = key;
        effect(() => {
            li.textContent = item.get().text;
        });
        return li;
    });

    expect(sawKey).toBe("a");
    expect([...parent.children].map((node) => node.textContent)).toEqual(["B", "A"]);
    const first = parent.children[0];
    const second = parent.children[1];

    const next = new Map<string, Row>([
        ["a", row("a", "A2")],
        ["b", row("b", "B")],
    ]);
    source.set(next);

    expect(parent.children[0]).toBe(second);
    expect(parent.children[1]).toBe(first);
    expect(parent.textContent).toBe("A2B");
});

test("memo of Map plus order is a list source", () => {
    const todos = Signal(new Map<string, Row>([
        ["b", row("b", "B")],
        ["a", row("a", "A")],
    ]));
    const order = Signal(["a", "b"]);
    const rows = memo(() => order.get().flatMap((id) => {
        const todo = todos.get().get(id);
        return todo ? [todo] : [];
    }));
    const parent = document.createElement("ul");

    bindList(parent, rows, (todo) => todo.id, (item) => jsx("li", {
        children: () => item.get().text,
    }));

    const first = parent.children[0];
    const second = parent.children[1];
    expect(parent.textContent).toBe("AB");

    order.set(["b", "a"]);
    expect(parent.children[0]).toBe(second);
    expect(parent.children[1]).toBe(first);

    const updated = new Map(todos.get());
    updated.set("a", row("a", "A2"));
    todos.set(updated);
    expect(parent.textContent).toBe("BA2");
    expect(parent.children[1]).toBe(first);
});

test("duplicate array keys throw and a later valid list still reconciles", () => {
    const a = row("a", "A");
    const b = row("b", "B");
    const { source, parent } = listOf([a, b]);

    bindList(parent, source, (item) => item.id, (item) => {
        const li = document.createElement("li");
        effect(() => {
            li.textContent = item.get().text;
        });
        return li;
    });

    const first = parent.children[0];
    expect(() => source.set([row("a", "A"), row("a", "other")])).toThrow(/duplicate key a/);
    expect(parent.children).toHaveLength(2);
    expect(parent.children[0]).toBe(first);
    expect(parent.textContent).toBe("AB");

    source.set([row("a", "A2")]);
    expect(parent.children).toHaveLength(1);
    expect(parent.children[0]).toBe(first);
    expect(parent.textContent).toBe("A2");
});

test("duplicate keys on the first pass throw and do not subscribe", () => {
    const source = Signal([row("a"), row("a")]);
    const parent = document.createElement("ul");

    expect(() => bindList(parent, source, (item) => item.id, () => document.createElement("li"))).toThrow(/duplicate key a/);
    expect(parent.childNodes).toHaveLength(0);

    source.set([row("a", "later")]);
    expect(parent.childNodes).toHaveLength(0);
});

test("NaN keys are duplicates", () => {
    const source = Signal([{ id: Number.NaN }]);
    const parent = document.createElement("ul");

    expect(() => bindList(
        parent,
        source,
        (item) => item.id,
        () => document.createElement("li"),
    )).not.toThrow();

    expect(() => source.set([{ id: Number.NaN }, { id: Number.NaN }])).toThrow(/duplicate key NaN/);
    expect(parent.children).toHaveLength(1);
});

test("row effects dispose when the row is removed and when the list is disposed", () => {
    const tick = Signal(0);
    const a = row("a", "A");
    const b = row("b", "B");
    const { source, parent } = listOf([a, b]);
    const runs: Record<string, number> = {};
    const cleanups: Record<string, number> = {};

    function Row(props: { item: { get(): Row } }) {
        effect(() => {
            const id = props.item.get().id;
            tick.get();
            runs[id] = (runs[id] ?? 0) + 1;
            return () => {
                cleanups[id] = (cleanups[id] ?? 0) + 1;
            };
        });
        return jsx("li", { children: () => props.item.get().text });
    }

    const dispose = bindList(parent, source, (item) => item.id, (item) => {
        effect(() => {
            const id = `render:${item.get().id}`;
            tick.get();
            runs[id] = (runs[id] ?? 0) + 1;
            return () => {
                cleanups[id] = (cleanups[id] ?? 0) + 1;
            };
        });
        return jsx(Row, { item });
    });

    expect(runs).toEqual({ a: 1, b: 1, "render:a": 1, "render:b": 1 });

    source.set([a]);
    expect(cleanups.b).toBe(1);
    expect(cleanups["render:b"]).toBe(1);
    expect(runs.b).toBe(1);

    tick.set(1);
    expect(runs.a).toBe(2);
    expect(runs["render:a"]).toBe(2);
    expect(runs.b).toBe(1);
    expect(runs["render:b"]).toBe(1);

    dispose();
    expect(cleanups.a).toBe(2);
    expect(cleanups["render:a"]).toBe(2);
    expect(parent.childNodes).toHaveLength(0);

    tick.set(2);
    source.set([row("a", "again"), row("c", "C")]);
    expect(runs.a).toBe(2);
    expect(runs.c).toBeUndefined();
    expect(parent.childNodes).toHaveLength(0);

    dispose();
    expect(parent.childNodes).toHaveLength(0);
});

test("disposeTree on the parent disposes the list", () => {
    const { source, parent } = listOf([row("a", "A")]);
    let cleanups = 0;

    bindList(parent, source, (item) => item.id, (item) => {
        const li = document.createElement("li");
        effect(() => {
            li.textContent = item.get().text;
            return () => {
                cleanups += 1;
            };
        });
        return li;
    });

    expect(parent.textContent).toBe("A");
    disposeTree(parent);
    expect(parent.childNodes).toHaveLength(0);
    expect(cleanups).toBe(1);

    source.set([row("a", "B"), row("b", "C")]);
    expect(parent.childNodes).toHaveLength(0);
    expect(cleanups).toBe(1);
});

test("mount disposes a list created by a component", () => {
    const target = document.createElement("div");
    document.body.replaceChildren(target);
    const items = Signal([row("a", "A")]);
    let cleanups = 0;

    function App() {
        const ul = document.createElement("ul");
        bindList(ul, items, (item) => item.id, (item) => {
            const li = document.createElement("li");
            effect(() => {
                li.textContent = item.get().text;
                return () => {
                    cleanups += 1;
                };
            });
            return li;
        });
        return ul;
    }

    mount(jsx(App, {}), target);
    expect(target.textContent).toBe("A");

    mount(document.createElement("p"), target);
    expect(cleanups).toBe(1);
    expect(target.textContent).toBe("");

    items.set([row("a", "B"), row("b", "C")]);
    expect(cleanups).toBe(1);
    expect(target.querySelector("li")).toBeNull();
});

test("batch flushes one list reconcile", () => {
    const items = Signal([row("a", "A")]);
    let reads = 0;
    const source = {
        get() {
            reads += 1;
            return items.get();
        },
    };
    const parent = document.createElement("ul");

    bindList(parent, source, (item) => item.id, (item) => {
        const li = document.createElement("li");
        effect(() => {
            li.textContent = item.get().text;
        });
        return li;
    });

    expect(reads).toBe(1);
    batch(() => {
        items.set([row("a", "A"), row("b", "B")]);
        items.set([row("a", "A"), row("b", "B"), row("c", "C")]);
    });

    expect(reads).toBe(2);
    expect(parent.textContent).toBe("ABC");
});

test("a row render cannot subscribe the list effect", () => {
    const items = Signal([row("a", "A")]);
    let reads = 0;
    const source = {
        get() {
            reads += 1;
            return items.get();
        },
    };
    const parent = document.createElement("ul");

    bindList(parent, source, (item) => item.id, (item) => {
        item.get();
        const li = document.createElement("li");
        effect(() => {
            li.textContent = item.get().text;
        });
        return li;
    });

    items.set([row("a", "B")]);
    expect(reads).toBe(2);
    expect(parent.textContent).toBe("B");
});

test("a render throw disposes effects started for that row", () => {
    const source = Signal([row("a")]);
    const parent = document.createElement("ul");
    let cleanups = 0;

    expect(() => bindList(parent, source, (item) => item.id, () => {
        effect(() => () => {
            cleanups += 1;
        });
        throw new Error("boom");
    })).toThrow("boom");

    expect(cleanups).toBe(1);
    expect(parent.childNodes).toHaveLength(0);
    source.set([row("a", "later")]);
    expect(parent.childNodes).toHaveLength(0);
});

test("render must return a single node", () => {
    const source = Signal([row("a")]);
    const parent = document.createElement("div");

    expect(() => bindList(parent, source, (item) => item.id, () => document.createDocumentFragment())).toThrow(/single Node/);
    expect(parent.childNodes).toHaveLength(0);
});

test("the 3-argument form rejects an array and the 4-argument form rejects a Map", () => {
    const arrayParent = document.createElement("ul");
    const arraySource = Signal([row("a", "A")]);
    expect(() => bindList(
        arrayParent,
        arraySource as unknown as { get(): Map<string, Row> },
        () => document.createElement("li"),
    )).toThrow(/3-argument form expects a Map/);
    arraySource.set([row("a", "B")]);
    expect(arrayParent.childNodes).toHaveLength(0);

    const mapParent = document.createElement("ul");
    const mapSource = Signal(new Map([["a", row("a", "A")]]));
    expect(() => bindList(
        mapParent,
        mapSource as unknown as { get(): Row[] },
        (item) => item.id,
        () => document.createElement("li"),
    )).toThrow(/4-argument form expects an array/);
    expect(mapParent.childNodes).toHaveLength(0);
});

test("one parent accepts a second list only after dispose", () => {
    const { source, parent } = listOf([row("a")]);
    const dispose = bindList(parent, source, (item) => item.id, () => document.createElement("li"));
    expect(() => bindList(parent, source, (item) => item.id, () => document.createElement("li"))).toThrow(/already has a list/);

    dispose();
    const next = Signal([row("b", "B")]);
    bindList(parent, next, (item) => item.id, (item) => {
        const li = document.createElement("li");
        li.textContent = item.get().text;
        return li;
    });
    expect(parent.textContent).toBe("B");
});

test("existing children stay after the rows", () => {
    const parent = document.createElement("div");
    const keep = document.createElement("p");
    keep.textContent = "tail";
    parent.append(keep);
    const source = Signal([row("a", "A")]);

    bindList(parent, source, (item) => item.id, (item) => {
        const li = document.createElement("li");
        li.textContent = item.get().text;
        return li;
    });

    expect(parent.firstChild?.textContent).toBe("A");
    expect(parent.lastChild).toBe(keep);
});
