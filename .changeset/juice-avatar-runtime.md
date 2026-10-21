---
"@citrusworx/juiceui": minor
---

Add a DOM-first avatar runtime that auto-enhances `[avatar]` (`createAvatar` / `initAvatar` / `startAvatarRuntime` / `stopAvatarRuntime`). A child image that errors, is empty, or is already broken sets `[fallback]` and is hidden so initials show. A successful load clears that fallback. Accessible names are left untouched.
