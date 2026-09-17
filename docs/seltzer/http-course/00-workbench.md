# 00 — Set up your workbench

[Course](./README.md) · [Next](./01-http-messages.md)

**Goal:** run JavaScript outside the browser and distinguish the server process from the client process. Allow 30–45 minutes.

## A server stays available

A script often calculates something and exits. A server starts, waits for messages, answers them, and keeps waiting. A terminal occupied by a running server is not stuck.

Use two terminals. Terminal A runs the server. Terminal B sends requests. Stop the server with Ctrl+C. Closing a browser tab does not stop the server process.

## Choose one setup

Inside this repository, use its installed workspace dependencies. From the root:

```sh
node --version
node docs/seltzer/http-course/examples/hello.mjs
```

The verification environment uses Node **24.11.1**. Seltzer declares Node `>=18`; that is a package minimum, not a claim that every version was tested for the course. Use Node 24 to match the course's major version.

For a standalone folder outside the monorepo:

```sh
mkdir seltzer-http-course
cd seltzer-http-course
npm init -y
npm install --save-exact @citrusworx/seltzer@0.8.1
```

Copy the `.mjs` files from [examples](./examples/README.md) into that folder and run `node hello.mjs`. Use `npm.cmd` on Windows if PowerShell blocks the `npm.ps1` launcher. The `.mjs` extension enables `import` and `export` without a compiler or a package `type` setting.

A standalone install uses npm's artifact. A repository run may resolve a workspace copy. To see the entrypoint:

```sh
node --input-type=module -e "console.log(import.meta.resolve('@citrusworx/seltzer'))"
```

If repository dependencies are absent, follow the repository's Yarn setup and run `yarn install` first. Do not run a root npm install in this Yarn-managed monorepo.

## Make a round trip

With `hello.mjs` running, visit `http://127.0.0.1:3000/hello`. Expect:

```json
{"message":"Hello, HTTP!"}
```

In Terminal B:

```sh
curl -i http://127.0.0.1:3000/hello
```

Use `curl.exe` in Windows PowerShell to avoid its historical curl alias. `-i` includes response headers. Expect status 200 and a JSON content type; automatic headers such as `Date` vary.

## A little JavaScript vocabulary

`import { Seltzer } from "@citrusworx/seltzer"` loads an exported value. `node:http` instead identifies a module built into Node.

`handler: (ctx) => ({ body: { ok: true } })` assigns a function to an object property. The parentheses around the returned object distinguish an object expression from a function body. This is a recipe; Seltzer calls it later.

An `async` function returns a promise, representing work that can finish later. `await` pauses that function until the promise settles; other requests can still progress. A rejected promise can be handled with `try`/`catch`.

The course uses JavaScript first. TypeScript names such as `ResponseData` describe expected values for development tools. They do not validate JSON received at runtime.

## Troubleshooting

| Symptom | Check |
|---|---|
| `node` not found | Node installation and terminal PATH |
| Package not found | Dependencies and package resolution |
| `EADDRINUSE` | Stop the previous server on port 3000 |
| Connection refused | Server process, address, and port |
| HTTP 404 | The server answered; inspect method and path |

Run one course server on port 3000 at a time. These are local learning programs without login or durable storage. Seltzer 0.8.1 has no host option on `listen`; displaying a localhost URL does not make the socket loopback-only.

## Checkpoint

1. How does reloading after stopping the server differ from requesting `/missing` while it runs?
2. Which process stays alive after closing the browser?
3. Why can't a TypeScript annotation prove that incoming JSON contains a string?

[Answers](./answers.md#lesson-00)
