# Ask the data: databases and SQL through Nectarine

Learn to ask a precise question, predict its answer, express it in SQL, and understand how Nectarine turns a named description into executable database work.

This is a companion to [HTTP, understood through Seltzer](../../seltzer/http-course/README.md). It assumes basic JavaScript and no previous database experience. You do not need the HTTP course until the optional integration lesson.

## A different way to learn SQL

We start with questions instead of a tour of keywords. “Who still has equipment?” is easier to reason about than an unexplained list of `SELECT` clauses. Each lesson follows the same loop:

1. **Ask:** describe a useful question about a small lending library.
2. **Predict:** choose the output columns and count the expected rows by hand.
3. **Build:** transform the question into SQL, one decision at a time.
4. **Observe:** run it against an actual embedded PostgreSQL engine.
5. **Translate:** express supported operations as named Nectarine YAML.
6. **Challenge:** change one assumption and explain the changed result.

The prediction is essential. A query can execute successfully and answer the wrong question. Learning to spot that is more valuable than memorizing punctuation.

Our project is a **community equipment library** with members, items, and loans. The small fixture deliberately includes a member with no loans, a returned loan, two open loans, and an item with multiple historical loans. These are the cases that expose mistakes hidden by perfect sample data.

## What is real, and what is proposed?

- **SQL lab:** PostgreSQL concepts executed directly for learning. These statements are not application backend code.
- **Implemented Nectarine:** behavior verified against this checkout's compiler and public entrypoints.
- **Host code:** our application glue around the library.
- **Proposed:** designs for capabilities that are absent or incomplete; not callable APIs or release promises.

Nectarine's application convention is named YAML queries with bound values, not embedded SQL strings in backend handlers. Reading and writing SQL in an isolated teaching lab is how we understand what that compiler produces. The companion HTTP example uses named queries and contains no SQL assembly.

The local manifest says **0.3.0**, while npm reports **0.4.0** as of September 16, 2026. This course identifies its baseline by source after merge `d25673e`, not by treating those numbers as interchangeable. See [the source map](./source-map.md).

## Learning path

Plan for roughly 15–22 hours including exercises. Read in order initially; the developer sections can be revisited on a second pass.

| Lesson | The question behind it |
|---|---|
| [00. Open the workbench](./00-workbench.md) | Can I experiment without managing a server? |
| [01. Facts, identity, and rules](./01-facts.md) | What should one row mean? |
| [02. Ask for a result](./02-select.md) | Which items are audio equipment? |
| [03. Missing values](./03-null.md) | Which loans have not been returned? |
| [04. Relationships and joins](./04-joins.md) | Who has which item? |
| [05. Groups and counts](./05-groups.md) | How many loans does each member have, including zero? |
| [06. Change facts carefully](./06-writes.md) | What changes when an item is returned? |
| [07. Values are not instructions](./07-parameters.md) | How does outside input become query data? |
| [08. Read the compiler](./08-compiler.md) | How does YAML become SQL? |
| [09. Transactions and concurrency](./09-transactions.md) | What if only half the operation succeeds? |
| [10. Evolve the schema](./10-migrations.md) | How do we change a database that already has data? |
| [11. Plans, pages, and JSON](./11-performance-json.md) | How do results stay useful as data grows? |
| [12. Connect to an application](./12-integration.md) | Where do HTTP and database responsibilities meet? |
| [13. Design the missing pieces](./13-future-design.md) | What would a trustworthy extension need to guarantee? |
| [14. Capstone](./14-capstone.md) | Can I design, query, and explain a new domain? |

## Materials

- [Lab setup and commands](./lab/README.md): runnable SQL, YAML models, compiler explorer, and tests.
- [The fixture](./dataset.md): stable data and expected result tables.
- [Answers](./answers.md): checkpoint reasoning and query solutions.
- [Glossary](./glossary.md): database vocabulary in everyday language.
- [Source map](./source-map.md): implementation seams, capability boundaries, and verification.

Joins, grouped reports, and pagination are taught as SQL even where the current compiler does not emit them. That is deliberate: SQL is a language with a broader expressive range than today's Nectarine grammar. We will neither invent support nor pretend unsupported SQL ideas are unnecessary.
