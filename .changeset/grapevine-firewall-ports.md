---
"@citrusworx/grapevine": patch
---

Normalize DigitalOcean firewall ports on apply (`all`/`*` → `1-65535`, comma lists → one rule each, omit icmp ports) and ship KiwiPress / example blueprints with DO-valid port values.
