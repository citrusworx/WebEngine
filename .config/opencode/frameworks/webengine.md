# WebEngine — Orchestration Layer

WebEngine is intended to coordinate building, securing, deploying, monitoring, scaling, and cleaning up application lifecycles. The user's source survey describes independent libraries rather than a single monolith.

## Verify before coding

- Inspect `docs/webengine/README.md`, `make-a-web-app.md`, `library-release-gates.md`, `v1-progress.md`, and current engine code.
- The supplied survey reported that docs describe the kernel as **not yet a working kernel/CLI**. Confirm current status; do not assume it is operational.
- Locate actual engine entrypoints and contracts before assigning responsibilities.

## Preferred approach

- Compose libraries using explicit, testable contracts.
- Avoid placing cloud-provider logic into UI, or WordPress content parsing into provisioning.
- Design operations for idempotency, observability, cancellation, failure recovery, and cleanup where applicable.
- Keep speculative roadmap features separate from implemented runtime APIs.
