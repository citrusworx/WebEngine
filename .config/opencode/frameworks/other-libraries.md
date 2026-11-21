# DNS, Stenzil, and Shared Types

## DNS (`@citrusworx/dns`)

Survey reports a multi-registrar/DNS abstraction, currently with ResellerClub-oriented code. Verify current provider support and avoid assuming OpenSRS integration merely because it is planned or preferred. Keep registry/provider quirks inside adapters; guard against destructive record or domain changes.

## Stenzil (`@citrusworx/stenzil`)

Survey describes a templating layer. Read current source and docs before claiming template syntax, escaping, compilation, or runtime support. Escape output contextually and test injection boundaries.

## Types (`@citrusworx/types`)

Survey identifies shared contracts such as `Blueprint`, `Environment`, and `DeploymentManifest`. Treat their public type shapes and import paths as versioned contracts. Avoid circular dependencies and runtime dependencies for type-only consumers.
