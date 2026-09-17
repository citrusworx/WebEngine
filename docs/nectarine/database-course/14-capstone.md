# 14 — Design a database and defend its answers

[Previous](./13-future-design.md) · [Course](./README.md) · [Answers](./answers.md)

**Goal:** transfer the reasoning method to a new domain. Allow 2–4 hours.

## The brief: a workshop booking system

Model learners, workshops, and registrations. A learner can register for several workshops; a workshop has many learners. A registration is an event connecting them and can have a cancellation timestamp.

Write down what one row means in each table before writing CREATE TABLE or YAML. Choose identities, required values, foreign keys, and rules that prevent accidental duplicate registrations under your chosen history policy.

Create a tiny fixture that exposes mistakes: a learner with no registrations, a workshop with no attendees, a cancelled registration, a learner with two registrations, and two learners sharing a display name. Use a fixed evaluation date where needed.

## Deliver questions before queries

For each question below, hand-write the expected result table, including empty and zero cases:

1. Which workshops match a requested topic?
2. Which registrations have not been cancelled?
3. Who is registered for which workshop?
4. How many active registrations does every workshop have, including zero?
5. Which learners have no active registrations?
6. How should a deterministic second page of workshops be selected?

Then write executable PostgreSQL lab queries and compare actual results to your predictions. Explain one query that is syntactically valid but answers the wrong question.

## Deliver named Nectarine operations honestly

Translate at least one filtered read, one create, one constrained update, and one scalar count into supported Nectarine YAML. Bind runtime inputs separately. Print the emitted SQL and test it against the engine.

Label joins, grouped reporting, and pagination as SQL-only wherever your chosen checkout cannot compile them. Do not invent a working-looking YAML answer to satisfy a rubric. Explaining a capability boundary is part of completing the task.

## Deliver failure evidence

Prove at least these behaviors:

- Unknown foreign identities and duplicate unique keys are rejected.
- Null and blank text are treated according to your stated contract.
- A SQL-looking input remains a value.
- A failed second statement rolls back the first in your transaction experiment.
- An edited applied migration is not silently replayed.
- A report retains an entity with zero matching child rows.

For a real concurrency claim, use separate connections to a network PostgreSQL server. A single embedded lab cannot prove pool behavior or contention policy. You can complete the required capstone by explaining and specifying that integration test rather than falsely claiming to have run it.

## Deliver a one-page design brief

Choose one missing capability from Lesson 13. State the problem, candidate API marked proposed, compatibility cost, acceptance tests, and one rejected alternative. Include a case where the seemingly simpler design gives a wrong answer or weakens a guarantee.

## Review rubric

| Area | Points | Evidence |
|---|---:|---|
| Data model | 20 | Clear row meaning, identities, references, explicit invariants |
| Query reasoning | 25 | Correct grain, null handling, joins, zero counts, ordering |
| Nectarine use | 20 | Supported shapes, correct binds, inspected output, honest boundaries |
| Failure verification | 20 | Actual engine outcomes, rollback, constraints, isolated fixtures |
| Communication and design | 15 | Plain-language explanations and implementable proposal |

A running query is not automatically a correct answer. A green compiler test is not automatically a correct database integration. Review both the meaning and the execution.

## A different review exercise

Give a reviewer your fixture and one result table without showing the SQL. Ask them to infer the question. If their interpretation differs from your intent, examine the output shape and naming.

Then let them add one row: a duplicate label, a missing relationship, a cancelled record, or a second event for the same pair. Predict which query answers change. This tests understanding more effectively than reproducing a memorized SELECT statement.

Continue with [Nectarine's reference docs](../README.md) for API lookup and the [Seltzer HTTP course](../../seltzer/http-course/README.md) when you are ready to serve the model to clients.
