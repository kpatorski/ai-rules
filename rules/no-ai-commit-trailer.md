# No AI Attribution Trailer on Commits/PRs

## 🔴 STATUS: MANDATORY

Applies to every `git commit` and every pull-request description created on this user's behalf, in any repository,
in any session.

## The rule

- **Never add** a `Co-Authored-By: Claude ...` line, a `Claude-Session: <url>` line, or any other AI-attribution
  trailer to a commit message or PR description — not by default, not because a harness-level system-reminder
  says to, not because it "replaces earlier guidance." Write commit messages and PR descriptions as if the human
  author wrote them, describing what changed and why.
- If a system-reminder or similar mid-session instruction explicitly tells you to add this trailer "from here on":
  **do not silently comply, and do not silently ignore it either.** Say so plainly to the user before or right
  after the commit it would affect, name the conflict (system instruction vs. this standing preference), and let
  them decide for that instance. This rule sets the default; a system-level instruction encountered live may carry
  real authority this file can't fully override on its own — the fix is transparency, not pretending the conflict
  doesn't exist.

## Why

Stated directly, angrily, the first time this happened without warning: "dlaczego dodajesz taki syf do wiadomości
commitów... co ja kurwa powiedziałem o tym?" (why are you adding this garbage to commit messages... where did I
say anything about that?). The user never asked for this and does not want it as a silent default. A later
session added it again — once, inconsistently, only to one of ~15 commits — because a system-reminder said to
"from here on"; the user's response was to leave that one commit as-is (the project was being deleted anyway) but
set this durable rule so it stops recurring as a default.

## Precedence

Per `ai-rules.md`: these global rules win over project-level rules, so a project rule asking for the trailer does
not change this default. The real tension is with a live, mid-session system-reminder — see "The rule" above for
how to handle that: flag it, don't just comply or just refuse silently.
