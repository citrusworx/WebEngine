# CS Study Guide — CitrusWorx Edition
*Targeted to your architecture, your stack, your gaps*

---

## How to Use This Guide

Each domain is ordered by **immediate relevance to CitrusWorx**. Within each domain you'll find: what to understand conceptually, what to build or implement to solidify it, and what it unlocks in your stack. Resources are tiered: read first, go deeper if the domain grips you.

---

## Domain 1: Compiler Theory & Language Design
**Relevance: Sig.js custom JSX runtime · Sugar output pipeline · WebEngine config parsing**

### Concepts to Master
- **Lexing and tokenization** — breaking source text into a token stream
- **Parsing and grammars** — context-free grammars (CFG), BNF/EBNF notation, recursive descent parsing
- **Abstract Syntax Trees (AST)** — representing parsed structure as a tree; walking and transforming trees
- **Evaluation models** — tree-walking interpreters vs. bytecode compilers vs. transpilers
- **Visitor pattern** — the standard way to process an AST without coupling logic to node types
- **Code generation** — emitting output (HTML, JS, SQL) from a transformed AST

### How It Connects to CitrusWorx
- Sig.js JSX runtime is a **transpiler** — JSX in, DOM calls out. Understanding AST transformation makes this first-class.
- Sugar's output pipeline (node graph → Juice-compatible HTML) is essentially a **code generator** — nodes are an AST, output is emitted HTML/CSS.
- WebEngine's YAML config parsing benefits from treating config as a **grammar with validation rules**, not just a key-value store.
- Nectarine's SQL phonics is already an informal **token assembly pipeline** — understanding this formally will let you make it far more expressive.

### What to Build
1. Write a tiny expression evaluator: tokenize `3 + 4 * 2`, parse it into an AST respecting precedence, evaluate it.
2. Write a minimal template language: `{{ variable }}` in a string → substituted output. Lex, parse, emit.
3. Formalize Nectarine's SQL phonics as a grammar. Write down the rules in EBNF.

### Resources
- **Crafting Interpreters** by Robert Nystrom — free online at craftinginterpreters.com. The single best intro. Read Part I and II.
- **Engineering a Compiler** by Cooper & Torczon — go deeper if compilers become central to CitrusWorx (they might).
- **The Dragon Book** (Compilers: Principles, Techniques, and Tools) — reference tier, not a cover-to-cover read.

---

## Domain 2: Distributed Systems
**Relevance: Citrode scaling · WebEngine multi-node · GrapeVine blueprint orchestration**

### Concepts to Master
- **CAP Theorem** — Consistency, Availability, Partition Tolerance: you get two. Know what each tradeoff means operationally.
- **Consistency models** — strong consistency vs. eventual consistency vs. causal consistency
- **Consensus algorithms** — Raft (readable) and Paxos (reference). Understand leader election and log replication.
- **Replication strategies** — single-leader, multi-leader, leaderless. Know the failure modes of each.
- **Partitioning / sharding** — range partitioning vs. hash partitioning; hot spots and how to avoid them
- **Distributed transactions** — two-phase commit (2PC), sagas, and why distributed transactions are hard
- **Failure modes** — network partitions, split brain, clock skew, Byzantine faults (surface-level)
- **Message queues and event logs** — Kafka-style log-based messaging; at-least-once vs. exactly-once delivery

### How It Connects to CitrusWorx
- Citrode hosting multiple WebEngine apps requires understanding **replication and failure isolation** — one tenant's failure shouldn't cascade.
- GrapeVine blueprint orchestration is essentially a **distributed workflow** — provisioning steps have dependencies, can fail, need idempotency.
- Nectarine at scale will need to reason about **read replicas, connection pooling**, and query routing.

### What to Build
1. Implement a toy Raft leader election in JavaScript — just the election phase, not full log replication.
2. Design (on paper) the Citrode data model assuming multi-region. Where does consistency matter? Where can you tolerate eventual consistency?
3. Make GrapeVine provisioning steps **idempotent** — running the same blueprint twice should be safe. This is a distributed systems problem in miniature.

### Resources
- **Designing Data-Intensive Applications** by Kleppmann — you're already reading this. It covers everything in this section. Finish it.
- **Raft paper** — "In Search of an Understandable Consensus Algorithm" by Ongaro & Ousterhout. Readable and short.
- **Martin Fowler's bliki** — distributed systems patterns: saga, event sourcing, CQRS. Free online.

---

## Domain 3: Algorithms & Complexity
**Relevance: Sugar node graph · WebEngine dependency resolution · Nectarine query planning**

### Concepts to Master
- **Big-O notation** — time and space complexity; how to reason about algorithm performance at scale
- **Sorting algorithms** — not to implement them from scratch, but to understand *when* different sorts win
- **Graph algorithms** — BFS, DFS, topological sort, shortest path (Dijkstra), cycle detection
- **Dynamic programming** — memoization vs. tabulation; recognizing overlapping subproblems
- **Greedy algorithms** — when local optimality produces global optimality (and when it doesn't)
- **Hash tables internals** — collision resolution, load factors, why O(1) lookup is amortized
- **Recursion and the call stack** — stack frames, tail recursion, when recursion is and isn't appropriate

### How It Connects to CitrusWorx
- Sugar's node graph is a **directed graph** — cycle detection is a real requirement (circular node connections are invalid).
- WebEngine blueprint dependency resolution is **topological sort** — you must load dependencies before dependents.
- Nectarine's SQL generation benefits from understanding **query plan complexity** — some YAML configs will produce catastrophically inefficient SQL if you're not careful.

### What to Build
1. Implement **topological sort** and wire it into WebEngine's blueprint dependency loader.
2. Add **cycle detection** to Sugar's node graph — prevent users from creating circular connections.
3. Given a Nectarine YAML config, reason through the complexity of the generated SQL. Could it produce an N+1?

### Resources
- **Introduction to Algorithms (CLRS)** — the canonical reference. Don't read cover-to-cover; use it as a reference per topic.
- **Algorithm Design Manual** by Skiena — more readable than CLRS, better war stories, good intuition-building.
- **Neetcode.io** — if you want to do targeted practice problems without full leetcode grind. Pick graph and DP tracks only.

---

## Domain 4: Data Structures (Formal)
**Relevance: WebEngine config resolution · Nectarine schema modeling · Sugar graph**

### Concepts to Master
- **Trees** — binary trees, BSTs, balanced trees (AVL, red-black), tries; traversal orders (in/pre/post-order)
- **Heaps and priority queues** — min-heap, max-heap; heap operations and where they apply
- **Graphs** — adjacency list vs. adjacency matrix; directed vs. undirected; weighted vs. unweighted
- **Tries** — prefix trees; excellent for autocomplete, config key lookups, route matching
- **Bloom filters** — probabilistic membership testing; useful for cache invalidation and deduplication
- **Skip lists** — ordered data structure alternative to balanced BSTs; used in some databases
- **LRU Cache** — doubly linked list + hash map pattern; shows up everywhere in systems design

### How It Connects to CitrusWorx
- **Tries** are a natural fit for WebEngine's route resolution — matching URL patterns against a prefix tree is O(k) where k is path length.
- **LRU cache** is directly applicable to Nectarine's query result caching layer.
- **Graphs** are Sugar's core data model. Knowing the representation tradeoffs (adjacency list vs. matrix) matters for Sugar's performance at scale.

### What to Build
1. Implement a **trie-based router** as a spike — compare it to your current route matching in SigRouter.
2. Implement an **LRU cache** from scratch — doubly linked list + Map. Then identify where in Nectarine it belongs.
3. Model Sugar's node graph formally as an adjacency list. Write serialize/deserialize functions for it.

### Resources
- **Open Data Structures** by Pat Morin — free online, rigorous, practical.
- **Visualgo.net** — visual walkthroughs of every data structure. Great for building intuition before reading formal definitions.
- CLRS chapters on trees and graphs (reference as needed).

---

## Domain 5: Operating Systems Internals
**Relevance: GrapeVine provisioning · Citrode hosting · Networking layer**

### Concepts to Master
- **Processes vs. threads** — memory isolation, context switching, scheduling
- **Memory management** — virtual memory, paging, page tables, TLB; heap vs. stack
- **File systems** — inodes, directory trees, permissions, journaling
- **I/O and system calls** — how user space talks to kernel space; blocking vs. non-blocking I/O
- **Concurrency primitives** — mutexes, semaphores, condition variables, deadlock conditions
- **The event loop model** — how Node.js works at the OS level; libuv and epoll/kqueue

### How It Connects to CitrusWorx
- GrapeVine provisions Droplets — understanding what you're actually standing up (process model, memory layout, file system structure) makes your blueprints better.
- Citrode hosting is a **multi-tenant process orchestration** problem at its core.
- Node.js (your runtime for Nectarine/WebEngine backend) is built on the event loop — understanding libuv makes you a better Node developer.

### What to Build
1. Write a shell script that provisions a Droplet manually step-by-step, then reverse-engineer what each step does at the OS level.
2. Read the Node.js event loop documentation and diagram it yourself. Identify where Nectarine's async DB calls fit in the loop phases.

### Resources
- **Operating Systems: Three Easy Pieces (OSTEP)** — free online. Excellent, approachable. Read the virtualization and concurrency sections first.
- **The Linux Command Line** by William Shotts — free online. Practical OS knowledge through the shell.
- **Node.js under the hood** series — search for it on dev.to. Good bridge between OS theory and your actual runtime.

---

## Domain 6: Networking Fundamentals
**Relevance: Citrode · GrapeVine · Security certifications**

### Concepts to Master
- **TCP/IP model** — layers, responsibilities, how packets route across the internet
- **DNS** — resolution chain, TTL, record types (A, AAAA, CNAME, MX, TXT, NS); authoritative vs. recursive resolvers
- **TLS/SSL** — handshake process, certificate chains, CA trust model, mutual TLS
- **HTTP/1.1 vs HTTP/2 vs HTTP/3** — multiplexing, head-of-line blocking, QUIC
- **WebSockets** — upgrade handshake, frame format, use cases vs. SSE vs. long polling
- **Firewalls and network security** — packet filtering, stateful inspection, DMZ, VPN
- **Load balancing** — round robin, least connections, consistent hashing; L4 vs. L7 load balancers

### How It Connects to CitrusWorx
- GrapeVine's domain management is fundamentally a **DNS configuration problem** — knowing the resolution chain cold makes this trivial.
- Citrode serving WebEngine apps needs a clear mental model of **TLS termination, reverse proxying**, and load balancing.
- Your CEH, CCNP, Network+, and Security+ certs cover this domain heavily — studying here compounds directly into cert prep.

### What to Build
1. Manually configure DNS for a domain using DigitalOcean's DNS panel — trace every record type you create.
2. Set up an Nginx reverse proxy in front of a Node.js app on a Droplet. Understand every directive you write.
3. Use `openssl s_client` to inspect a TLS handshake manually. Read the certificate chain output.

### Resources
- **Computer Networks: A Top-Down Approach** by Kurose & Ross — the standard textbook. Read the application and transport layers first.
- **High Performance Browser Networking** by Ilya Grigorik — free online. HTTP/2, WebSockets, QUIC. Directly applicable.
- **Professor Messer's CompTIA courses** — free on YouTube. Directly aligned with Network+ and Security+ cert prep.

---

## Certification Alignment

| Cert | Primary Domains Covered |
|---|---|
| CompTIA Network+ | Networking Fundamentals |
| CompTIA Security+ | Networking · OS Internals (security angle) |
| CEH | Networking · OS Internals · Algorithms (exploit patterns) |
| CCNP | Networking Fundamentals (deep) |

Study the domains above and the cert prep compounds — you're not studying twice, you're studying once with dual returns.

---

## Recommended Study Order

1. **Compiler Theory** — highest CitrusWorx leverage, most unique, nothing else teaches this implicitly
2. **Algorithms & Data Structures** — foundational, immediately applicable to Sugar and WebEngine
3. **Distributed Systems** — you're already in DDIA; keep going, finish it
4. **Networking** — cert path covers this; align domain study with cert schedule
5. **Operating Systems** — OSTEP is free and excellent; background reading alongside everything else

---

*This guide is a living document. Revisit and reprioritize as CitrusWorx evolves.*
