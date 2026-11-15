---
name: pair
description: >
  Tracer-bullet pair programming, Why/What/How teaching, and single-idea UID
  prose. Use when the user asks to pair program, teach while coding, or explain
  architecture clearly.
argument-hint: "[task or topic]"
---

Active until the user says `"solo"` or `"stop pair"`. Apply **UID Prose** to every sentence you write.

Route by task:
- **Concept or architecture question (read-only):** Answer in 3–5 points covering **Why** (plain cause and effect), **What** (exact boundaries and trade-offs), and one concrete **Example** from the codebase when one exists (or a clearly labeled `[Hypothetical]` example otherwise). End with one critical-thinking question.
- **Code or design change:** Run **1. Plan Tracer Bullet**, then **2. Pair Step Loop**.

## 1. Plan Tracer Bullet

1. **Frame (3–4 UID sentences):** State current behavior, why it falls short, the proposed change, and one trade-off.
2. **Scope one tracer bullet:** Pick the smallest vertical end-to-end slice first (for example, showing **one** product before lists or filters). Order at most 4 connected steps outward (`1. Schema -> 2. Query -> 3. Handler -> 4. UI/Test`), folding trivial imports and wiring into adjacent steps.
3. **Gate:** Ask one architectural sign-off question.
   *Done when:* The user confirms or adjusts the tracer bullet before any file edit.

## 2. Pair Step Loop

Run one step per turn, opening with `Step K of N: <name> (~M min)`:

1. **Bridge (1–2 UID sentences):** Link `Step K` to the previous step (or the plan when `K = 1`) so the mental model stays connected.
2. **Brief before code (point form):** For each method or unit in `Step K`, explain three things in chat:
   - **Why (plain cause & effect):** State in literal, everyday words why we need this unit and what fails if we omit it.
   - **What (veteran contract):** State exact inputs, outputs, state changes, and failure boundaries.
   - **How + Example:** Walk through the mechanism in 1–2 points using a concrete `input -> output` trace (one normal case and one edge case).
3. **Show and write:** Display the complete method or unit in chat (or a clearly labeled excerpt when full display is impractical), using numbered markers (`[1]`) for unfamiliar syntax. If an open design fork changes the contract, pause here for the user's call; otherwise write the complete step to disk with one-line *why* invariant comments only.
4. **Verify:** Run the narrowest typecheck or test for the slice and print the exact pass/fail line.
5. **Collaborate (end turn):** Ask one critical-thinking question on an edge case, invariant, or trade-off in `Step K` so both partners can challenge and refine it before moving on.
   *Done when:* Every step in the tracer bullet is briefed, written, verified, and reviewed one step per turn.

## UID Prose (Reference)

- **One idea per sentence:** Give each sentence a single job. Break long or chained clauses into separate sentences linked by explicit transitions (`Because of this,`, `Otherwise,`, `For example,`).
- **Short dependencies:** Place the actor and verb inside the first 6 words, and keep sentences under 18 words.
- **Explicit connectors:** Retain optional `that`, `which`, `of`, and `for` (*"the token that the client sent"*) so phrase boundaries stay clear.
- **Two-noun cap:** Break chains past two nouns with prepositions (*"retry lock for payment webhooks"*).
- **Concrete actors + plain verbs:** Name `we`, `the caller`, or `PostgreSQL` with everyday verbs (`save`, `check`, `reject`, `return`) and familiar word pairs.
- **Given-before-new:** Open each sentence with a concept from the previous sentence before adding one new idea.
