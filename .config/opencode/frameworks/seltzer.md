# Seltzer — HTTP Runtime

Package: `@citrusworx/seltzer` (survey reported 0.11.0).

Seltzer is a focused Node HTTP runtime with object routes, `ResponseData` handlers, and named request pipelines.

- Inspect actual exports, `core/`, `pipeline/`, `generate/`, and `docs/seltzer/` before coding.
- Respect request/response contracts and pipeline stage ordering.
- Treat request input as untrusted; handle failures and response completion consistently.
- Avoid assuming Express/Fastify APIs or middleware semantics.
- Write behavior-driven route/pipeline tests, including error and malformed-request cases.
