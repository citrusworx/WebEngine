---
"@citrusworx/sigjs": patch
---

Correct the published-version notes. npm latest is 0.7.2 (2026-10-27). 0.7.0 was published 2026-10-21. 0.7.1 is a stale build that lacks the icon-button, avatar, and table bind. Workspace package.json stays 0.7.0. bind accepts those three runtimes. Binding one of them throws when Juice does not export its start function. Published @citrusworx/juiceui 0.9.1 and 0.9.2 do not. The peer range stays >=0.9.1 <1.
