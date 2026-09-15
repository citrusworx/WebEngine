import {test, expect} from "@playwright/test";
import { Signal, effect, batch, memo } from "./signal.js";

test("Signal initializes with the correct value", () => {
    const count = Signal(0);
    expect(count.get()).toBe(0);
});

test("Signal updates the value on set", () => {
    const count = Signal(0);
    count.set(1);
    expect(count.get()).toBe(1);
});

test("Effect runs immediately on registration", () => {
    const count = Signal(0);
    let ran = false;

    effect(() => {
        count.get();
        ran = true;
    })

    expect(ran).toBe(true);
});

test("effect re-runs when signal change", () => {
    const count = Signal(0);
    let runCount = 0;

    effect(() => {
        count.get();
        runCount++;
    });

    count.set(1);
    count.set(2);
    
    expect(runCount).toBe(3); // initial + 2 updates
});

test("effect cleanup runs before re-execution and on dispose", () => {
    const count = Signal(0);
    let cleanupCount = 0;

    const dispose = effect(() => {
        count.get();

        return () => {
            cleanupCount++;
        };
    });

    count.set(1);
    expect(cleanupCount).toBe(1);

    dispose();
    expect(cleanupCount).toBe(2);
});

test("disposed effects stop receiving signal updates", () => {
    const count = Signal(0);
    let runCount = 0;

    const dispose = effect(() => {
        count.get();
        runCount++;
    });

    dispose();
    count.set(1);

    expect(runCount).toBe(1);
});

test("batch notifies subscribers once after several sets", () => {
    const a = Signal(0);
    const b = Signal(0);
    let runCount = 0;

    effect(() => {
        a.get();
        b.get();
        runCount++;
    });

    batch(() => {
        a.set(1);
        b.set(2);
    });

    expect(runCount).toBe(2);
    expect(a.get()).toBe(1);
    expect(b.get()).toBe(2);
});

test("nested batch flushes only when the outer batch ends", () => {
    const a = Signal(0);
    const b = Signal(0);
    const c = Signal(0);
    let runCount = 0;

    effect(() => {
        a.get();
        b.get();
        c.get();
        runCount++;
    });

    batch(() => {
        a.set(1);
        expect(runCount).toBe(1);

        batch(() => {
            b.set(2);
        });

        expect(runCount).toBe(1);
        c.set(3);
        expect(runCount).toBe(1);
    });

    expect(runCount).toBe(2);
    expect(a.get()).toBe(1);
    expect(b.get()).toBe(2);
    expect(c.get()).toBe(3);
});

test("batch resets after a throw and still flushes successful sets", () => {
    const count = Signal(0);
    let runCount = 0;

    effect(() => {
        count.get();
        runCount++;
    });

    expect(() => {
        batch(() => {
            count.set(1);
            throw new Error("batch failed");
        });
    }).toThrow("batch failed");

    expect(count.get()).toBe(1);
    expect(runCount).toBe(2);

    count.set(2);
    expect(runCount).toBe(3);
    expect(count.get()).toBe(2);
});

test("nested batch still flushes after an inner throw", () => {
    const count = Signal(0);
    let runCount = 0;

    effect(() => {
        count.get();
        runCount++;
    });

    expect(() => {
        batch(() => {
            count.set(1);
            batch(() => {
                count.set(2);
                throw new Error("inner batch failed");
            });
        });
    }).toThrow("inner batch failed");

    expect(count.get()).toBe(2);
    expect(runCount).toBe(2);

    count.set(3);
    expect(runCount).toBe(3);
});

test("memo is lazy and caches until a dependency changes", () => {
    const items = Signal([1, 2, 3]);
    let computeCount = 0;
    const sum = memo(() => {
        computeCount++;
        return items.get().reduce((total, n) => total + n, 0);
    });

    expect(computeCount).toBe(0);
    expect(sum.get()).toBe(6);
    expect(computeCount).toBe(1);
    expect(sum.get()).toBe(6);
    expect(computeCount).toBe(1);

    items.set([10, 20]);
    expect(sum.get()).toBe(30);
    expect(computeCount).toBe(2);
});

test("memo notifies effects when a dependency changes", () => {
    const count = Signal(1);
    const doubled = memo(() => count.get() * 2);
    let runCount = 0;
    let seen = 0;

    effect(() => {
        seen = doubled.get() ?? 0;
        runCount++;
    });

    expect(seen).toBe(2);
    expect(runCount).toBe(1);

    count.set(4);
    expect(seen).toBe(8);
    expect(runCount).toBe(2);
});
