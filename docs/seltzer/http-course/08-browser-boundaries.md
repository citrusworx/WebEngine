# 08 — A browser adds another boundary

[Previous](./07-client.md) · [Course](./README.md) · [Next](./09-generated-routes.md)

**Goal:** distinguish CORS, authentication, and authorization, then observe a real preflight. Allow 60 minutes.

## The browser is protecting the page's access

An origin consists of scheme, host, and port. A page at `http://127.0.0.1:4000` and an API at `http://127.0.0.1:3000` are different origins even though they run on one computer.

CORS lets a server tell a browser which cross-origin responses a page may access. Some requests require a preliminary OPTIONS exchange, called a preflight. CORS is not a login system or a firewall, and non-browser HTTP clients do not enforce the browser's same-origin restrictions. [Fetch standard: CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)

## Observe it rather than guessing

Run `notes-server.mjs` in Terminal A and `browser-server.mjs` in Terminal B. Open **exactly** `http://127.0.0.1:4000`, then open the browser's Network panel.

Click **Read notes**. The page makes a cross-origin GET and displays the status and body. Click **Create note**. The JSON content type causes a preflight when no usable preflight cache entry exists. Inspect the OPTIONS request and the subsequent POST.

The Notes server passes this application configuration to Seltzer:

```js
app.listen(3000, {
  cors: { origin: "http://127.0.0.1:4000" },
});
```

Its response can include `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, and `Vary: Origin`. The default allowed headers include `Content-Type`. Adding an `Authorization` header to a browser request would require an appropriate CORS headers configuration too.

Use the page's buttons rather than entering the API URL in the address bar: navigation is not the same experiment as a page reading a cross-origin response with fetch.

## Current listener behavior

In 0.8.1, CORS and OPTIONS handling happen before the pipeline. Every OPTIONS request gets 204 there, even for an unknown path and even without CORS configuration. That is not proof that the requested endpoint exists or that a requested method is supported.

For an origin that does not match the configured origin, Seltzer omits the allow-origin header. It does not reject the application request with 403. A browser may refuse access to the response; another client can still call the endpoint. Some cross-origin requests can perform their server-side effect even when the browser cannot read the result.

Omitting `cors.origin` while enabling CORS reflects an incoming origin. That is a broad policy, not an authentication check. Seltzer does not add credentialed-cookie handling automatically.

## Three distinct questions

| Mechanism | Question |
|---|---|
| CORS | May this browser page access this cross-origin response? |
| Authentication | Who is making the request? |
| Authorization | May that identity perform this operation on this note? |

Checking that an `Authorization` header exists answers neither identity nor permission. An attacker can write a header too. A real authentication stage verifies a credential and establishes a principal; a later authorization decision checks the principal's rights to the requested resource.

Seltzer's insertion points let application code implement those policies, but it does not provide a complete identity system. Our Notes example intentionally remains unauthenticated so the course can focus on transport. It must not be presented as private storage.

## Developer design exercise

Sketch a request-local principal field populated after credential verification. Do not store the current principal in shared `locals`. Put a route-aware permission check after `route` and before `handle`. Note that body parsing has already occurred, so this check does not protect against the cost of oversized incoming bodies.

For cookie-authenticated writes, separately consider cross-site request forgery. Correct CORS configuration alone is not your whole write-protection policy.

## Checkpoint

Send an OPTIONS request to an unknown API path. Explain its 204. Then explain why a successful curl call does not prove a cross-origin browser fetch can read the same response, and why a failed browser CORS check does not establish that the endpoint is secure.

[Answers](./answers.md#lesson-08)
