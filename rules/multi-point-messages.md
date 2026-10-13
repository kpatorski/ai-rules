# Multi-Point Messages — Line-Broken, Not a Wall of Text

## 🔴 STATUS: MANDATORY

Applies to **every message or question sent to the user** that carries more than one distinct point — chat
replies, `AskUserQuestion` question text, checkpoint prompts in any tool or skill, status updates, summaries.

## The rule

- If a message covers more than one distinct point — numbered facts, several options, several decisions bundled
  into one ask, a status update touching more than one thing — put **each point on its own line** (a short
  paragraph break, a numbered list, or a bulleted list). Never pack multiple distinct points into one dense,
  run-on paragraph.
- This applies inside tool fields too, not just free chat text — an `AskUserQuestion` `question` string with three
  clauses joined by semicolons/dashes is exactly the failure this rule targets, not an exception to it. If the
  tool field itself won't render line breaks usefully, put the line-broken version in a lead-in chat message
  before the tool call instead of cramming it into the field.
- A single, simple point stays a single sentence — this rule is about **density of distinct points**, not about
  forcing structure onto short messages that don't need it.
- Re-check this *every time* a message is about to be sent, not once per session — a rule remembered in the
  abstract and not applied to the concrete message about to go out is the same failure as not having the rule.

## Why

Messages are often read in a narrow terminal or chat pane. Several distinct points run together in one paragraph are
hard to parse at a glance and easy to skim past — a decision buried mid-paragraph gets missed, and the user ends up
answering only part of what was asked. The failure also recurs: it is easy to fix one message after a correction
and pack the very next one just as densely, which is why the rule asks for a check before every message rather
than once per session.

## Precedence

Per `ai-rules.md`: the more specific rule wins where they overlap. [markdown-line-length.md](markdown-line-length.md)
governs wrapping width for `.md` files; this rule governs point-per-line structure for messages and questions sent
to the user, in any surface. They address different things and don't conflict.
