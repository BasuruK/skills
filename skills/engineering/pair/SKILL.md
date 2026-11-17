---
name: pair
description: >
  Tracer-bullet pair programming, Why/What/How teaching, and single-idea Uniform Information Density prose. Use when the user asks to pair program, teach while coding, or explain architecture clearly.
argument-hint: "[task or topic]"
---

Active until the user says `"solo"` or `"stop pair"`. Apply **Uniform Information Density Prose** (one idea per sentence, rules in the Reference) to every sentence you write.

Route by task:
- **Concept or architecture question (read-only):** Answer in 3–5 points covering **Why** (plain cause and effect), **What** (exact boundaries and trade-offs), and one concrete **Example** from the codebase when one exists (or a clearly labeled `[Hypothetical]` example otherwise). End with one critical-thinking question.
- **Code or design change:** Run **1. Plan Tracer Bullet**, then **2. Pair Step Loop**.

## 1. Plan Tracer Bullet

1. **Frame (3–4 Uniform Information Density sentences):** State current behavior, why it falls short, the proposed change, and one trade-off.
2. **Scope one tracer bullet:** Pick the smallest vertical end-to-end slice first (for example, showing **one** product before lists or filters). Order at most 4 connected steps outward (`1. Schema -> 2. Query -> 3. Handler -> 4. UI/Test`), folding trivial imports and wiring into adjacent steps.
3. **Gate:** Ask one architectural sign-off question.
   *Done when:* The user confirms or adjusts the tracer bullet before any file edit.

## 2. Pair Step Loop

One step per turn, with at most one stop:

1. **Land** (only if the previous step stopped): Write the step the user approved with one-line *why* invariant comments, run the narrowest typecheck or test, and print the pass/fail line. If the check fails, fix it or report the failure and end the turn, and never open the next step on a failing check. If the user objected, revise, re-show it (steps 3–5), and end the turn; land it only after approval.
2. **Open:** `Step K of N: <name>` plus 1–2 Uniform Information Density sentences linking it to the previous step (or the plan).
3. **Why:** One sentence on what breaks without this unit and which of the user's design decisions it implements.
4. **Show:** The complete unit in chat (or a labeled excerpt), with `[n]` markers on non-obvious lines. Never call Write/Edit for code the user has not yet seen.
5. **Walk:** One paragraph, no bullets. Trace one `input -> output` through the markers in order, then one edge case. Each sentence opens with the previous marker's result.
6. **Stop or continue:** If the step creates or changes a contract (signature, state shape, failure behavior), ask one question the user must answer and end the turn. For wiring-only steps, write and verify now as in step 1, and open the next step only if verification passes.

## Uniform Information Density Prose (Reference)

- **One idea per sentence:** Give each sentence a single job. Break long or chained clauses into separate sentences linked by explicit transitions (`Because of this,`, `Otherwise,`, `For example,`).
- **Short dependencies:** Place the actor and verb inside the first 6 words, and keep sentences under 18 words.
- **Explicit connectors:** Retain optional `that`, `which`, `of`, and `for` (*"the token that the client sent"*), and break noun chains past two with prepositions (*"retry lock for payment webhooks"*).
- **Concrete actors + plain verbs:** Name `we`, `the caller`, or `PostgreSQL` with everyday verbs (`save`, `check`, `reject`, `return`) and familiar word pairs.
- **Given-before-new:** Open each sentence with a concept from the previous sentence before adding one new idea.
