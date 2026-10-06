---
name: refine
description: >
  Question-and-answer loop over a requirements story (markdown) during refinement. Turns the
  story into one self-contained HTML review page where text can be selected and questioned,
  each question holding a numbered thread that the developer and the business analyst both
  write in; turns a returned page back into markdown; and finally merges the agreed answers
  into the requirements text. Runs only when the user types "/refine".
argument-hint: "[help|render|extract|ingest|status] <story.md | page.html>"
disable-model-invocation: true
---

# refine

A story from the business analyst (BA) usually raises many questions. This skill keeps those questions **inside the
story file**, attached to the exact words they are about, and moves the file back and forth between two shapes:

- **markdown** — the source of truth, readable and editable by hand,
- **a review page** — one HTML file that anyone can open in a browser, with no installation and no network.

## The loop

1. `render` — story markdown becomes a review page.
2. The developer opens the page, selects text, asks questions, presses **Save**.
3. The page is sent to the BA (chat attachment, mail). The BA opens it and answers — in the threads, or by
   editing the story itself (changing, removing or adding blocks) — presses **Save**, sends the file back.
   Nobody approves anybody's edits; the page only shows what changed.
4. Steps 2–3 repeat on the same file as long as needed. A returned page can be opened and continued directly;
   no conversion is needed between rounds.
5. `extract` — the page becomes markdown again, questions and threads included.
6. `ingest` — the agreed answers are written into the requirements and the settled questions are removed.

If the BA edits the markdown outside the page and sends that back instead, `rebase` puts the older questions
onto the new text and marks what changed.

## File format

A question is a light anchor in the text plus a thread in a section at the end of the file.

```markdown
1. Given an issued <mark id="q1">invoice</mark>, when the user clicks "Download PDF", ...

<!-- refine:threads -->
## Questions

### q1 · open
1. **KP** · 2026-10-06 09:15 — Does this include corrective invoices?
2. **BA** · 2026-10-07 11:02 — No, only regular ones.
   A second line of the same message is indented by three spaces.
```

- The anchor is `<mark id="qN">…</mark>`. Ids are `q1`, `q2`, … and never reused within a file.
- Everything from the `<!-- refine:threads -->` line to the end of the file belongs to the threads.
- A thread heading is `### qN · open` or `### qN · resolved`.
- A message is `N. **author** · YYYY-MM-DD HH:MM — text`; `N` is the order in which messages were written.
- Anchors may nest. An anchor may start in plain text and end inside bold text; the page handles that.
- A plain `<mark>` without a `qN` id is ordinary story text and is left alone.

The format can be written by hand. When the user asks to add a question from the chat ("ask about X in AC 3"),
insert the anchor and the thread in exactly this shape, using the next free id, the user's name as author and the
current local time, then run `status` to confirm the file still reads correctly.

## Commands

The tool is `scripts/refine.mjs` in this skill's directory (node 18+, no dependencies):

```bash
node ~/.ai/skills/refine/scripts/refine.mjs render  <story.md>           [-o <page.html>] [--force]
node ~/.ai/skills/refine/scripts/refine.mjs extract <page.html>          [-o <story.md>]  [--force]
node ~/.ai/skills/refine/scripts/refine.mjs strip   <story.md|page.html> [-o <clean.md>]  [--force]
node ~/.ai/skills/refine/scripts/refine.mjs status  <story.md|page.html>
node ~/.ai/skills/refine/scripts/refine.mjs drop    <story.md> <qN>...
node ~/.ai/skills/refine/scripts/refine.mjs rebase  <older.md|page.html> <edited.md> [-o <page.html>] [--by <name>] [--force]
node ~/.ai/skills/refine/scripts/refine.mjs help
```

- `render` writes `<story>.html` next to the story. `extract` writes `<page>.md` next to the page.
- `strip` prints the story with every anchor and the whole threads section removed.
- `status` lists each question: id, status, line number, the questioned fragment, and all messages.
- `drop` removes the named questions (anchor and thread) from a markdown story, in place.
- `rebase` builds a page for a story that was edited outside the page. `older` is the last version that has the
  questions (markdown or page), `edited` is the new text. Questions are carried onto the new text by comparing the
  two; a thread whose words or block changed gets a `✎` note signed with `--by` (ask the user who edited the file).
  If `edited` brings its own questions, those are kept as they are. Either way the page marks every changed block.

### Never lose answers

`render` and `extract` refuse to overwrite an existing file. That refusal is the safety net: the existing file may
hold answers that exist nowhere else.

- Do not add `--force` on your own. Run `status` on both files, tell the user what each one holds, and let them
  choose — or write to a different name with `-o`.
- Never `render` over a page that came back from the BA. Open the returned page itself.

## Picking the mode

With no argument, or with `help`, do not touch any file: explain in the user's language, in a few lines, the loop
above and the modes (`render`, `extract`, `ingest`, `status`), with one example invocation of each.

When the user gives only a file, infer the mode and say which one you chose:

- a `.md` file without a returned page → `render`, then tell the user the path of the page to open,
- a `.html` file → `status` first; then `extract` if they want the markdown, or `ingest` if they say the
  discussion is finished.

## The review page

Tell the user (and give them this to pass on to the BA) how the page works:

- Type your name in the top bar once; it signs your messages.
- Highlighted text has a question. Hover to preview it, click to open the thread, click again to close it.
- To ask something new, select text and press **Ask about this**. A selection is limited to one paragraph,
  list item, heading or table cell; a wider selection is cut down to the block where it starts.
- **Resolve** marks a thread as settled (green); **Reopen** undoes that.
- To change the story, point at a paragraph, heading, table or list item: **✎** opens that block as markdown,
  **+** adds a new block below it, and **Delete block** inside the editor removes it.
- A bar on the left marks a block that was changed or added; a dashed line marks a place where a block was
  removed. Blue means "new since you last saved", grey means older. Clicking shows the previous wording, who
  changed it and when. New messages in threads carry a blue "new" tag by the same rule.
- When someone edits the words a question is about, or the block around them, the thread gets an automatic
  `✎` note ("changed the text: “old” → “new”", "edited the text around …", "removed the text: …"), so an answer
  given by editing is still tied to its question.
- **Save** (or Ctrl/⌘+S) is required — nothing is written to the file until then, and the bar shows
  "unsaved changes" meanwhile. In Chrome and Edge the first save asks which file to write and later saves go to
  that file; pick the opened file to overwrite it. In other browsers each save downloads a fresh copy — send
  that copy.
- **.md** (small button next to the theme switch) downloads the story as markdown with all questions and threads — the
  same result as `extract`, without the command line. It does not replace **Save**: the page itself still has to be
  saved to keep changes.
- **?** shows these instructions on the page itself, so the BA needs no separate explanation.
- **◐** switches between the dark and the light look.

## Change history

The record of who changed which block lives only in the page. `extract` and **.md** give the current story with
its questions and nothing else; history between markdown versions is git's job. Rendering a story again starts a
fresh history, so continue on the returned page whenever the change marks still matter.

## Ingest

Goal: a requirements file with the answers written into the text and the settled questions gone. This is the only
step that needs judgement; everything else is mechanical.

1. Get the annotated markdown. For a page, `extract` it first (see "Never lose answers").
2. Run `status`. A thread is **settled** when it is `resolved`. Report the `open` ones by id; they stay in the
   output with their anchors and threads unless the user says to ingest them too.
3. Copy the story to `<name>.refined.md` and work only on the copy. The source story is never modified.
4. For each settled thread, read the whole thread. If it contains `✎` notes, the BA has already edited the
   text: check that the current wording matches what the thread concludes and change nothing unless it does not.
   Otherwise change the text at its anchor so that it states what was agreed:
   - change as little as possible, in the story's own wording and structure;
   - write only what the thread actually settles — if a `resolved` thread ends without a usable answer, leave
     the text alone and report the thread as inconclusive;
   - when an answer adds a new rule, add it where a reader would look for it (a new acceptance criterion, not
     a footnote).
5. `drop` the ingested ids from the copy.
6. Show the result for approval before calling it done:
   - `strip` the source and the copy into two temporary files and show `git diff --no-index --word-diff`
     between them, so the diff contains requirement changes only;
   - list, per question: id, what was agreed, what changed in the text (or why nothing changed).
7. Apply corrections the user asks for, and repeat step 6 until they accept.

## Limits

- The page renders common markdown: headings, paragraphs, lists, tables, quotes, fenced code, bold, italic,
  strikethrough, inline code, links. Anything else (raw HTML blocks, images, footnotes) is shown as plain text.
  Nothing is lost either way — the page carries the original markdown untouched and gives it back on `extract`.
- A question follows its words through an edit by comparing the old and new text word by word. When the whole
  sentence around it is rewritten, the words cannot be matched: the thread is kept, gets a "removed the text"
  note, and is shown at the end of the story without a highlight.
- Two people editing separate copies of the same page at the same time produce two files that must be merged by
  hand. Pass one file back and forth.

## Changing this skill

Behaviour lives in `scripts/core.cjs` (document model and markdown layout, shared by the command line and the
page), `scripts/page.html` (the page shell) and `scripts/refine.mjs` (the command line). Tests come first:

```bash
cd ~/.ai/skills/refine && node --test tests/
```
