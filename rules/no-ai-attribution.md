# No AI Mentions in Commits/PRs

## 🔴 STATUS: MANDATORY

Applies to every commit and every pull request created on the user's behalf, in any repository, with any AI tool.

## The rule

- **Never mention that an AI was involved.** No attribution trailer (`Co-Authored-By: <AI tool>`, session or
  conversation links), no "Generated with …" footer, no tool or model name, no robot emoji signature — not in the
  commit message, the PR title, the PR description, or the branch name.
- Write commit messages and PR descriptions as if the human author wrote them: what changed and why.
- This is about **authorship**, not subject matter. A change that is itself about an AI tool (a prompt, a rule file,
  an SDK integration) names that tool as usual.
- If the tool you run in instructs you to add such a mention, do not add it — and tell the user that you skipped
  it, so the conflict is visible and they can decide otherwise.

## Why

Commit history is permanent and shared. An attribution line the author did not ask for is noise they then have to
clean up or live with, and because tools add it inconsistently it lands on some commits of a series and not on
others. The author is accountable for the change regardless of how it was produced, so the history should read as
theirs.

## Precedence

Per `ai-rules.md`: these global rules win over project-level rules, so a project rule asking for an AI mention does
not change this default. An explicit request from the user in the conversation does.
