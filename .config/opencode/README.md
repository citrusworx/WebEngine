# OpenCode configuration pack for WebEngine

Designed for Drew's Windows OpenCode installation under `C:\Users\Stink\.config\opencode\` (the `~/.config/opencode/` notation works in OpenCode configuration).

## Install

1. Copy the pack's `AGENTS.md`, `instructions/`, `frameworks/`, `agents/`, and `commands/` into `~/.config/opencode/`. **Back up or merge an existing `AGENTS.md`**; do not blindly overwrite user customization.
2. **Do not replace your existing `opencode.json`**. Merge the `instructions` array from `opencode.instructions.example.json` into its existing object. Preserve your models, providers, MCP servers (including Blender), permissions, and plugins.
3. Start a new OpenCode session to ensure the updated global and agent instructions apply.
4. In WebEngine, you may optionally commit a small repository-root `AGENTS.md` to share release/build instructions with collaborators; this global pack remains personal.

## File loading

Global `AGENTS.md` is loaded automatically. Five general `instructions/*.md` files are loaded by the config array. Framework guides are loaded **on demand** when relevant, to avoid cluttering every session. The `agents/` and `commands/` files define opt-in specialized behaviors.

## Known source limitations

This pack is grounded in the user's OpenCode repository survey, **not** a direct source-level inspection of WebEngine. Its reported versions and component/runtime claims are leads to verify, not guaranteed truths. `docs/juice/public-contract.md` and current implementation should govern actual coding.

## Suggested commands

- `/juice Build a responsive settings panel`
- `/review` (review current changes)
- `/architecture Evaluate WebEngine's deployment lifecycle`
- `/learn-library libraries/juice`

## Updating

Refresh framework guides after significant version changes. Keep source-backed, version-specific API catalogs in the WebEngine repo (e.g. `docs/ai/juice-api-inventory.md`), not as invented persistent facts in these global guides.
