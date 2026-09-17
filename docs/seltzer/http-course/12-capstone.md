# 12 — Build, explain, and defend your API

[Previous](./11-future-design.md) · [Course](./README.md) · [Answers](./answers.md)

**Goal:** apply the course independently and explain both working behavior and remaining limits. Allow 2–3 hours, plus optional extensions.

## Your brief

Create a Reading List API using Seltzer 0.8.1. Each entry has an ID, a title, and a `finished` boolean. Work in a separate exercise folder so the course's reference solutions remain available.

Define these operations:

- Create an entry with a nonblank title; return 201 and its location.
- List entries; optionally filter by finished state.
- Read one entry or return 404.
- Update its finished state; reject values of the wrong type.
- Delete an entry with a bodyless 204.
- Return counts from a static `/reading/stats` path that cannot be swallowed by `/reading/:id`.

Keep storage in memory for the required project. State that limitation in your README. You do not need a frontend, database, identity provider, or cloud account to complete the assessment.

## Make three deliveries

**1. An application.** Include an app factory, executable server, and small client. Use structured responses. A clean run should not depend on the Notes server or a fixed test port. Specify what `?finished=false` means; do not use `Boolean("false")`, which evaluates to true.

**2. Evidence.** Write HTTP-level tests for the successful lifecycle, invalid JSON, wrong value types, a missing ID, route specificity, an empty collection, and no response body on delete. Include one current-runtime edge such as trailing-slash behavior or an early pipeline exit. Close every listener.

**3. Explanation and design.** Write a plain-language walkthrough of one successful create and one failed create. Identify the exact stage where the failure occurs. Then write a proposal for one unfinished capability from Lesson 11, with an API marked proposed, acceptance tests, compatibility notes, and a rejected alternative.

## Review rubric

| Area | Points | Evidence |
|---|---:|---|
| HTTP decisions | 20 | Methods, statuses, headers, bodyless delete, list/missing distinction |
| Runtime understanding | 20 | Correct response shapes, routing, validation, pipeline explanation |
| Input boundaries | 20 | Wrong types rejected, false preserved, query strings parsed explicitly |
| Verification | 20 | Meaningful HTTP tests, isolated state, lifecycle cleanup |
| Communication and design | 20 | Clear walkthrough, honest limits, implementable proposed contract |

A score is feedback, not a certification. Missing tests or a wrong response contract indicates a concept to revisit. An elegant feature proposal cannot compensate for silently accepting invalid data.

## Questions for a review conversation

Ask someone to send an unfamiliar request to your app. Before running it, predict the selected route, the stage sequence, the response, and any stored-state change. Explain why their request did or did not meet your contract.

Then ask them to change a single condition: malformed JSON, missing field, wrong method, duplicate query value, or unknown ID. A useful explanation names what changed and what stayed the same. “Seltzer handles it” is not enough.

## Optional developer extensions

Generate the read routes from operation descriptions while retaining hand-written writes. Compare executor and handler return contracts. Add an injected repository interface without changing the HTTP behavior, then implement a fake repository that throws to study errors. Rebuild a small pipeline using the older [Node exercises](../exercises/README.md) and compare it with the shipped runner.

Do not quietly convert proposed Seltzer methods into course requirements. If you implement a future feature, keep it in a separate branch or experiment, name its behavior, and rerun the relevant compatibility tests.

## Where to go next

Use [the source map](./source-map.md) for a guided library reading pass, [Seltzer's API reference](../seltzer-api.md) for lookup, and [the integration guide](../seltzer-integration.md) when adding Nectarine or an application host. Return to the plain-language explanation whenever an integration obscures which layer owns a failure.
