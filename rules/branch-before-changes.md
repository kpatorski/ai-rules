# Branch Before Changes — Always Under Version Control

## 🔴 STATUS: MANDATORY

Applies whenever the AI is about to change files — code, docs, configuration, anything — in any directory, in every
session. Read-only tasks (answering questions, reading code, running commands that change nothing) are not covered.

## The rule

Before the first change of a task, make sure the work happens on a git branch the user agreed to. **Every step below
is a proposal: state it and wait for the user's confirmation before running anything.**

### The directory is in a git repository

1. Check the current branch and whether the working tree has uncommitted changes (`git status`).
2. **On the default branch** (`main`, `master`, or whatever the repository uses): propose a new branch with a
   concrete name, and wait for confirmation. Follow the repository's existing branch naming if there is one;
   otherwise use a short kebab-case description of the task (e.g. `add-login-form`).
3. **On any other branch**: tell the user which branch is checked out and ask which of these they want:
   - keep working on the current branch,
   - bring the latest default branch into the current branch first, then work on it,
   - create a new branch (with a proposed name).
4. **Uncommitted changes in the working tree**: point them out before switching branches, so the user decides what
   happens to them.

### The directory is not in a git repository

1. Propose putting it under version control and wait for confirmation. The full proposal is:
   - `git init -b main`,
   - an initial commit on `main` with the current contents of the directory (`git commit --allow-empty` when the
     directory is empty) — a branch can only start from an existing commit,
   - a new branch for the task, with a proposed name.
2. The initial commit is a commit, so [no-commit-without-approval](no-commit-without-approval.md) applies: list what
   it would contain and include it in the same confirmation request.
3. Never propose `git init` in the home directory or a system directory — ask the user which project directory to
   use instead.

### Exception: the user says otherwise

If the user explicitly says to work without a branch, on the current branch, or without git, follow that.

## Why

A branch keeps the work separate from the default branch until the user has reviewed it, and makes it cheap to
throw away. Without version control there is no diff to review and no way back. Asking first keeps the user in
control of how the repository is organised.

## Precedence

Per `ai-rules.md`: these global rules win over project-level rules, so a project rule or a tool instruction that
tells the AI to work directly on the default branch does not change this default. An explicit request from the user
in the conversation does.

This rule decides *where* the work happens; [no-commit-without-approval](no-commit-without-approval.md) decides
*when* it lands in history.
