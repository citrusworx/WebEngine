# GrapeVine — Infrastructure Provisioning

Package: `@citrusworx/grapevine` (survey reported 0.4.0).

GrapeVine provides DigitalOcean-oriented infrastructure planning and deployment, with blueprints and provider subresources.

- Read `docs/grapevine/` plus actual provider implementations and blueprints.
- Keep provider-specific operations behind explicit provider interfaces.
- Favor idempotent planning, apply behavior, clear diffs, retries, observability, and cleanup.
- Keep credentials out of logs and examples; never expose secrets.
- Do not run live provisioning, deletion, or paid resource changes without explicit user permission.
- Distinguish modeled resources from implemented provider actions; validate API fields against source/current provider docs.
