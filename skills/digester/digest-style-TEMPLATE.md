# Authoring a `digest-style`

How to write your own `digest-style.md` — the extraction process an AI tool follows to turn your requirements
prose into Given/When/Then business rules, your way. Self-contained: no other file needed to write one.

Written in **English**, whatever language you speak with the tool.

## 1. What a `digest-style` is

A structured description of how you extract business rules from prose — not a style guide, a process the tool
executes. It matches the task to a `scenario`, runs that scenario's `procedure` (an ordered `steps` list), and
stops at every `checkpoint` to confirm with you. A step may be a `loop` (repeated until a condition holds), pull
in a `heuristic`, or be governed by a `ruleset` / standalone `rule`.

## 2. Where the file lives

- `~/.claude/digest-styles/<name>.md` — a named style; filename = style id.
- `<project>/.claude/digest-style.md` — a project's own, full or `extends: <name>` + overrides.

Selection: `style=<name|path>` arg > project file > the sole global style > ask. With `extends`, a project entry
overrides the base entry of the same `id`; base-only entries are inherited. A named-but-missing style is a hard
error, not a silent skip.

## 3. The entry format

Every entry is a fenced `~~~entry` block holding a YAML record; the `###` heading above it is navigation only —
no prose outside the block, longer explanation goes in `description`.

| kind        | Purpose                                        | Key fields                                    |
|-------------|-------------------------------------------------|-----------------------------------------------|
| `scenario`  | A situation you recognise                        | `match`, `runs`, `preface-steps?`, `overrides?` |
| `procedure` | An ordered list of steps                         | `steps`, `done-when`                           |
| `loop`      | Steps repeated until a condition holds           | `steps`, `until`, `belongs-to`                 |
| `step`      | A single action                                  | `belongs-to`, `description`, `produces`, `checkpoint?` |
| `heuristic` | A decision aid a step pulls in                   | `default`, plus decision fields                |
| `ruleset`   | A named group of rules bound to steps            | `rules`, `applies-during`                      |
| `rule`      | A single constraint                              | `belongs-to`, or standalone `applies-during`   |

`belongs-to` may be a list when a step is reused across procedures. `applies-during` may name a `procedure` or
`loop` id (every step inside it) or the keyword `any` (every step, everywhere).

`checkpoint`:

```
checkpoint:
  type: ask            # ask the prompt and wait
  type: notify          # inform, don't wait — for mechanically-derived steps
  blocking: true        # must not proceed without an answer
  when: <condition>     # optional — only stop when this holds
  shows: [...]           # optional — artefacts to show first
  prompt: >
    The question to ask.
```

Forward references are allowed — a step may `use` an entry defined later in the file.

## 4. How to write yours

Don't write extraction rules in the abstract. Instead:

1. Take a real requirements document you've digested before (or would).
2. Narrate, out loud: how do you break it into pieces? What counts as one rule? Where do you stop and check your
   reading against the source, rather than guessing?
3. Distil that into a `procedure` with `checkpoint`s at exactly those stopping points.
4. Iterate with the tool, one piece at a time, until you can read the file and recognise your own process.

## 5. Skeleton to copy

```markdown
# Digest style — <your name>

## How a tool loads this

- Named styles at `~/.claude/digest-styles/<name>.md`; a project may add `<project>/.claude/digest-style.md`
  (full, or `extends: <name>` + overrides). Selection: `style=` arg > project file > sole global style > ask.
- This file is always English.

## Format

Entries are `~~~entry` YAML blocks; `###` headings are navigation only. See this guide for the full reference.

---

## Scenarios

### scenario-digest-input

~~~entry
id: scenario-digest-input
kind: scenario
title: <what this handles>
match: <when it applies>
preface-steps: [<step-id>, ...]
runs: <procedure-id>
~~~

---

## Procedures / Steps

(same shape as `coding-style` / `spec-style` — see the `Format` section above.)
```

## 6. Validation checklist

- [ ] Every `id` is unique and kebab-case.
- [ ] Every `runs` / `steps` / `uses` / `belongs-to` / `rules` id resolves to an entry that exists.
- [ ] Every `scenario` has both `match` and `runs`; every `loop` has `steps` and `until`.
- [ ] Checkpoints sit where you'd actually stop and re-check the source, not everywhere out of caution.
- [ ] The file never references an id belonging to another skill (`coding-style`, `spec-style`, …) — a
  `digest-style` must work with only `digester` installed.

Cross-reference check (same script as `coding-style-TEMPLATE.md`, pointed at this file):

```
python3 - <<'EOF'
import re
t = open('digest-style.md').read()
ids = set(re.findall(r'^id:\s*([a-z0-9-]+)\s*$', t, re.M))
bad = set()
for f in ['runs', 'belongs-to', 'uses']:
    for m in re.finditer(r'^' + f + r':\s*(.+)$', t, re.M):
        for p in re.split(r'[,\s]+', m.group(1).strip().strip('[]')):
            if re.fullmatch(r'[a-z0-9-]+', p) and not p.isdigit() and p != 'any' and p not in ids:
                bad.add((f, p))
for m in re.finditer(r'(?:steps|rules|applies-during):\s*\[([^\]]+)\]', t):
    for p in re.split(r'[,\s]+', m.group(1)):
        if p.strip() and p.strip() != 'any' and p.strip() not in ids:
            bad.add(('list', p.strip()))
print("entries:", len(ids))
print("unresolved:", sorted(bad) or "none")
EOF
```
