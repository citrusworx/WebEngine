---
"@citrusworx/juiceui": patch
---

Raise author `font=`, `fontColor=`, `fontWeight=`, and `lineHeight=` above theme semantic defaults on headings and paragraphs. Core now emits `[theme] [attr]` companions (same pattern as `surfaceTone`) so themed `h1`–`h6` / `p` honor local overrides, while omitted attrs still use the theme pair.
