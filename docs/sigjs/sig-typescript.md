# TypeScript

Sig publishes `.d.ts` next to each entry. `jsxImportSource` is how JSX finds them. You do not need a root import for the `JSX` namespace.

## Compiler

Bundlers:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

`tsc` emit that you run in the browser:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "nodenext"
  }
}
```

| Setting | Why |
|---|---|
| `jsx: react-jsx` | Automatic runtime. Dev builds use `react-jsxdev`, which loads `jsxDEV` |
| `jsxImportSource` | Resolves `./jsx-runtime` and `./jsx-dev-runtime` |
| `target` ES2022 | The published build uses modern syntax. `bind` calls `structuredClone` |
| `moduleResolution: bundler` or `nodenext` | Required to resolve package `exports` |

Vite can set `esbuild.jsxImportSource` to `@citrusworx/sigjs` and skip a project-wide `tsc` JSX emit. See [Getting started](./sig-getting-started.md).

A file that never imports `@citrusworx/sigjs` still type-checks JSX. The namespace is exported from the runtime entry. Loading the package root also installs the global `JSX` namespace.

## What you can import

| Name | Kind | Notes |
|---|---|---|
| `Signal` | value | No exported `Signal<T>` type. Annotate as `ReturnType<typeof Signal<number>>` if you must name it |
| `effect`, `batch`, `memo`, `untrack` | values | `effect`'s callback alias `EffectCallback` is not exported |
| `bindList`, `ListItem` | value and type | Experimental |
| `Child` | type | On `.` and `./jsx-runtime` |
| `JSX` | namespace | On `.`, `./jsx-runtime`, and `./jsx-dev-runtime` |
| `SigRouter`, `RouteParams`, `RouteFactory`, `RouteView`, `RouteMap` | class and types | Also on `./sig-router` |
| `bind`, `JuiceBinding`, `JuiceSignal`, `JuiceRuntimeName`, `JuiceRuntimeState` | `./juice` only | Pulls in `@citrusworx/juiceui` types |

`captureCleanupScope`, `attachNodeCleanup`, and `registerCleanup` are not in `exports`. Importing `@citrusworx/sigjs/cleanup-scope` fails module resolution even though the file is inside the tarball.

## Events and elements

Host components are inferred as `JSX.Element`, which is `Node`. Cast when you need a specific element.

```tsx
const input = (
  <input
    onInput={(event) => {
      const target = event.target as HTMLInputElement;
      name.set(target.value);
    }}
  />
) as HTMLInputElement;
```

Listeners are bivariant, so `(event: InputEvent) => void` assigns. The runtime passes the browser event. `ref` is bivariant in the element argument and runs once.

`JSX.IntrinsicElements` is an open index. Juice attributes and `data-*` keys type-check. A misspelled HTML attribute also type-checks. That is the tradeoff that lets `stack` and `card` through.

## Function children and props

```tsx
<p>{() => count.get()}</p>
<button disabled={() => !ready.get()} className={() => "ready"} />
```

The getter must return `string | number | boolean | null | undefined`. Returning an element is a type error on the function-child arm and, if you force it, stringifies at runtime.

`style` accepts a string or a record. The record is in the types. The runtime does not apply it as CSS. Prefer a string.

## Router params

```ts
import type { RouteParams } from "@citrusworx/sigjs";

function User(params: RouteParams) {
  return document.createTextNode(params.id ?? "");
}
```

Param values are `string`. They are not generic over your path. A factory that ignores `params` is still `(params: RouteParams) => Node | null`.

## Juice state

```ts
import { bind, type JuiceRuntimeState } from "@citrusworx/sigjs/juice";

const notes = bind(host, "switch");
const checked: boolean = notes.state.get().checked;

type Pressed = JuiceRuntimeState["icon-button"]["pressed"];
```

Passing the runtime name selects the state type. `bind(host)` without a name is `JuiceRuntimeState[JuiceRuntimeName]`, a union of every state. Narrow it by passing the name.

`SwitchState` and the other Juice names are not re-exported from Sig. Import them from `@citrusworx/juiceui` if you want those aliases. Icon button, avatar, and table are not exported as their own aliases. Index `JuiceRuntimeState`.

`@citrusworx/sigjs/juice` does not type-check or load against Juice 0.9.1. The declared peer allows it. Use 0.9.2 or newer, and 0.9.3 or newer if you name icon button, avatar, or table. See [Runtime binding](./sig-juice-integration.md#runtime-binding).
