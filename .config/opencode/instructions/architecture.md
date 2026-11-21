# WebEngine Architecture Rules

- Treat Juice, Sig, Seltzer, Nectarine, Grapevine, DNS, Stenzil, and shared Types as independently scoped libraries.
- Keep business orchestration in WebEngine or the appropriate application/package layer, not hidden in low-level libraries.
- Enforce dependency direction with explicit APIs and adapters.
- Put transport, persistence, infrastructure, and presentation concerns behind clear boundaries.
- Use existing abstractions and contracts before introducing new ones.
- Document breaking public API changes, migrations, and version compatibility.
- Never describe the WebEngine kernel or CLI as production-ready without checking live source and status docs.
- Separate current implementation from roadmap intent in designs and reviews.
