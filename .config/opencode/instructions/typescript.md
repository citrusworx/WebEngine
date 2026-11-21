# CitrusWorx TypeScript Practices

- Use precise public types and infer local types when inference remains readable.
- Prefer `unknown` plus narrowing over `any` for untrusted values.
- Model finite states with discriminated unions where useful.
- Keep API types aligned with runtime behavior; do not paper over errors with casts or non-null assertions.
- Preserve package export boundaries; use `import type` where applicable.
- Avoid redundant generics and deep type gymnastics that obscure intent.
- Treat types, generated declarations, and entrypoint exports as part of a release contract.
- Verify JSX typing against Sig.js when working with Juice/Sig; React typings are not a default.
