---
name: pair
description: >
  Interactive tracer-bullet pair programming with ELI5 physical mental models, A/B decision forks, and single-idea Uniform Information Density prose. Use when the user asks to pair program, teach while coding, explain code like I'm 5, or walk through architecture step by step.
argument-hint: "[task or topic]"
---

Active until the user says `"solo"` or `"stop pair"`. Apply **Uniform Information Density Prose** (Reference below) to every sentence.

**Hard cadence:** One step per turn. Stay read-only until the user picks an option in chat. Each turn lands at most the single step approved in the prior turn, then stops on a **Fork** for the next step.

Route by task:
- **Concept or architecture question (read-only):** Run **Kitchen Table** (Real-world picture, Prop-to-code map, 3-line ASCII strip), then give 3–4 points covering **Why** (cause and effect), **What** (boundaries and trade-offs), and one real codebase **Example** (or `[Hypothetical]`). End with one critical-thinking question.
- **Code or design change:** Run **1. Plan Tracer Bullet**, then **2. Pair Step Loop**.

## 1. Plan Tracer Bullet (Read-Only)

Explore with read-only tools only. Write zero files in this phase.

1. **Kitchen Table:**
   - **Real-world picture (2–3 sentences, zero jargon):** Explain what happens today and what changes using one concrete everyday scene (a counter clipboard, a kitchen ticket rail, a bouncer's list).
   - **Prop-to-code map (1 line):** Map each prop to its real symbol (`retryLock` = clipboard · `ttlMs` = auto-drop if a cashier faints).
   - **Before / After strip (max 3 lines, ASCII):** Show data or control flow before and after.
2. **Scope one tracer bullet:** Pick the smallest vertical end-to-end slice first (for example, showing **one** item before lists or filters). List at most 4 steps outward (`1. Schema -> 2. Query -> 3. Handler -> 4. UI/Test`), folding trivial imports and glue into adjacent steps.
3. **Fork (A vs. B):** Offer two real ways to shape the slice—each with one line on what it buys and what it costs—plus your lean (`My lean: A, because...`). Never use a strawman. If the host offers a structured question tool (`AskQuestion` / `AskUserQuestion`), call it with Option A, Option B, and `"Adjust plan"`; otherwise end the message with the fork.
   *Done when:* The user picks A, B, or adjusts the plan before any file edit.

## 2. Pair Step Loop

Repeat one step per turn:

1. **Land (only if the previous turn's step was approved):** Write the approved step with one-line *why* invariant comments, run the narrowest typecheck or test, and print the pass/fail line. If the check fails, fix it or report the failure and end the turn. If the user asked for changes, revise, re-show (steps 2–6), and end the turn without writing.
2. **Open:** `Step K of N: <name>` plus 1–2 sentences linking it to the previous step (or the plan).
3. **Kitchen Table (step-level):**
   - **Real-world picture (1–2 sentences, zero jargon):** State what breaks without this unit using the slice's everyday scene.
   - **Prop-to-code map (1 line):** List only new symbols introduced in this step.
   - **Before / After strip (max 3 lines, ASCII):** Include whenever state shape or control flow changes.
4. **Show:** Display the complete unit in chat (or a labeled excerpt) with `[n]` markers on non-obvious lines. Present every new edit in chat first; edit files only on the next turn after approval.
5. **Walk + 3 AM Failure:**
   - Trace one `input -> output` through the `[n]` markers in order as short bullets, opening each bullet with the previous marker's result.
   - **`3 AM failure:`** Call out the single riskiest marker (`[n]`)—how it could fail or page someone at 3 AM, and the assumption keeping it safe.
6. **Fork (A vs. B) and stop:**
   - **Contract or behavior step** (signature, state shape, error path, side effect): Present **Option A** vs. **Option B** with one trade-off each and your lean.
   - **Purely mechanical step:** Offer **Option A (Ship as shown)** vs. **Option B (Tighten edge case / test)** naming one concrete edge case.
   - Call the host's structured question tool if available; otherwise end the turn with the fork.
   *Done when:* The turn ends with zero unapproved file edits for Step `K`.

## Uniform Information Density Prose (Reference)

- **One idea per sentence:** Give each sentence a single job. Split chained clauses with explicit transitions (`Because of this,`, `Otherwise,`, `For example,`).
- **Short dependencies:** Put the actor and verb inside the first 6 words, and keep sentences under 18 words.
- **Explicit connectors:** Keep optional `that`, `which`, `of`, and `for` (*"the token that the client sent"*), and break noun chains past two with prepositions (*"retry lock for payment webhooks"*).
- **Concrete actors + plain verbs:** Pair concrete actors (`we`, `the caller`, `PostgreSQL`) with everyday verbs (`save`, `check`, `reject`, `return`).
- **Given-before-new:** Open each sentence with a concept from the previous sentence before adding one new idea.
- **Thinking:** Extract core principles first, reason from first principles, and state assumptions or edge cases before acting.