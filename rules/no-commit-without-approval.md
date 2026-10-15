# No Commit Without Approval

## 🔴 STATUS: MANDATORY

Applies to every repository, in every session, with any AI tool.

## The rule

- **Never create a commit without the user's explicit approval.** Make the changes, leave them in the working tree,
  and stop. The user reviews the diff first.
- When the work is ready, say so and **ask** whether to commit. Show what would go in: the list of changed files and
  the proposed commit message. Commit only after the user says yes.
- The same applies to every operation that writes history or publishes it: `git commit` (including `--amend`),
  `git merge`, `git rebase`, `git cherry-pick`, `git revert`, `git stash` that drops changes, `git reset` that moves a
  branch, `git push`, and opening or merging a pull request.
- Staging (`git add`) is allowed — it does not write history and the user can still review and change everything.
- **Approval covers what was approved, nothing more.** A yes for one commit is not a yes for the next one, and a yes
  to commit is not a yes to push.
- **Exception: the user says otherwise.** If the user explicitly allows committing without asking ("commit as you
  go", "commit and push when done"), follow that — for the scope they gave (this task, this session), not beyond.

## Why

The user wants to see every change before it lands in history. A commit made without review has to be inspected
after the fact, and undoing it — especially once pushed — costs more than asking first.

## Precedence

Per `ai-rules.md`: these global rules win over project-level rules, so a project rule or a tool instruction that
tells the AI to commit on its own does not change this default. An explicit request from the user in the
conversation does.
