# 04 — Receive bytes, then decide what they mean

[Previous](./03-routing.md) · [Course](./README.md) · [Next](./05-notes-api.md)

**Goal:** separate body collection, JSON parsing, field presence, and application validity. Allow 60–90 minutes.

## A request does not arrive as a JavaScript object

The sender writes bytes. They can arrive in several chunks, and chunk boundaries do not correspond to JSON properties. A server cannot assume the first chunk contains the whole body.

Node exposes the request as a readable stream. Seltzer collects its chunks, concatenates them, decodes UTF-8, then parses JSON when the content type contains `application/json`. The asynchronous loop waits for the stream to finish. [Node's stream documentation](https://nodejs.org/api/stream.html#streams-compatibility-with-async-generators-and-async-iterators)

Read `readBody` and `parseStage` in [stages.ts](../../../libraries/seltzer/src/pipeline/stages.ts). GET and HEAD skip body parsing. An empty body becomes `undefined`. Other content types become strings. Multipart files and HTML form bodies are not automatically converted into objects.

Current parsing buffers the entire body; there is no Seltzer byte-limit option. That tradeoff makes the implementation small, but motivates the bounded-parser design in Lesson 11.

## Four different questions

| Layer | Question | Example failure |
|---|---|---|
| Collection | Did we receive readable content? | Broken request stream |
| JSON parsing | Is its syntax valid? | `{"text":` |
| Presence | Did the required field appear with a nonempty value? | `{}` or `{"text":" "}` |
| Application validation | Is the value acceptable for this operation? | `{"text":42}` or oversized text |

Seltzer's parser maps read/parse failures to a 400 “Invalid JSON body” response. This message can be less precise than the underlying cause.

The built-in validator recognizes `.required` in a field spec. It rejects absent, null, and blank-string values. It **does not enforce the word `string`** in `string.required`: numbers, booleans, arrays, and objects can count as present. A contract describes intention; the shipped validator only implements part of that intention.

## Build a trustworthy application boundary

Our create route declares:

```js
contract: { body: { text: "string.required" } }
```

Then application code performs a stronger check. The following excerpt is from the complete `readNoteText` function in [notes-app.mjs](./examples/notes-app.mjs):

```js
if (typeof body.text !== "string") {
  return { error: "text must be a string" };
}
const text = body.text.trim();
if (text.length === 0 || text.length > 200) {
  return { error: "text must contain 1 to 200 characters after trimming" };
}
return { text };
```

The complete function first rejects null, arrays, and non-objects so reading `body.text` is safe. We trim accepted text and store the normalized value. Extra fields are ignored. This is our application policy; another API might reject extra fields instead.

JavaScript `.length` measures UTF-16 code units, not human-perceived characters. The wording is simplified for this exercise; an internationalized product should explicitly decide whether its limit measures bytes, code points, or grapheme clusters.

## Send a body without shell-quoting surprises

In a temporary working folder, create `note.json` containing:

```json
{"text":"Learn HTTP"}
```

With the Notes server running:

```sh
curl -i -H "Content-Type: application/json" --data-binary @note.json http://127.0.0.1:3000/notes
```

Use `curl.exe` on Windows. `--data-binary` sends the file and defaults the request to POST. Expect 201, a `Location` header, and the new note. Change the file to `{"text":42}` and retry: expect 400. Change it to broken JSON: also 400, but from an earlier layer.

## Why ordering matters

Seltzer parses before it matches a route. Malformed JSON sent to `/does-not-exist` therefore produces 400, not 404. You cannot infer the responsible stage from a status code alone.

## Checkpoint

For `{}`, `{"text":0}`, `{"text":false}`, `{"text":" "}`, and `{"text":" useful "}`, identify which built-in checks pass and what our application ultimately does. Explain why adding a TypeScript cast would not replace these checks.

[Answers](./answers.md#lesson-04)
