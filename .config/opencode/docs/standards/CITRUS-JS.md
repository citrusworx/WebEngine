# CitrusWorx JavaScript & TypeScript Standard

**CW-JS / Syntax & Conventions**  
**Status:** Draft 0.1 — proposed, not yet enforced  
**Date:** 2026-11-16  
**Applies to:** CitrusWorx JavaScript, TypeScript, TSX, build scripts, and published packages

> Explicit by design. Composable by nature. Predictable in execution.

This document defines the source-code conventions for CitrusWorx. It is paired with [CITRUS-ARCHITECTURE.md](CITRUS-ARCHITECTURE.md) and [CITRUS-QUALITY.md](CITRUS-QUALITY.md). The standard is TypeScript-first and JavaScript-compatible; it does not require every project to use Sig.js, Juice, or WebEngine.

## 1. Normative language and adoption

- **MUST** is mandatory for new or substantially changed code once this standard is adopted.
- **SHOULD** is the default; exceptions require a clear reason.
- **MAY** is optional.
- A documented package-specific override wins when platform or tooling requirements genuinely differ.
- Existing code is not automatically noncompliant: format and migrate it in bounded, reviewable changes.

This is a **proposal extracted from patterns** in WebEngine; it is **not a claim** that all packages currently comply. The repository's existing `.editorconfig` specifies two spaces for JS/JSON/YAML, whereas sampled TS sources use four. That discrepancy must be settled before enabling repository-wide formatting.

## 2. Formatting

| Concern | Proposed rule |
|---|---|
| Indentation | Four spaces; no tabs |
| Strings | Double quotes; template literals for interpolation |
| Semicolons | Required |
| Line endings / encoding | LF / UTF-8; final newline |
| Line length | 100 columns preferred, with pragmatic exceptions for URLs and generated code |
| Trailing commas | Required for multiline constructs where language syntax permits |
| Braces | Required for `if`, `else`, loops, and other control-flow bodies |
| Object / array formatting | One item per line when multiline; trailing comma |
| Whitespace | Spaces around operators, after commas, and within object destructuring braces |
| Formatter | One shared formatter configuration; do not hand-maintain formatting debates |

Do not reformat vendor code, compiled output, or generated artifacts by hand. Keep formatting changes separate from semantic changes when possible.

```typescript
export function formatTrack(
    title: string,
    duration: number,
): string {
    if (duration < 0) {
        throw new RangeError("Track duration cannot be negative.");
    }

    return `${title} (${duration}s)`;
}
```

## 3. Naming

| Item | Convention | Example |
|---|---|---|
| Source filenames | `kebab-case` | `load-kiwi-config.ts` |
| Functions / methods / variables | `camelCase` | `loadKiwiConfig()` |
| Classes / interfaces / type aliases / enums | `PascalCase` | `KernelModule`, `AudioTrack` |
| True compile-time constants | `UPPER_SNAKE_CASE` | `DEFAULT_TIMEOUT_MS` |
| Boolean names | Predicate-style when useful | `isReady`, `hasTracks` |
| Async names | Describe the action, not implementation detail | `loadConfig()` |
| Tests | Adjacent `*.test.ts` or `*.spec.ts` | `orchestrator.test.ts` |

Use domain-specific names. Avoid unexplained abbreviations and generic names such as `data`, `thing`, or `manager` when a more precise term exists. Single-letter variables are acceptable in conventional, tight local scopes.

## 4. Variables and control flow

- MUST use `const` unless a binding needs reassignment; use `let` then.
- MUST NOT use `var` in authored application or library code.
- MUST prefer `===` and `!==`; `value == null` is allowed only as a documented deliberate null-and-undefined check.
- SHOULD use early returns for invalid states and avoid deeply nested control flow.
- MUST make asynchronous operations observable: `await`, return, explicitly supervise, or consciously detach with an explanatory reason.
- SHOULD avoid mutation of arguments and shared global state; mutation of owned state is allowed when the API contract says so.
- MUST avoid silent catch blocks except when intentionally preserving an original error or implementing documented fallback behavior.

## 5. Modules and imports

- MUST use ESM for new published libraries unless a consumer compatibility requirement justifies another output.
- SHOULD expose deliberate named exports; default exports MAY be used when a platform convention requires them.
- MUST distinguish public entrypoints from internal files using package `exports`.
- MUST use `import type` / `export type` for type-only dependencies where appropriate.
- MUST use explicit `.js` relative import specifiers in TypeScript compiled under NodeNext ESM, as demonstrated by WebEngine's packages. Other bundler-specific projects may use their supported resolver contract.
- SHOULD group imports: platform/built-ins, external packages, workspace packages, relative modules, and type-only imports, with stable ordering enforced by tooling if adopted.
- MUST NOT introduce circular runtime dependencies without a documented architectural exception.

```typescript
import { readFile } from "node:fs/promises";
import type { KernelModule } from "./kernel/types.js";

export async function loadText(path: string): Promise<string> {
    return readFile(path, "utf8");
}
```

## 6. TypeScript contracts

- MUST compile authored TypeScript using `strict: true`.
- MUST explicitly type exported function returns and public methods; internal inference is welcome.
- MUST prefer `unknown` to `any` at untrusted boundaries. Any unavoidable `any` MUST have a narrowly scoped justification.
- MUST validate untrusted JSON, configuration, network responses, environment inputs, and user input at runtime; static types alone are not validation.
- SHOULD use discriminated unions to represent mutually exclusive states.
- SHOULD use `readonly` for bindings and object properties not intended to change.
- MUST avoid unjustified non-null assertions (`!`) and broad type assertions (`as SomeType`).
- SHOULD prefer interfaces for extensible object contracts and type aliases for unions, intersections, and mapped types; neither is universally mandatory.
- MUST produce declaration files for TypeScript-authored public packages.
- SHOULD enable additional correctness checks (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) after measuring migration impact.

```typescript
export type LoadResult =
    | { ok: true; value: string }
    | { ok: false; reason: "missing" | "invalid" };

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
```

## 7. Public API documentation

Public APIs MUST explain non-obvious parameters, returns, errors, mutation, ownership, and cleanup requirements. Use TSDoc-compatible JSDoc. Avoid comments that only restate syntax; comments SHOULD explain intent, invariants, limitations, or why a decision was made.

```typescript
/**
 * Keeps tracks matching the predicate in the active playlist.
 *
 * Mutates the active playlist. Does nothing when no playlist exists.
 *
 * @param predicate - Determines which tracks remain.
 * @returns Number of removed tracks.
 */
export function filterTracks(
    tracks: AudioTrack[],
    predicate: (track: AudioTrack) => boolean,
): number {
    const previousLength = tracks.length;
    const kept = tracks.filter(predicate);
    tracks.splice(0, tracks.length, ...kept);
    return previousLength - tracks.length;
}
```

The above example requires `AudioTrack` to be imported or declared by its consumer; it illustrates the documentation and mutation contract, not a standalone runnable file.

## 8. Errors

- MUST treat caught values as `unknown` until narrowed.
- SHOULD use domain-specific error classes for exceptional failures and stable machine-readable codes for public or cross-process errors.
- SHOULD use `null`, `undefined`, or a tagged result for expected absence or recoverable outcomes; document the choice.
- MUST preserve original error causes when wrapping where supported (`ErrorOptions.cause`).
- MUST NOT log secrets, credentials, tokens, or personal data in diagnostic errors.

## 9. Framework extensions

This core standard is framework-neutral. Sig.js/JSX, Juice UI integration, Node services, and build tooling MAY define addenda for lifecycle, effects, attributes, and platform-specific rules. Addenda MUST NOT silently change public package contracts.

## 10. Evidence and implementation status

Patterns consulted in the WebEngine repository:

- [Root `.editorconfig`](https://github.com/citrusworx/WebEngine/blob/master/.editorconfig) — line endings and current JS/JSON/YAML indentation.
- [Base TypeScript configuration](https://github.com/citrusworx/WebEngine/blob/master/tsconfig.base.json) — `strict`, ESM/NodeNext, declaration emit, ES2022 target.
- [Kernel orchestrator](https://github.com/citrusworx/WebEngine/blob/master/engines/webengine/src/kernel/orchestrator.ts) — style, return types, imports.
- [GrapeVine CLI errors](https://github.com/citrusworx/WebEngine/blob/master/libraries/grapevine/src/cli/errors.ts) — `unknown` error handling and specialized error classes.

**Adoption work remaining:** agree on formatting, add a shared formatter and lint setup, measure violations, migrate packages progressively, then turn on CI enforcement. No repository changes are implied by publishing this draft.
