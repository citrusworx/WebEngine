# 01 — A request is a message

[Previous](./00-workbench.md) · [Course](./README.md) · [Next](./02-first-server.md)

**Goal:** identify the parts of an exchange and separate them from application code. Allow 45 minutes.

## Start with the conversation

A client asks; a server answers. A browser is one client, but so is a script. A server becomes a client when it calls another API. These names describe roles in an exchange.

The address identifies where to ask, the method describes the requested operation, headers provide message information, and an optional body carries content. The reply has a status, headers, and possibly content. [HTTP Semantics: messages](https://www.rfc-editor.org/rfc/rfc9110.html#section-6)

## Read an address

```text
http://127.0.0.1:3000/notes/42?view=compact
|      |         |    |        |
scheme host      port path     query
```

`127.0.0.1` means this computer. Port 3000 selects the listening service. Our application matches `/notes/42`. The query `view=compact` provides extra input.

For a public hostname, name resolution helps locate the host before the request reaches the application. Seltzer's route matcher is not a DNS resolver; networking has already brought the message to Node.

## Read a message

Here is an illustrative HTTP/1.1 exchange, with connection/framing details omitted:

```http
GET /notes/42?view=compact HTTP/1.1
Host: 127.0.0.1:3000
Accept: application/json

```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"id":"42","text":"Learn HTTP"}
```

The blank line separates headers from content. `Accept` requests a representation; `Content-Type` describes what is actually sent. A header cannot turn the text `hello` into valid JSON.

Seltzer does not automatically negotiate representations from `Accept`. Our routes consistently return JSON. HTTP/2 and HTTP/3 use different encodings; this text is an HTTP/1.1 illustration, not every protocol version's packet format.

## Choose an operation

| Intent | Our request | Success |
|---|---|---|
| List | `GET /notes` | 200 and an array |
| Read | `GET /notes/:id` | 200 and a note |
| Create | `POST /notes` | 201 and `Location` |
| Edit text | `PATCH /notes/:id` | 200 and the changed note |
| Delete | `DELETE /notes/:id` | 204, no body |

These are application choices. Seltzer does not implement CRUD just because you register these method names.

“Safe” means the requested semantics are read-only. “Idempotent” means repeating the request has the same intended effect as doing it once, even if the response differs. Deleting twice can leave a note absent while the second response is 404. Repeating a create can make two notes. This matters when deciding whether to retry. [HTTP method properties](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2)

In this course, 400 rejects input, 404 means a route or note was not found, and 500 signals a server failure. Read the body too: two layers can produce the same status.

## Stateless does not mean no stored data

HTTP does not remember your preceding request on behalf of the application. Our program can still store notes or sessions. Each request must carry enough information to identify the operation and any identity it requires.

Our `Map` disappears on restart. That is the example's persistence limitation, not a rule of HTTP.

## Experiment and checkpoint

With `hello.mjs` running, request `/hello`, `/missing`, and `POST /hello`. For the last, use `curl -i -X POST http://127.0.0.1:3000/hello`. Seltzer returns 404 for an unmatched method; it does not automatically produce 405.

Write a request that creates `{"text":"Learn HTTP"}`. Label its method, path, content type, and body. Explain why a lost response to a successful POST is dangerous to retry blindly.

[Answers](./answers.md#lesson-01)
