---
name: notion-publish
description: 'Reads BMad-generated artifacts (briefs, PRDs, addendums, architecture docs, epics/stories, reviews) from _bmad-output and publishes/updates them in Notion as clean, richly-styled documentation, without ever modifying the source files. Use when the user says "publish to Notion", "push this to Notion", "sync bmad docs to Notion", "update these in Notion", or "move this PRD/brief into Notion".'
---

# Publish BMad Artifacts to Notion

**Goal:** Turn a BMad-generated artifact into a human-readable, well-styled Notion page in the right teamspace/database — with correct properties, emoji-led sections, toggles, tables, and code blocks — while leaving the original file on disk byte-for-byte untouched.

## HARD RULES (non-negotiable)

- **Read-only source.** Only use `read_file` / `grep_search` / `file_search` / `list_dir` on anything under `_bmad-output/**` (or wherever BMad artifacts live). Never call an edit/write tool on those paths. Do not reformat, reorder, or "fix" the source file — the transformation happens only in the Notion page you create.
- **Never guess Notion schema.** Always `fetch` the destination database/page before writing properties. Property names, select options (Status, Category, etc.), and templates must come from the live fetch result, not assumption.
- **Read the markdown spec every session.** Before generating any page content, `read_file` the local copy at `.agents/skills/notion-publish/enhanced-markdown-spec` (colocated with this skill). This environment does not expose a generic MCP resource-reading tool, so the Notion `notion://docs/enhanced-markdown-spec` resource cannot be fetched directly — the local copy is the source of truth instead. Do not hallucinate Notion-flavored Markdown syntax. If the local file is missing or looks stale/incomplete, ask the user to re-attach the resource (via VS Code's Add Context → MCP Resources, or a `#`-mention) and save it back to this path before proceeding.
- **Content-preserving, not summarizing.** You are re-styling and de-cluttering BMad process scaffolding — you are not allowed to drop substantive decisions, requirements, or rationale. When unsure whether something is "scaffolding" vs. content, keep it (in a toggle if it's verbose).
- **A flat 1:1 copy-paste is a failure, not a shortcut.** If the finished Notion page is just the BMad markdown pasted in with headings promoted a level, Step 5's restructuring (callouts + emoji, toggles for secondary content, dividers, table conversion) was skipped. That is not an acceptable time-saving shortcut under any effort/size pressure — re-do the page rather than ship a wall of text.
- **Real line breaks only — never author literal `\n` as two characters.** When composing large multi-line `content`/`new_str` values for `create-pages` or `update-page`, always type genuine line breaks (actual newlines in the parameter), never the two-character escape sequence `\n` as a stand-in for compactness. Notion's Markdown parser treats a stray backslash as an escape character (see the escaped-character list in the enhanced-markdown-spec); a literal `\n` that never became a real newline renders as a bare `n` with no line break, and everything that should have been separate blocks (headings, lists) collapses into one flattened paragraph with literal `##`/`###` text. See HALT CONDITIONS and VALIDATION CHECKLIST for the required post-write check.
- **Chunk large writes.** Don't push an entire multi-thousand-word section in one `insert_content`/`update_content` call. Split by major section (roughly 2,000–4,000 characters per call) and verify each chunk rendered correctly before appending the next.

## EXECUTION 

### Step 1 — Identify the source artifact(s) and route by type

- If the user named a doc, locate it (e.g. under `_bmad-output/planning-artifacts/briefs/**`, `_bmad-output/planning-artifacts/prds/**`).
- If ambiguous, `list_dir`/`file_search` the relevant folder(s) and present the candidates for the user to pick from — don't assume which addendum or review file goes with which PRD.
- `read_file` the full contents. Never rely on partial reads for the transformation step.
- Determine the artifact type and its Notion routing target using this fixed mapping (confirmed with the user — do not change without asking):

  | BMad artifact type                      | Notion destination         | Object(s) created                                     |
  |-----------------------------------------|----------------------------|-------------------------------------------------------|
  | Brief                                   | Docs database              | 1 page, Category = Brief                              |
  | PRD                                     | Docs database              | 1 page, Category = PRD                                |
  | Architecture                            | Docs database              | 1 page, Category = Architecture                       |
  | Review / Addendum                       | Docs database              | 1 page, Category = Reviews & Addendums                |
  | Epics (from an epics-and-stories doc)   | Projects database          | 1 Project entry per epic                              |
  | Stories (from an epics-and-stories doc) | Tasks Tracker database     | 1 Task entry per story, related to its epic's Project |

  An epics-and-stories doc is **decomposed**, not published as one flat page: every epic becomes a Project, every story under it becomes a Task related to that Project. Do not drop or merge epics/stories to simplify — every epic and every story must end up as its own Notion object.

  If a single file contains **both** a Docs-type artifact (Brief/PRD/Architecture/Review) **and** an epics-and-stories section, treat them as separate artifacts: publish the Docs portion to the Docs database and decompose the epics/stories section per the rules above. Confirm this split with the user before proceeding.

### Step 2 — Gather the Notion destinations (fetch from Notion, then ask)

Check `/memories/repo/notion-destination.md` first for previously confirmed destinations for this workspace. If a saved destination already covers the current artifact type, reuse it without re-asking or re-fetching.

If no saved destination exists (or the current artifact type needs a destination not yet recorded), never ask the user to type a teamspace or database name freeform — always fetch the live options first:

1. Use the Notion `search`/`fetch` tools to list the teamspaces available to the connected account. Present the list to the user and ask them to pick one — never assume or silently pick the first result.
2. Once a teamspace is chosen, `search`/`fetch` the databases inside it and present that list to the user, framed by what the current artifact type needs:
   - Brief/PRD/Architecture/Review/Addendum → ask the user to pick the **Docs database** from the listed options.
   - Epics → ask the user to pick the **Projects database** from the listed options.
   - Stories → ask the user to pick the **Tasks Tracker database** from the listed options, then `fetch` its schema and ask which relation property links a Task to a Project.
3. `fetch` each chosen database to get its live schema: property names, select/status options, relation properties, and any page templates.
4. Ask whether each resolved destination should be saved as the default for future BMad docs from this repo (recommended: yes) — if so, save it to `/memories/repo/notion-destination.md` after confirming.

If multiple teamspaces or databases share the same name, list them with distinguishing detail (e.g. parent page, id) and ask the user to disambiguate — never pick the first result silently.

### Step 3 — Apply the taxonomy mapping

Use this confirmed mapping (already agreed with the user for this workspace — reuse it, don't re-ask unless a new artifact type shows up or the user corrects it):

- **Category** (Docs database only): Brief → "Brief", PRD → "PRD", Architecture → "Architecture", Review/Addendum → "Reviews & Addendums". Epics and Stories do not use the Docs database's Category property at all — they route to the Projects/Tasks Tracker databases instead (Step 1).
- **Status derivation** (Docs database pages only — Epics/Stories skip this and use Step 6's Projects/Tasks Tracker mapping instead). Use this decision table, in order:

  | Condition                                                                 | Status action        |
  |----------------------------------------------------------------------------|-----------------------|
  | User explicitly said to finalize this doc                                  | Set "Published"       |
  | A `review-adversarial-general.md`, `review-edge-case-hunter.md`, or similarly named review file sits alongside the source doc **and** contains unchecked checklist items (`- [ ]`) or no explicit "RESOLVED" marker | Set "In Review"       |
  | No sibling review file is present                                          | Set "Draft"           |
  | Ambiguous (e.g. review file exists but its resolved/unresolved state can't be determined from the above rule) | Ask the user, don't guess |
- **Author**: default to the Notion account's own user unless told otherwise.
- **Projects (from Epics)** and **Tasks (from Stories)**: map whatever status/priority-like fields the epic/story text implies onto the live schema's actual options (fetched in Step 2) — ask if a story's status can't be confidently inferred.

### Step 4 — Check for an existing page (avoid duplicates, enable updates)

Search the destination database for a page whose title matches the source doc's title (for epics/stories, match each epic's/story's own title against the Projects/Tasks Tracker database).

- **Exactly one match found** → this is an update pass, not a duplicate. Continue to Step 5, then run the diff pass in Step 6 and update that page in place. BMad docs and epic/story states are expected to change as work continues, so update-in-place is the default — do not ask the user to choose between update and new every time.
- **No match found** → this is a new page; continue to Step 5 and create it in Step 8.
- **Multiple matches found** → HALT and ask the user which existing page (if any) to update, rather than guessing.

Never silently create a duplicate page for a doc/epic/story that already has one, and never silently overwrite an existing page without running the Step 6 diff pass first.

### Step 5 — Transform BMad Markdown → Notion Markdown

Strip only process scaffolding, never substance:

- Remove BMad HTML comments, elicitation/workflow instructions, agent routing metadata, raw frontmatter blocks, and internal step numbering that only makes sense inside the BMad tool.
- Collapse redundant BMad boilerplate headers (e.g. repeated "Status: Draft" banners) into the Notion page property instead of inline text.

Re-structure for Notion:

- The doc's H1 becomes the page **title** property — do not repeat it as an in-body heading.
- Each major H2 section becomes a **callout block** with a heading and a matched emoji (see table below) — mirrors the target style: clear visual separation per section, not a wall of plain headings.
- Secondary or reference-only material (detailed rationale, review appendices, raw checklists, superseded alternatives) that exceeds ~5 bullet points or ~150 words goes in a **toggle block** (`<details><summary>...</summary>...</details>`) so the page stays scannable, with nothing substantive deleted.
- Markdown tables → Notion tables (preserve column meaning; don't drop rows).
- Fenced code blocks → Notion code blocks, preserving the language tag exactly (` ```ts `, ` ```sql `, ` ```json `, etc.) so syntax highlighting is correct. Never flatten code into plain paragraphs.
- Checklists (`- [ ]` / `- [x]`) → Notion to-do blocks, keeping checked state.
- Use dividers between major sections for the "clear separation" look shown in the reference database.
- This restructuring is mandatory for every page, regardless of source doc length — do not fall back to pasting the source markdown near-verbatim (with only heading-level promotion and table conversion) just because the doc is long or the session is running long. A long doc needs *more* toggles/callouts, not fewer.

**Emoji guide for common BMad section names** (use judgment for headings not listed — pick the closest semantic match, stay consistent within one page):

| Section heading (or synonym)          | Emoji |
|----------------------------------------|:-----:|
| Overview / Executive Summary           | 🎯 |
| Goals / Objectives                     | 📋 |
| Background / Context                   | 📚 |
| Problem Statement                      | ❗ |
| Technical Details / Implementation     | 🔧 |
| Architecture / Design                  | 🏗️ |
| Performance Considerations             | ⚡ |
| Testing Strategy / QA                  | ✏️ |
| Risks / Assumptions                    | ⚠️ |
| Non-Goals / Out of Scope               | 🚫 |
| Open Questions                         | ❓ |
| Timeline / Milestones                  | 📅 |
| Metrics / Success Criteria             | 📊 |
| Glossary / Definitions                 | 📖 |
| Decisions / Rationale                  | 🧭 |
| Stakeholders                           | 👥 |
| Dependencies                           | 🔗 |
| Appendix / References                  | 📎 |

### Step 6 — Diff pass for updates (existing pages only)

Skip this step entirely when Step 4 found no existing page — new pages don't need a diff. When an existing page was found:

- Fetch the existing Notion page's full current content and properties via `fetch`/`notion-fetch` before writing anything.
- Compare the existing page against the freshly transformed content from Step 5, section by section (matching by callout/section heading), to identify: sections that changed, sections newly added, sections removed from the source (never delete substantive Notion content without confirming — see HARD RULES), and, for Projects/Tasks, any change in the epic's/story's status, priority, or other tracked property versus what's currently set in Notion.
- **Delegate this diff computation to a subagent running a smaller/cheaper model** (e.g. Haiku, Gemini Flash, or a GPT mini-class model) — comparing old vs. new text and summarizing changes is low-complexity and doesn't need the primary model's full reasoning budget. Give the subagent the existing page content and the newly transformed content, and have it return: (1) a structured list of added/changed/removed sections, (2) any epic/story status or property transitions detected, and (3) a short human-readable changelog line. The primary session applies the result. If subagent delegation is not available in the current environment, the primary model should perform the diff itself. Subagent delegation is an optimization, not a requirement.
- Apply the diff via `notion-update-page`: update only the sections/blocks that changed, update any changed properties (Status, epic/story progress, etc.), and append a **timestamped changelog entry** (current date/time plus a one-line summary, e.g. "2026-07-10 — Story status: To Do → In Progress; Acceptance Criteria section updated") to a "Change Log" toggle at the bottom of the page. Never delete prior changelog entries.
- If the diff can't confidently map old sections to new ones (e.g. the source was restructured wholesale), HALT and ask the user whether to do a full content replace or a manual reconciliation.

### Step 7 — Set properties from the live schema

Map only to property names/options confirmed in Step 2/3.

- **Docs database pages** (Brief/PRD/Architecture/Review/Addendum): Title → doc's H1; Author → confirmed user; Status → Step 3 derivation; Category → Step 3 mapping. Leave Created/Last edited time to Notion's built-in behavior unless the property is a plain date field.
- **Projects database entries** (from Epics): Title → epic title/summary; fill any other Projects properties (owner, status, etc.) using the live schema fetched in Step 2, asking if a value can't be confidently inferred.
- **Tasks Tracker entries** (from Stories): Title → story title; set the relation property (confirmed in Step 2) to the matching Project page created for that story's parent epic; fill remaining Task properties from the live schema, asking if unclear.

### Step 8 — Create (or update) the page(s)

- Use `notion-create-pages` with the resolved `data_source_id` as parent, the page icon set to the emoji matching the doc's primary type (e.g. 📄 for a PRD, 📝 for a brief, 🗂️ for a Project/epic, ✅ for a Task/story), and the transformed content.
- If Step 4 found an existing page to update instead, use `notion-update-page` on that page with the diffed changes from Step 6 rather than creating a new one.
- For an epics-and-stories doc: create all Project pages for the epics first, then create the Task pages for their stories so the relation property can point at an already-existing Project page. Before creating Project pages for epics, perform the same duplicate check described in Step 4 against the Projects database. If a matching Project page already exists for an epic, reuse it for the Task relation rather than creating a new one.
- **Chunk, then verify each chunk.** For any page whose content exceeds roughly 4,000 characters, split the write into multiple `create-pages`/`insert_content` calls (per major section) rather than one giant call. After each call that wrote more than ~2,000 characters, run a spot-check — either `notion-fetch` the page or a `notion-search` scoped to that `page_url` with a query drawn from text you just wrote — and confirm the returned snippet reads as clean prose with real headings, not literal `##`/`###`/`\n`/`n`-run artifacts. If corruption is found, redo that chunk with real line breaks before writing the next one or reporting completion.

### Step 9 — Report back

Give the user:
- The Notion page link.
- A short summary of what was stripped (scaffolding only) vs. restructured.
- Any taxonomy/status assumptions made, so they can correct them next time.
- For updates: the timestamped changelog entry that was appended and any epic/story status transitions that were reflected.

## HALT CONDITIONS

- Can't find the named source artifact, or multiple candidates match → list them and ask.
- Can't resolve the teamspace/database, or multiple matches → list them and ask.
- Property schema fetch fails or a needed option doesn't exist → ask the user how to proceed; never invent a property name or option value.
- Multiple existing pages match the same source title → list them and ask which one (if any) to update.
- Any point where the transformation would require deleting substantive content (not scaffolding) to "fit" Notion's style → keep the content in a toggle instead of dropping it, and mention this in the final report.
- An epic's stories can't be unambiguously parsed (e.g. unclear which epic a story belongs to) → ask rather than guessing the Project relation.
- The local `.agents/skills/notion-publish/enhanced-markdown-spec` file is missing → stop and ask the user to attach/save the spec to that path (this environment cannot fetch the `notion://docs/enhanced-markdown-spec` MCP resource directly); do not proceed with page generation using guessed syntax.
- The Step 6 diff pass can't confidently map existing Notion content to the newly transformed content (e.g. wholesale restructuring) → ask whether to do a full replace or a manual reconciliation.
- A post-write spot-check (Step 8) shows literal Markdown syntax or `n`-run artifacts instead of rendered blocks → the write was corrupted (almost always caused by authoring literal `\n` instead of real line breaks); stop reporting success, redo that chunk with real line breaks, and re-verify before continuing.
- `replace_content` reports it would delete existing child pages/databases → do not set `allow_deleting_content: true` reflexively. First re-check that every existing child page/database is represented with a `<page url="...">`/`<database url="...">` tag on its own line (not folded into a paragraph by the same literal-`\n` mistake above); only ask the user for explicit confirmation if deletion is actually intended.

## VALIDATION CHECKLIST

- [ ] Source file on disk is byte-for-byte unchanged (no write/edit tool used on it).
- [ ] Notion schema was freshly fetched, not assumed.
- [ ] `.agents/skills/notion-publish/enhanced-markdown-spec` was read this session before generating content.
- [ ] Large content was chunked (~2,000–4,000 chars per write) and each chunk was spot-checked (fetch or page-scoped search) to confirm real rendered blocks, not literal `##`/`\n`/`n`-run artifacts.
- [ ] The finished page is NOT a flat 1:1 copy of the source markdown — every major section has a matched emoji + callout, with dividers between sections, and secondary/reference material is in toggles.
- [ ] Code blocks kept their language tag and exact content.
- [ ] Tables and checklists converted to native Notion blocks, not flattened to text.
- [ ] No BMad tool scaffolding (HTML comments, elicitation prompts, agent metadata) leaked into the Notion page.
- [ ] Properties match the destination schema's actual names/options exactly.
- [ ] Duplicate check was performed before creating a new page.
- [ ] For epics/stories: every epic became a Project and every story became a Task correctly related to its epic's Project — none dropped or merged.
- [ ] For updates to an existing page: the Step 6 diff pass ran against the live page content before writing, and a timestamped changelog entry was appended (not overwritten).
- [ ] Epic/story status or property transitions detected in the diff were reflected in both the Notion property and the changelog entry.
- [ ] Page link(s) returned to the user with a short mapping summary.
