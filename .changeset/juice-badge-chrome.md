---
"@citrusworx/juiceui": minor
---

Add badge chrome roles (`--juice-badge-bg`, `--juice-badge-ink`, `--juice-badge-border`, plus padding, radius, font size, and gap). Defaults mix inherited body ink, so shipped themes do not need per-theme binds. `[badge]` keeps that ink and `line-height: 1` over theme copy rules. A `[cta]` companion keeps the badge fill with the ink. Link and button badges use the 2px `currentColor` focus outline.
