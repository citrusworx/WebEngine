# Sig.js Anti-Patterns

## Purpose

This document collects the most common ways to fight Sig.js instead of working with it.

These are useful because most “it didn’t update” and “I got `[object HTMLDivElement]`” failures come from a few repeated mistakes — usually React, Vue, or VDOM habits brought into a static-first DOM runtime.

## 1. Treating Sig.js like React

Bad:

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    document.title = String(count);
  }, [count]);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

Why it is bad:

- `useState` / `useEffect` are not in `@citrusworx/sigjs`
- `{count}` would be a static snapshot even if `count` were a signal
- there is no dependency array and no re-render

Better:

```tsx
function Counter() {
  const count = Signal(0);
  return (
    <button type="button" onClick={() => count.set(count.get() + 1)}>
      {() => String(count.get())}
    </button>
  );
}
```

Component functions are factories. They run once per mount. Reactivity is `get()` inside an effect or function child, not a second render.

## 2. Reading a signal once at create time

Bad:

```tsx
const count = Signal(0);
<p>Count: {count.get()}</p>
```

Why it is bad:

- `get()` outside an effect does not subscribe
- the child is a static string from the first call

Better:

```tsx
<p>Count: {() => String(count.get())}</p>
```

Same bug with attributes: `disabled={busy.get()}` is the first boolean, forever.

## 3. Expecting reactive attributes

Bad:

```tsx
<div className={() => (on.get() ? "on" : "off")} />
<input value={() => name.get()} />
<button disabled={() => !ready.get()} />
<section padding={() => space.get()} />
```

Why it is bad:

- only `ref` and `on*` treat functions specially
- every other function prop is assigned as a value
- `className` becomes a function object; Juice never sees a live `padding`

Better:

```tsx
const el = <div className="off" /> as HTMLDivElement;
effect(() => {
  el.className = on.get() ? "on" : "off";
});
```

## 4. Returning elements from a function child

Bad:

```tsx
{() => (open.get() ? <Panel /> : null)}
{() => items.get().map((item) => <li>{item}</li>)}
```

Why it is bad:

- function children become `textNode.textContent = String(child())`
- you get `"[object HTMLDivElement]"`, `"null"`, or a joined list of object strings

Better — hide existing structure:

```tsx
const panel = <div>…</div> as HTMLElement;
effect(() => {
  panel.hidden = !open.get();
});
```

Better — rewrite membership:

```tsx
effect(() => {
  list.replaceChildren(
    ...items.get().map((item) => <li>{item}</li>),
  );
});
```

## 5. Virtual-DOM assumptions

Bad:

```tsx
effect(() => {
  root.replaceChildren(<App model={model.get()} />);
});
```

Why it is bad:

- every write destroys and recreates the tree
- inputs lose focus
- effects inside `App` dispose and re-run from scratch
- you have reimplemented the framework Sig.js exists to avoid

Better: keep `App` mounted. Subscribe at the leaves (one label, one list, one panel).

Rebuilding a **small** region with `replaceChildren` (a tab body, a queue) is the intended list/conditional pattern. Rebuilding `#root` on every keystroke is not.

## 6. `new Signal(0)`

Bad:

```ts
const count = new Signal(0);
```

Why it is bad:

- `Signal` is a factory. It is not a class.
- `new` is not how the function is written or tested.

Better:

```ts
const count = Signal(0);
```

## 7. Mutating arrays and objects in place

Bad:

```ts
items.get().push(next);
job.get().title = "Hold";
```

Why it is bad:

- `set` is what notifies
- in-place mutation leaves subscribers asleep

Better:

```ts
items.set([...items.get(), next]);
job.set({ ...job.get(), title: "Hold" });
```

## 8. Nesting `batch`

Bad:

```ts
batch(() => {
  a.set(1);
  batch(() => {
    b.set(2);
  });
  c.set(3);
});
```

Why it is bad:

- `isBatching` is a boolean
- the inner `batch` flushes the queue and turns batching off
- `c.set(3)` notifies immediately; `a` may already have flushed

Better: one `batch` around all related writes.

## 9. Starting resources outside the view function

Bad:

```tsx
const ticks = Signal(0);
setInterval(() => ticks.set(ticks.get() + 1), 1000);

function About() {
  return <p>{() => String(ticks.get())}</p>;
}

router.set({ about: <About /> });
```

Why it is bad:

- the interval is not an effect, so it has no cleanup
- `<About />` is a prebuilt node; first `disposeTree` kills whatever effects *did* exist and they will not return
- leaving the route does not stop the timer

Better:

```tsx
function About() {
  const ticks = Signal(0);
  effect(() => {
    const id = window.setInterval(() => ticks.set(ticks.get() + 1), 1000);
    return () => window.clearInterval(id);
  });
  return <p>{() => String(ticks.get())}</p>;
}

router.set({ about: About });
```

## 10. Syncing two signals that should have been a memo

Bad:

```ts
const name = Signal("");
const greeting = Signal("operator");

effect(() => {
  greeting.set(name.get().trim() || "operator");
});
```

Why it is bad:

- two sources of truth
- extra notify
- easy to set `greeting` from a third place and drift

Better:

```ts
const greeting = memo(() => name.get().trim() || "operator");
```

## 11. Putting layout in an effect

Bad:

```ts
effect(() => {
  density.get();
  el.style.display = "flex";
  el.style.gap = "2rem";
});
```

Why it is bad:

- Juice already expresses `stack` / `row` / `gap`
- resize and density become JS layout instead of markup

Better: static Juice attributes. If product state must change a Juice attribute, `setAttribute` from the effect — do not rebuild flexbox in JS.

```ts
effect(() => {
  el.setAttribute("gap", density.get() === "tight" ? "0.5rem" : "2rem");
});
```

## 12. Conditional `get()` and a “dead” effect

Bad (if you expected `detail` to always retrigger):

```ts
effect(() => {
  if (open.get()) {
    panel.textContent = detail.get();
  }
});
```

Why it is surprising:

- dependencies are rebuilt every run
- when `open` is false, `detail` is not a subscriber
- changing `detail` does nothing until `open` becomes true again

This is valid tracking — not a bug — but it is a frequent source of “my effect never re-runs.” Read every signal you care about unconditionally, or split effects.

## 13. Two routers, or `navigate` with the wrong string

Bad:

```ts
const router = new SigRouter("#root");
router.set({ about: About });
router.start();
router.navigate("about"); // looks up "about", not "/about"
```

Why it is bad:

- `navigate` does not normalize
- `has` and `set` do
- the call no-ops; no 404 view is rendered

Better: `router.navigate("/about")` or `router.navigate(router.get("about")!)`.

Creating a `SigRouter` inside a component that you somehow run more than once (you should not) will double-intercept clicks. Construct one at the app edge.

## 14. Inventing APIs the package does not export

These are not Sig.js:

- `useSignal`, `createSignal`, `observable`
- keyed `<For>`, `<Show>`, `<Switch>`
- reactive `style={{}}` objects as live bindings
- `peek`, `untrack` (there is no peek; read outside an effect instead)
- `/user/:id` route params
- SSR / `hydrate`
- Juice `<Button>` as a Sig import

If you need the behavior, write it with `Signal`, `effect`, and the DOM, or wait until it lands. See [Status](./sig-status.md).

## Summary

The most common Sig.js failures come from:

- React / VDOM habits
- reading signals once at create time
- function children used as element factories
- reactive attributes that are not implemented
- in-place mutation
- resources that outlive the view
- nested `batch`
- exact-path router mismatches

Most of the time, the fix is to simplify: static markup, a signal, and one small write. Trust the split. Juice already owns structure. Sig.js only needs to move the values.
