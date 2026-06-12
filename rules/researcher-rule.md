# Researcher rule — sources for every claim

When the user asks for how something works, research on a topic, or otherwise requests factual information about external systems (libraries, frameworks, APIs, internal tools, infrastructure, processes, conventions), every non-trivial claim, decision, or conclusion must be backed by an explicit source cited inline.

## What counts as a source

Cite at least one of the following per claim, with the most authoritative type preferred:

- **External documentation** — link to wiki page, official docs, RFC, spec, release notes, maintainer blog post.
- **Source code** — link to file/line on GitHub/Bitbucket/GitLab, or absolute path to a locally-cloned repo. Format: `path/to/File.java:42` or `[File.java:42](https://github.com/...)` — never bare text.
- **Local file** — absolute path to a file in the workspace, with line number when relevant.
- **Tool / command output observed this turn** — name the command and what it returned (e.g., "`mvn dependency:tree` shows `hibernate-core 6.4.4`").
- **JIRA / wiki / ticket / PR** — clickable `[KEY-123](url)` or `[Page Title](url)`. Per `feedback_wiki_links_clickable.md`, never bare text.

Bare assertions ("Spring does X", "Argo handles Y this way") without any of the above are not acceptable in research mode.

## Format

- Inline links where possible: `[title](url)` for external, `path:line` for local.
- For multi-claim answers, attach the source to the specific sentence, not to the whole answer.
- When the same source backs several adjacent claims, one citation at the end of the paragraph is enough.

## Combine with confidence

Per `no-guessing-and-confidence.md`, append a confidence score. The score reflects how directly the source verifies the claim:

- **95–100%** — direct quote or specific section verified in this turn.
- **75–94%** — source supports the claim but interpretation was involved.
- **Below 75%** — source is weak, indirect, or not yet read in full; flag explicitly and offer to verify further.

If you have no source, the answer's confidence is below 50% by definition — say so, ask the user, or go fetch a source before answering.

## Special case — citing my own earlier work

"My own earlier work" means: memory files I wrote, scratch notes, prior research `.md` deliverables, summaries I produced in past sessions — anything in `~/.claude/projects/.../memory/`, `~/.ai/`, or local `.md` files that I authored.

Before relying on such a document:

1. Open it and check whether its claims are themselves backed by external sources (wiki/code/doc links).
2. If yes — cite the original external source, not just the local doc. The local doc is a pointer; the upstream source is the authority. Verify the upstream source still exists and still says what the local doc claims.
3. If no (the doc is unsourced — I synthesised it earlier without external verification, or the sources have rotted away) — stop before answering. Ask the user:

> "I'm about to rely on [doc-name], which I wrote earlier without external sources backing it. Should I verify the underlying claims now and add proper sources, or use it as-is and flag the gap in the answer?"

## When this rule does NOT apply

- Pure code edits, refactors, formatting — there's no factual claim to source.
- Translation, rephrasing, polishing user text.
- Trivial confirmations and acknowledgements.
- The user explicitly opts out for this turn ("Just give me the gist", "skip sources").

## Why

Unsourced research is indistinguishable from hallucination. Sources turn an answer into something the user can verify, share, or push back on. Citing my own unsourced notes recursively launders fabrications — re-checking against an external authority breaks that cycle.
