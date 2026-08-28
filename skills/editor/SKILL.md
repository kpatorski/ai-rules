---
name: editor
description: >
  Drafts a message (e.g. email, note, announcement) based on optional parameters: receiver,
  tone, topic (subject of the message), language (default eng), details-level (expanded /
  concise / short / default), and output (a file path to save the message to — the message is
  always printed to the console regardless). Trigger: "/editor", "write a message", "draft an
  email", "compose a message".
argument-hint: "[receiver=... tone=... topic=... language=eng|pol|de... details-level=... output=path]"
---

# editor

A skill for drafting messages (email, announcement, note, etc.) from a set of optional parameters supplied by the user.

## Parameters (all optional)

| Parameter        | Meaning                                                                    | Default                                                     |
|------------------|---------------------------------------------------------------------------|------------------------------------------------------------|
| `receiver`       | Recipient of the message (name, role, company — whatever the user gave)   | none — generic/neutral addressee                           |
| `tone`           | Tone of the message (e.g. formal, friendly, firm, apologetic, sales)     | neutral/professional                                       |
| `topic`          | Topic / purpose of the message                                            | if missing — ask the user what the message should be about |
| `language`       | Language of the message: `eng`, `pol`, `de`, or another language code/name | `eng`                                                      |
| `details-level`  | Length and level of detail: `expanded`, `concise`, `short`, or default    | default (medium length, a couple of paragraphs)            |
| `output`         | File path to save the message to                                          | none — do not write to a file                              |

## Parsing the input

The user may supply parameters:

- as `key=value` after the skill name (e.g. `/editor receiver="John Smith" tone=formal topic="vacation request"`),
- or descriptively in natural language in the same message — in that case infer the values from context.

Rules:

- Keys are case-insensitive; also accept underscore variants (`details_level`) or no-hyphen variants.
- Values may be quoted (for values containing spaces) or unquoted.
- If a parameter is not provided at all, apply the default from the table above. Do not ask the user about parameters
  that have a sensible default (`language`, `details-level`, `tone`, `output`).
- The only parameter worth clarifying — if it genuinely cannot be inferred from the conversation — is `topic`: without a
  topic there's no sensible message to write. If the topic can be inferred from context (e.g. the user already described
  earlier what they want to write about), do not ask — just use that context.

## `details-level` mapping

- **`expanded`** — full structure (greeting, several body paragraphs developing the topic, concrete arguments/examples,
  closing), more than one body paragraph.
- **`concise`** — short and to the point, no filler, at most one body paragraph.
- **`short`** — a few sentences, bare minimum (e.g. for an SMS, Slack message, or short note).
- **default** (no parameter given) — standard business-message length: greeting, 1-2 body paragraphs, closing — not
  overly elaborate, but complete.

## `language` mapping

- `eng` → English (default).
- `pol` → Polish.
- `de` → German.
- Any other code/language name the user provides → use that language if recognized. If the code is ambiguous or
  unrecognized, ask the user which language they mean instead of guessing.

## Building the message

1. Determine the receiver (`receiver`), tone (`tone`), topic (`topic`), language (`language`), and details level
   (`details-level`) per the rules above.
2. Write the message in the chosen language, with an appropriate greeting/salutation for the recipient (if `receiver`
   was given — address the message directly to them, matching the tone and language; if not given — use a neutral header
   without a specific addressee, e.g. "Dear [Recipient]," / "To whom it may concern,").
3. Keep the tone consistent throughout the message.
4. Adjust length and level of detail to match `details-level`.
5. Do not add an "AI-generated" disclaimer — this should be a ready-to-send message.

## Output

- **Always** print the full message text in Claude's console response, regardless of whether
  `output` was provided.
- If `output` is provided, save the message content to that file path (use the Write tool). If the file already exists,
  read it first, then overwrite it (required by the Write tool). After saving, briefly confirm the file path.
- If `output` is not provided, do not create any file — just print the message to the console.

## Example invocation

```
/editor receiver="Anna Smith" tone=formal topic="rescheduling the meeting" language=eng details-level=concise output=./message.txt
```

Result: a short, formal message in English to Anna Smith about rescheduling the meeting, printed to the console **and**
saved to `./message.txt`.
