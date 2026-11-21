# Nectarine — Query Compilation and Database Adapters

Package: `@citrusworx/nectarine` (survey reported 0.6.0; hostable alpha).

Nectarine compiles YAML-driven query definitions and uses database adapters (survey identified PostgreSQL, MySQL, MongoDB).

- Read `docs/nectarine/` API, query DSL, schema, security, status, and database-course examples before changing behavior.
- Keep query compilation separate from adapter execution and migrations.
- Never interpolate user data into SQL; respect the project's no-hardcoded-SQL conventions and parameterization rules.
- Do not assume unsupported compiler features. Survey flagged missing LIMIT, joins, GROUP BY; verify current state.
- Test compilation, validation, generated parameters, adapter-specific behavior, and safe failure modes.
- Treat schema/data migrations as potentially destructive; seek authorization before live operations.
