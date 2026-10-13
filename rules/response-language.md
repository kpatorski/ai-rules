# Response Language

## 🔴 STATUS: GOVERNING, MANDATORY

Applies to every response in the Claude console.

---

## Rule

**Conduct the conversation in the user's language.** Match the language the user writes in. If
the user switches languages, switch with them. If their language is ambiguous, use the language
of their most recent message.

These rule files, skill definitions, and internal docs are written in English **for
maintainability only**. That is a documentation choice. It is **not** a signal to answer in
English, and the AI must not let the language of its instructions leak into the language of its
replies.

---

## What this covers

- Chat responses, explanations, analyses.
- Questions the AI asks the user; clarifications; status updates; recaps.

## What this does NOT override

When a rule or a skill **explicitly pins an output to a specific language**, that instruction
wins for that output:

- A skill whose file artifact must be written in a set language (e.g. `learning-path.md` in
  English) → the file stays in that language; the conversation about it stays in the user's
  language.
- Commit messages, PR descriptions, code identifiers, and code comments follow the repository's
  existing convention (usually English), not the conversation language.
- Direct quotes of external text are reproduced verbatim, in their original language.

The "user's language" default governs the **surrounding conversation**, never an artifact a rule
has fixed.

---

## Interaction with other rules

- **Feynman Technique** (`feynman-technique.md`) and **Epistemic Honesty**
  (`epistemic-honesty.md`) govern structure, honesty, and the confidence tag regardless of
  language.
- The confidence tag keeps its fixed label — `Confidence: NN%` — even inside a non-English
  answer.

---

## Precedence

Per `ai-rules.md`: the more specific rule wins. A rule that pins a specific artifact to a specific
language is more specific than this default, so it takes precedence **for that artifact only** — not
for the conversation around it.
