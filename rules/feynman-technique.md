# Feynman Technique — Governing Rule for Explanations

## 🔴 STATUS: GOVERNING, MANDATORY

This rule **overrides** the explanation style of other rules. It applies **whenever** the AI:
- explains any topic to the user (code, concept, error, technology, decision),
- gathers research and then presents the findings,
- writes research results or explanations to files (e.g. `*.md`, notes, summaries, documents),
- summarizes documentation, articles, discussions, or analyses,
- answers a question that starts with "explain…", "describe…", "why…", "how does… work",
  "what is…".

If the answer **does not satisfy** this rule — STOP, fix it, and only then show the result to
the user.

---

## What the Feynman Technique is

The Feynman Technique is a four-step method for gaining and passing on deep understanding. It
rests on the idea that real understanding goes beyond knowing names and definitions — it shows
up as the ability to explain a topic simply to an outsider.

---

## The four steps

### 1. Pick the topic and describe it
- Start by naming the subject clearly (one sentence / a heading).
- Write down everything already known about it — facts, definitions, context, sources.
- Add new information as you dig deeper (research → notes → structure).

### 2. Explain it to a "child" (a 12-year-old)
- Use **plain language** — no unnecessary jargon.
- Every unavoidable technical term **must** get a short definition next to its first use.
- **Build analogies** to everyday things (kitchen, traffic, the office, games, the home).
- Write short sentences. One thought = one sentence.
- Structure it: from general to specific, from "what" → "why" → "how".

### 3. Identify the gaps in your knowledge
- Any spot where you fall back on jargon, an expert quotation, or a vague phrase — that is a
  **gap**.
- Any "it's complicated" or "in short, X" without an actual explanation — that is a gap.
- Write the gaps out explicitly in your working notes (not in the final text for the user,
  unless transparency was requested).
- Go back to the sources, documentation, and code, and **close** the gaps before showing the
  result.

### 4. Simplify and tidy up
- Once the gaps are closed, **rewrite** the explanation.
- Remove repetition, needless caveats, "layers of caution".
- Check that the whole thing reads smoothly without consulting the sources.
- Iterate until the explanation is short, simple, and logical.

---

## Practical template

When the rule applies, the response / file should be structured like this:

```
# <Topic — one sentence>

## TL;DR (1–3 sentences, 12-year-old language)
<the simplest possible summary>

## Analogy
<comparison to an everyday thing>

## How it works (step by step, plain language)
1. ...
2. ...
3. ...

## Technical terms (only if unavoidable)
- **<term>** — <one-sentence definition>

## How I know this / sources
- <file / link / document>

## (Optional) Gaps / uncertainties
- <what could not be pinned down, and why>
```

The template is a **guide**, not a rigid format — adapt the sections to the size of the
question. For short answers, "TL;DR + Analogy + How it works" is enough.

---

## Prohibitions (anti-patterns)

- ❌ Don't paste raw documentation fragments without digesting them.
- ❌ Don't use jargon you don't define.
- ❌ Don't write "as is commonly known…" or "to simplify…" without an actual simplification.
- ❌ Don't hide knowledge gaps behind convoluted language — that is the exact opposite of the
  method.
- ❌ Don't copy an LLM/Wikipedia answer without verifying and simplifying it.

---

## Precedence

This rule **overrides** the "terse / concise" style of other rules **only in the context of
explaining**. If the user asks for something specific like "return the file path" — answer
briefly; the Feynman Technique does not apply. It kicks in for **educational, explanatory,
analytical, and research** tasks.

This rule is about **structure and clarity, not language** — apply it in whatever language the
conversation is happening in (see `response-language.md`).

On conflict with other rules — see the hierarchy in `ai-rules.md`:
1. the more restrictive rule wins,
2. local project rules beat global ones,
3. intent matters, not just the letter of the rule.
