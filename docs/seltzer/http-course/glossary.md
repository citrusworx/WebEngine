# HTTP and Seltzer glossary

[Course](./README.md)

| Term | Meaning in this course |
|---|---|
| API | A defined way another program can ask your program to do work |
| Application | The program's domain behavior, such as storing and editing notes |
| Async / await | JavaScript syntax for working with promises without blocking the entire program while waiting |
| Authentication | Establishing who a caller is through verified credentials |
| Authorization | Deciding whether that identity may perform a particular operation |
| Body / payload | The content carried by a message; distinct from its headers |
| Buffer | A Node representation of bytes in memory |
| Client | The party initiating an HTTP request in an exchange |
| Closure | A function's continuing access to values from the scope where it was created |
| Context | Seltzer's per-request object holding inputs and, internally, pipeline state |
| Contract | Declared expectations about an operation; declarations require an implementation that enforces them |
| CORS | A browser/server protocol governing a page's access to cross-origin responses |
| CRUD | Create, read, update, delete: categories of application operations |
| Dependency | A value or service code needs, such as an ID generator or repository |
| Endpoint | Informally an API address/operation; Seltzer also exports a specific client input type named `Endpoint` |
| Header | A named HTTP field carrying message metadata |
| HTTP | The request/response protocol used by our client and server |
| HTTPS | HTTP carried over a connection protected with TLS |
| Idempotent | Repeating an operation has the same intended effect as performing it once; responses can differ |
| JSON | A text format for structured values; it is not the same as an in-memory JavaScript object |
| Listener | The server accepting incoming connections on an address/port |
| Locals | The host-provided object available through `ctx.locals`; shared by requests on that listener |
| Method | The request operation token, such as GET or POST |
| Origin | The scheme, host, and port combination used by browser origin checks |
| Parameter | Here, a value captured from a path pattern such as `:id` |
| Pipeline | Ordered stages that operate on a shared request context |
| Port | A number identifying a network service on a host |
| Preflight | A browser's preliminary OPTIONS exchange for certain cross-origin requests |
| Promise | A JavaScript value representing an eventual result or failure |
| Query string | The URL portion after `?`; distinct from a generated operation's named `query` key |
| Representation | The form in which resource information is sent, such as JSON or text |
| Resource | The thing an address refers to, such as one note or a collection |
| ResponseData | Seltzer's `{ status?, headers?, body? }` transport description |
| Route | A registered method, path pattern, and handler |
| Runtime | The executing environment or library machinery that turns your definitions into behavior |
| Serialization | Encoding an in-memory value into a transmissible form |
| Server | The party receiving and answering a request in an exchange |
| Short-circuit | Stop ordinary processing early and jump to the response-sending path |
| Stage | One function in Seltzer's named pipeline |
| Status | The HTTP response code describing its outcome |
| Stream | Data made available over time in chunks rather than necessarily all at once |
| TLS | The transport security mechanism used by HTTPS |
| Validation | Checking that input meets specified rules; different layers check different rules |

These definitions are learning aids. For protocol precision, consult the primary sources linked in the lessons and [source map](./source-map.md).
