---
"@citrusworx/kiwipress": minor
---

Add draft preview on `kiwi.bridge`. `preview()` reads `GET /kiwipress/v1/preview` with the token header and no application password, even when credentials are configured. `createPreviewLink()` mints `POST /kiwipress/v1/preview/token`. Plugin error codes are mapped before HTTP status, so an expired token is `preview_expired` and a missing preview post is `preview_not_found`. Health `features` defaults to an empty list when a 0.1.0 site omits the field. Settings include `preview_path`.
