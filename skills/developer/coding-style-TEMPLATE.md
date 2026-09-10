# Authoring a `coding-style`

How to write your own `coding-style.md` — the file an AI coding tool reads to work the way *you* work. This guide is
the format reference, the authoring method, and a copy-paste skeleton in one.

The file you produce is always written in **English**, whatever language you speak with the tool. It is not tied to
any language or framework: this guide shows a Java example and a Python example built from the exact same format.

---

## 1. What a `coding-style` is

A `coding-style` is a structured description of your working process — not a style guide of prose rules. The tool
reads it and executes it:

1. It matches the task in front of you to a **`scenario`** (`match` field).
2. It runs that scenario's **`procedure`** — an ordered list of **`step`s**.
3. A step may pull in a **`loop`**, a decision **`heuristic`**, a **`ruleset`**, or a **`reference`**.
4. Wherever a step carries a **`checkpoint`**, the tool stops and talks to you.

The whole point is the checkpoints: the tool advances in small moves and confirms direction with you, instead of
producing a wall of code you review after the fact. You decide where the stops are — that is the main thing you are
authoring.

---

## 2. Where the file lives

You can keep **several named styles** — one per language, or several per language with different approaches:

- `~/.claude/coding-styles/<name>.md` — each named style (filename = style id, e.g. `java-ddd`, `java-lean`,
  `python`).
- `<project>/.claude/coding-style.md` — a project's own style. Either a full one, or a thin file that names a base
  and layers on top:

  ```
  extends: java-ddd
  ```

  then just the `~~~entry` blocks this project overrides or adds.

**Selection order:** (1) `style=<name|path>` on the run wins; (2) the project file, if present; (3) the sole global
style, if there is only one; (4) otherwise the tool lists the styles and asks. **Merge:** with `extends`, a project
entry overrides the base entry of the same `id`; base-only entries are inherited. A named-but-missing style fails
hard rather than being skipped.

Each style is one file. Every entry has a stable `### <id>` anchor under a `## <kind>` section, so a tool can load
the whole file or just the entries a scenario needs.

---

## 3. The entry format

Every entry is a fenced `~~~entry` block holding a YAML record. The `###` heading above it is navigation only. There
is no prose outside the block — longer explanation goes in `description`.

### Kinds

| kind        | Purpose                                        | Key fields                                             |
|-------------|------------------------------------------------|-------------------------------------------------------|
| `scenario`  | A situation you recognise and how to handle it | `match`, `runs`, `preface-steps?`, `overrides?`        |
| `procedure` | An ordered list of steps                       | `steps`, `done-when`                                   |
| `loop`      | Steps repeated until a condition holds         | `steps`, `until`, `belongs-to`                         |
| `step`      | A single action                                | `belongs-to`, `description`, `produces`, `checkpoint?` |
| `heuristic` | A decision aid a step pulls in                 | `default`, plus decision fields                        |
| `ruleset`   | A named group of rules bound to steps          | `rules`, `applies-during`                              |
| `rule`      | A single constraint                            | `belongs-to`, or standalone `applies-during`           |
| `reference` | Declared configuration a step reads            | free-form, domain-specific                             |

### Common fields

`id` (kebab-case, unique, stable) · `kind` · `title` · `description` (block scalar, the "why") · `input` ·
`produces` · `uses` (id or list of ids this entry depends on) · `checkpoint`.

Rules use whatever conditional keys they need — `must`, `unless`, `when`, `then`, `default`, `exception`,
`forbidden`, `allowed`, `example`. There is no fixed rule template; keep each rule to the keys it actually needs.

### `checkpoint`

```
checkpoint:
  type: ask            # ask the prompt and wait
  blocking: true       # must not proceed without an answer
  when: <condition>    # optional — only stop when this holds
  shows: [test-diff]   # optional — artefacts to put in front of the developer
  prompt: >
    The question to ask.
```

### `overrides` (on a `scenario`)

A map of `entry-id: how this scenario changes it` — skip a step, force its outcome, relax a rule. Read before the
procedure runs. Lets one procedure serve several scenarios.

```
overrides:
  decide-test-level: forced to util-unit-suite — skip the question
  test-naming: the method-name exception applies
```

### Forward references

Allowed — a step may `use` an entry defined later in the file.

---

## 4. How to write yours

Do **not** sit down and write rules in the abstract. That produces slop you will have to read back and discard.
Instead:

1. **List the situations you actually handle.** Three to six real ones: "add a use case", "fix a bug", "backfill
   missing tests", "start a new module". These become your `scenario` entries.
2. **Narrate one, out loud, as if to a colleague.** What do you do first? Then what? Where do you stop and think?
   Where would you *want* a tool to stop and ask you?
3. **Distil that narration** into a `procedure` (ordered `steps`) plus the `checkpoint`s at the points where you
   said "I stop here".
4. **Pull shared things out.** A decision you make the same way every time → a `heuristic`. A set of constraints you
   apply while writing tests → a `ruleset`. Config you assume → a `reference`.
5. **Do this in a loop with the tool**, one situation at a time. Draft an entry, read it, correct it, accept it,
   move on. Keep a small progress file listing each section as `draft` / `accepted` so the work survives across
   sessions.
6. **Stop when you can read the file top to bottom and recognise your own process.**

Guidance for the entries themselves:

- Checkpoints are the product. Put one wherever you would not want the tool to continue without your say-so. A
  `blocking` checkpoint before any large or hard-to-reverse move.
- Keep `description` to the *why*; the *what* is the structured fields.
- Name steps for the action (`enumerate-test-cases`), scenarios for the situation (`scenario-new-use-case`).
- Tag stack-specific entries (e.g. `stack: jvm`) so a reader knows what is portable.

---

## 5. Worked examples

### A Java step with a checkpoint (from a real `coding-style.md`)

~~~entry
id: enumerate-test-cases
kind: step
belongs-to: tdd-loop
title: List every known test case as a failing stub
description: >
  Write down every business case discovered so far as an empty, failing stub — a titled test that just fails. The
  title states the scenario in the product owner's language. Nothing is implemented yet; the goal is a complete map
  of what the suite must prove.
produces: one failing stub per known business case, no bodies
example: |
  def "event is published if reservation succeed"() {
    expect:
    false
  }
checkpoint:
  type: ask
  blocking: true
  prompt: >
    Here is the full list of test cases. Complete and correct — anything to add, drop, or rename?
~~~

### The same format, a Python project

~~~entry
id: scenario-add-endpoint
kind: scenario
title: Add an endpoint to an existing FastAPI service
match: task is to add a new route to a service that already has routes
preface-steps: [locate-router, confirm-schema]
runs: tdd-loop
~~~

~~~entry
id: type-checks-clean
kind: rule
belongs-to: python-quality
title: mypy and ruff pass before a step is done
must:
  - mypy --strict reports no error in the touched package
  - ruff check passes with the project config, no per-line ignores added to force it
applies-during: [cover-batch, refactor-production]
~~~

---

## 6. Skeleton to copy

A minimal one-scenario style. Save it as `~/.claude/coding-styles/<name>.md`, fill it in, add scenarios as you go.

```markdown
# Coding style — <your name>

A structured description of how I work with code, meant to be read and executed by an AI tool.

## How a tool loads this

- Named styles live at `~/.claude/coding-styles/<name>.md`; a project may add its own at
  `<project>/.claude/coding-style.md` (a full style, or `extends: <name>` + overriding entries).
- Selection: `style=<name|path>` arg > project file > the sole global style > ask.
- With `extends`, a project entry overrides the base entry of the same `id`; base-only entries are inherited.
- This file is always English. The tool speaks my language; the file stays English.

## Format

Entries are `~~~entry` YAML blocks. `###` headings are navigation. See the authoring guide for the full kind/field
reference.

---

## Scenarios

### scenario-<situation>

~~~entry
id: scenario-<situation>
kind: scenario
title: <the situation in one line>
match: <when this scenario applies>
preface-steps: [<step-id>, ...]
runs: <procedure-id>
~~~

---

## Procedures

### <procedure-id>

~~~entry
id: <procedure-id>
kind: procedure
title: <name>
steps: [<step-id>, <step-id>, ...]
done-when: <the finish condition>
~~~

---

## Steps

### <step-id>

~~~entry
id: <step-id>
kind: step
belongs-to: <procedure-id>
title: <action>
description: >
  <why this step exists>
produces: <what it leaves behind>
checkpoint:
  type: ask
  blocking: true
  prompt: >
    <what to ask before continuing>
~~~
```

---

## 7. Validation checklist

Before you rely on the file:

- [ ] Every `id` is unique and kebab-case.
- [ ] Every `runs`, `steps`, `uses`, `belongs-to`, `rules` id resolves to an entry that exists.
- [ ] Every `scenario` has both `match` and `runs`.
- [ ] Every `loop` has `steps` and `until`.
- [ ] Checkpoints sit where you actually pause — and before every large or hard-to-reverse move.
- [ ] You can read the file top to bottom and recognise your own process.

A quick cross-reference check:

```
python3 - <<'EOF'
import re
t = open('coding-style.md').read()
ids = set(re.findall(r'^id:\s*([a-z0-9-]+)\s*$', t, re.M))
bad = set()
for f in ['runs', 'belongs-to', 'uses']:
    for m in re.finditer(r'^' + f + r':\s*(.+)$', t, re.M):
        for p in re.split(r'[,\s]+', m.group(1).strip().strip('[]')):
            if re.fullmatch(r'[a-z0-9-]+', p) and not p.isdigit() and p not in ids:
                bad.add((f, p))
for m in re.finditer(r'(?:steps|rules):\s*\[([^\]]+)\]', t):
    for p in re.split(r'[,\s]+', m.group(1)):
        if p.strip() and p.strip() not in ids:
            bad.add(('list', p.strip()))
print("entries:", len(ids))
print("unresolved:", sorted(bad) or "none")
EOF
```
