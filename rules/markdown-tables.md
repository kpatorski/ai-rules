# Markdown Tables — IntelliJ-clean formatting

## 🔴 STATUS: MANDATORY

Applies to **every Markdown table** written to a file or shown to the user, in any session — docs,
READMEs, research notes, code comments, PR descriptions, chat answers.

## Why

Two reasons, both pointing at the same style:

1. **User preference.** The user reads Markdown in source view with preview off, and the
   column-aligned ("many spaces") style is far more legible there. This is the wanted style in
   its own right — do not "simplify" a padded table back to single-space cells.
2. **IntelliJ.** IDEA's **"Incorrect table formatting"** Markdown inspection flags tables whose
   columns are not padded to a single consistent width per column. The user then reformats by
   hand.

The target style is exactly what IntelliJ's own table formatter produces, which is also what the
user produces by hand: **minimal** padding — each column is only as wide as its longest cell, no
extra slack, and everything in the column padded to that one width.

## The rule

1. **Every row** — header, delimiter, and each body row — **starts and ends with `|`**.
2. **Same column count** in the header, the delimiter row, and every body row.
3. **Per column, compute one width:** `1 + (length of the LONGEST cell in that column) + 1`.
   "Length" is **rendered characters as written in the source**, not UTF-8 bytes and not the
   preview-rendered text:
   - `ą ć ę ł ń ó ś ź ż`, `—`, `→ ◀ ▶`, other non-ASCII glyphs each count as **1** (they are
     multi-byte in the UTF-8 file — a byte count over-pads and breaks alignment).
   - Markdown markup counts as typed: `**PX4**` is 7, `` `arm64` `` is 8, `[x](y)` is 6.
4. **Pad every cell** in the column with trailing spaces to that width: one leading space, then
   the content, then spaces to fill. The `|` separators then line up in a straight vertical line.
5. **Delimiter row:** each column is exactly `width` `-` characters (same count as the padded
   cell width). For alignment put the colon at the dash end(s): `|:---|---:|:--:|`. No colon =
   left aligned; do not add colons unless alignment is actually wanted.
6. **Size the columns from the final set of rows, as the last step.** Common failure: writing the
   header + delimiter first, then adding a body row longer than them and not re-widening the
   column. After any edit to a table, recompute widths and re-pad the whole block.
7. **Verify, don't eyeball.** For anything past ~2 columns, check that every row's inter-`|`
   segment widths match (e.g. count them with a script) before considering the table done —
   hand-aligned wide tables are routinely off by one.
8. **Blank line before and after** the table.
9. **No indentation** before the opening `|`.
10. **Literal pipes inside a cell** are escaped as `\|`.
11. **One physical line per row.** Use `<br>` only if a break is genuinely required; never wrap a
    row across lines.

## Canonical example

Column widths here: col 1 = `1 + 15 + 1 = 17` (longest: "Control library"), col 2 =
`1 + 13 + 1 = 15` (longest: "MAVSDK-Python"), col 3 = `1 + 32 + 1 = 34` (longest:
"PX4 recommendation; DroneKit EOL").

```markdown
| Element         | Choice        | Reason                           |
|-----------------|---------------|----------------------------------|
| Autopilot       | **PX4**       | native SIH on Apple Silicon      |
| Control library | MAVSDK-Python | PX4 recommendation; DroneKit EOL |
| Rejected        | jMAVSim       | deprecated since PX4 v1.15       |
```

## Sources

- JetBrains — [Incorrect table formatting inspection](https://www.jetbrains.com/help/inspectopedia/MarkdownIncorrectTableFormatting.html)
- JetBrains YouTrack — [IDEA-292845: Markdown table "is not correctly formatted"](https://youtrack.jetbrains.com/issue/IDEA-292845/Markdown-table-is-not-correctly-formatted)
