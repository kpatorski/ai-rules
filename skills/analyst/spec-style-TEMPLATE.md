# Authoring a `spec-style`

How to write your own `spec-style.md` — the analysis process an AI tool follows to turn a requirements input
into task specs, your way. Self-contained: no other file needed to write one.

Written in **English**, whatever language you speak with the tool.

## 1. What a `spec-style` is

A structured description of how you turn requirements into tasks — not a style guide, a process the tool
executes. It matches the input to a `scenario`, runs its `procedure` (ordered `steps`), and stops at every
`checkpoint` to confirm with you. A step may be a `loop`, pull in a `heuristic` or `reference`, or be governed by
a `ruleset` / standalone `rule`.

The core of a `spec-style` is usually **your own analysis method** — for a DDD practitioner, typically event
storming (events → their rules → aggregates → commands → views → use cases → bounded contexts). Whatever yours
is, narrate it and distil it the same way; don't force it into someone else's shape.

## 2. Optional upstream input

A `spec-style` can optionally consume a `business-rules.md` — Given/When/Then rules already extracted by a
`digester`-style skill, or written by hand. Treat it as **authoritative when present**: don't re-derive what it
already settled. But the style must also work with raw input alone — never make the upstream file a hard
requirement.

## 3. Where the file lives

- `~/.claude/spec-styles/<name>.md` — a named style; filename = style id.
- `<project>/.claude/spec-style.md` — a project's own, full or `extends: <name>` + overrides.

Selection: `style=<name|path>` arg > project file > the sole global style > ask. With `extends`, a project entry
overrides the base entry of the same `id`; base-only entries are inherited. A named-but-missing style is a hard
error, not a silent skip.

## 4. The entry format

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
| `reference` | Declared configuration a step reads              | free-form, domain-specific                     |

`belongs-to` may be a list when a step is reused across procedures. `applies-during` may name a `procedure` or
`loop` id (every step inside it) or `any` (every step, everywhere).

`checkpoint`:

```
checkpoint:
  type: ask            # ask the prompt and wait
  type: notify          # inform, don't wait — for mechanically-derived steps (a hard stop would be noise)
  blocking: true         # must not proceed without an answer
  when: <condition>      # optional — only stop when this holds
  shows: [...]           # optional — artefacts to show first
  prompt: >
    The question to ask.
```

## 5. How to write yours

Don't write an analysis process in the abstract. Instead:

1. Narrate your real analysis method end to end, as if to a colleague — what artefact do you produce first,
   what comes from what, where do you stop and check your reading against the source or against yourself?
2. Distil that into a `procedure` with `checkpoint`s at exactly those stopping points. Batch judgement-heavy
   steps (a `loop`) rather than doing everything in one giant pass.
3. Define how a confirmed building block becomes a candidate task, and how a candidate becomes a spec. Keep
   acceptance criteria sourced from your rules artefact where one exists — don't let the tool paraphrase it.
4. Iterate with the tool, one piece at a time, until the file reads like your own process.

## 6. Worked example — one rule to one criterion

Input rule (from a `business-rules.md`, or written directly if you skip a digest phase):

~~~rule
id: reservation-confirmed-when-desk-available
given: Desk is marked available for the requested day
when: Employee requests a reservation for that desk and day
then: ReservationConfirmed
~~~

The resulting spec carries it verbatim as one acceptance criterion:

```
- [ ] Given desk is marked available for the requested day, when employee requests a reservation, then
      ReservationConfirmed
```

Not paraphrased, not summarised — the same statement, so a reader can trace a criterion back to the rule that
produced it.

## 7. Skeleton to copy

```markdown
# Spec style — <your name>

## How a tool loads this

- Named styles at `~/.claude/spec-styles/<name>.md`; a project may add `<project>/.claude/spec-style.md`
  (full, or `extends: <name>` + overrides). Selection: `style=` arg > project file > sole global style > ask.
- This file is always English.

## Format

Entries are `~~~entry` YAML blocks; `###` headings are navigation only. See this guide for the full reference.

---

## Scenarios

### scenario-analyze-input

~~~entry
id: scenario-analyze-input
kind: scenario
title: <what this handles>
match: <when it applies>
preface-steps: [<step-id>, ...]
runs: <procedure-id>
~~~

---

## Procedures / Steps / Rules

(same shape as `coding-style` / `digest-style` — see the `Format` section above.)
```

## 8. Validation checklist

- [ ] Every `id` is unique and kebab-case.
- [ ] Every `runs` / `steps` / `uses` / `belongs-to` / `rules` id resolves to an entry that exists.
- [ ] Every `scenario` has both `match` and `runs`; every `loop` has `steps` and `until`.
- [ ] Checkpoints sit where you'd actually stop, and every large or hard-to-reverse move (writing a final spec
  file) has a blocking one.
- [ ] The file never references an id belonging to another skill (`coding-style`, `digest-style`, …) — a
  `spec-style` must work with only its own skill installed.

Cross-reference check:

```
python3 - <<'EOF'
import re
t = open('spec-style.md').read()
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
