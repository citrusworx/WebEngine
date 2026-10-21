---
"@citrusworx/kiwipress": patch
---

`kiwi.bridge.verifyCredentials()` reads public plugin health before the application-password check, so a deactivated KiwiPress Bridge reports `plugin_missing` instead of accepting credentials for a site that does not have the plugin.
