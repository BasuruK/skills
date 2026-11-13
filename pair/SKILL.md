---
name: pair
description: >
  Tracer-bullet pair programming and UID prose. Use when the user asks to pair
  program, teach while coding, or explain architecture in clear prose.
argument-hint: "[task or topic]"
---

Active until the user says `"solo"` or `"stop pair"`.

Route by task:
- **Concept or architecture question (no file edits):** Apply **UID Prose** in 3–5 sentences grounded in one example from the codebase, then end on one check-in question.
- **Code or design change:** Run **1. Plan Tracer Bullet**, then **2. Pair Step Loop** with **UID Prose** applied throughout.

## 1. Plan Tracer Bullet

1. **Frame (3–4 UID sentences):** State current behavior, what breaks or is missing, the proposed path, and one trade-off.
2. **Scope one tracer bullet:** Pick the smallest vertical end-to-end case (for example, showing **one** product before lists, filters, or carts) and order at most 4 connected steps outward (`1. Schema -> 2. Query -> 3. Handler -> 4. UI/Test`).
3. **Gate:** Ask one architectural sign-off question.
   *Done when:* The user confirms or adjusts the tracer bullet before any file edit.

## 2. Pair Step Loop

Run one step per turn, opening with `Step K of N: <name> (~M min)`:

1. **Bridge (2–4 UID lines):** Connect this step to step `K-1` and state what changes and why.
2. **Write by surprisal:**
   - *High surprisal* (new schema, API contract, algorithm, unfamiliar concept): Write one 15–25 line semantic unit and stop. On core domain or algorithmic puzzles, write surrounding types/plumbing and leave a 3–8 line `// TODO(you): <invariant to satisfy>` **crux** for the user, offering `"draft"` to write it for them.
   - *Low surprisal* (imports, types, wiring, repetitive test setup): Batch the whole step cleanly in one edit.
3. **Annotate in chat:** Use numbered markers (`[1]`) in the chat snippet to teach unfamiliar syntax; save the file with one-line *why* invariant comments only.
4. **Verify:** Run the narrowest typecheck or test on the slice and print the exact pass/fail line.
5. **Hand off:** End with one bounded next action (`Implement TODO(you), or reply "draft" for Step K+1`).
   *Done when:* Every step in the tracer bullet passes its check and every `TODO(you)` crux is resolved.

## UID Prose (Reference — apply to every sentence)

- **Keep function words:** Include optional `that`, `which`, `of`, `for`, and `because` to mark clause boundaries explicitly.
- **Two-noun cap:** Break chains past two nouns with prepositions (*"retry lock for payment webhooks"*).
- **Short dependencies:** Place actor and verb inside the first 6 words; cap sentences at 18 words.
- **Concrete actors + everyday verbs:** Name `we`, `the user`, or `PostgreSQL` with plain verbs (`save`, `check`, `reject`, `return`) and common collocations.
- **Given-before-new:** Open each sentence with a term from the prior sentence before adding one new idea.
