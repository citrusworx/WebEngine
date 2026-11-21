# CitrusWorx JavaScript Practices

- Use modern, standards-based JavaScript and built-in browser/Node APIs where suitable.
- Prefer clear named functions and coherent modules. Choose classes when they represent genuine stateful domain objects or established repository conventions.
- Keep side effects explicit; contain I/O at meaningful boundaries.
- Use `const` by default; reserve `let` for actual reassignment; avoid `var`.
- Validate external input and errors at boundaries. Preserve causal context when propagating errors.
- Avoid accidental global state, implicit mutation across module boundaries, and speculative dependencies.
- Match the project's actual runtime and module format. Never assume a bundler, DOM, or Node API is available without checking.
- Prefer existing code style over imposing a new formatter or architecture.
