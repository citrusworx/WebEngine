# Testing and Verification

- Discover the repository's actual package manager, scripts, and test runners before executing commands.
- For a bug fix, first capture a failing case where practical.
- Test public behavior and important edge cases, not just implementation details.
- Include invalid input, cleanup, asynchronous races, and error paths when relevant.
- For library API changes, verify exports/types, build output, and affected consumers.
- For Juice UI, check semantic markup, keyboard access, focus, responsive states, and CSS-only versus runtime-dependent behavior.
- Run the narrowest relevant checks first, then expand as time permits.
- Never say tests passed if they were not run; report commands and limitations.
