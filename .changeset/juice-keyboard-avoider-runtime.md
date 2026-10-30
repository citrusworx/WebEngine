---
"@citrusworx/juiceui": patch
---

Add the keyboard-avoider runtime (`createKeyboardAvoider` / `initKeyboardAvoider` / `startKeyboardAvoiderRuntime` / `stopKeyboardAvoiderRuntime`). It writes `--juice-keyboard-inset` on `<html>` from the visual viewport and sets `[keyboard-open]` while an editable field is covered. It does not set `navigator.virtualKeyboard.overlaysContent`.
