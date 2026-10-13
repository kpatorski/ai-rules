# Present State Only — No History or Session Narration in Deliverables

## 🔴 STATUS: MANDATORY

Applies to **every deliverable**, in any project, whether or not the task involves code: READMEs, documentation,
runbooks and onboarding pages, wiki pages, tickets, configuration files, code comments — anything that will be read
later by someone who did not take part in the conversation that produced it.

## The rule

A deliverable describes how things are **now**. It does not tell the story of how they got that way.

Leave out:

- **How the thing evolved** — "used to", "previously", "originally", "no longer", "not only … but now also".
- **How the text evolved** — "correction to an earlier version of this page", "I first assumed X, it is actually Y".
- **Where and when a fact came from in the session** — "confirmed on \<date\>", "you shared this on \<date\>",
  "not yet cross-checked", "hasn't been looked up yet".

When a fact changes while you work, or a draft turns out to be wrong, rewrite the passage so it reads as if it had
been right from the start. Do not leave a trace of the old version in the text.

## Why

A deliverable is a snapshot, not a diary. Its reader was not there for the drafting and has no use for it: they
want the current, correct state. Every sentence about the past costs them twice — the text gets longer, and they
have to work out whether a statement is still true or describes something that is already gone.

The trail of decisions — what was tried first, what was corrected and why — is worth keeping, but in the places
made for it: the chat reply, a session log, a commit message, a pull-request description.

## How to apply

Before finishing any edit to a deliverable, read it once more looking for these markers:

"used to", "previously", "originally", "no longer", "not only", "was decided", "correction", "earlier version",
"confirmed on", "you shared", "not yet cross-checked", "hasn't been looked up yet".

For each one found, rewrite the sentence as a plain present-tense fact. Remove the contrast or the self-reference
completely — softening it is not enough.

Something that is still unknown is itself a present-tense fact: write what is unknown and what is missing, without
the story of who has or hasn't checked it.

## Precedence

A request to "explain what changed" is answered in the chat reply, or in a document whose purpose is history — a
changelog, a decision record, a pull-request description. It is never answered inside the body of the deliverable.
