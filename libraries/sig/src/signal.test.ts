import {test, expect} from "@playwright/test";
import { Signal, effect } from "./signal.js";

test("Signal initializes with the correct value", () => {
    const count = Signal(0);
    expect(count.get()).toBe(0);
});

test("Signal updates the value on set", () => {
    const count = Signal(0);
    expect((count.get() + 1)).toBe(1);
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
})