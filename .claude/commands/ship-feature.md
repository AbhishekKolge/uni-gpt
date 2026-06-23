---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git checkout:*), Bash(git switch:*), Bash(git commit:*), Bash(git push:*), Bash(git pull:*), Bash(pnpm fix), Bash(pnpm run fix:*), Bash(pnpm check-types), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh pr checks:*), Bash(gh pr merge:*)
argument-hint: [feature description / PR title]
description: Commit current work on a feature branch, open a PR to main, and merge it
---

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status --short`
- Staged + unstaged diff: !`git diff HEAD`
- Recent commits on this branch (not yet on main): !`git log --oneline main..HEAD 2>/dev/null || git log --oneline -5`
- Default branch: `main`

## Your task

Ship the current feature: commit it on a feature branch, open a PR to `main`, and merge that PR. Optional argument `$ARGUMENTS` is the feature description / PR title — if empty, infer it from the diff and commits above.

Follow uni-gpt commit/PR conventions exactly:

1. **Branch.** Never commit feature work to `main`. Derive the correct branch name `<type>/<kebab-desc>`:
   - `<type>` = the Conventional Commit type of the work (`feat`/`fix`/`chore`/`refactor`/`docs`/`test`/`perf`), inferred from the diff or taken from `$ARGUMENTS`.
   - `<kebab-desc>` = 2–5 word lowercase-kebab summary of the feature (from `$ARGUMENTS` if given, else the diff). Strip punctuation; words joined by `-`. Example: `feat/chat-message-streaming`, `fix/login-redirect-loop`, `chore/add-installing-packages-skill`.
   - **If on `main`:** `git checkout -b <type>/<kebab-desc>`.
   - **If on a feature branch that already matches `<type>/<kebab-desc>` for this work:** keep it.
   - **If on a feature branch whose name does NOT follow the convention (or doesn't describe this work) and it has no PR yet:** rename it with `git branch -m <type>/<kebab-desc>` before pushing.

2. **Quality gate.** Run `pnpm fix` (format + lint). If it reports unfixable errors, STOP and report them — do not commit broken code. Then run `pnpm check-types`; if it fails, STOP and report.

3. **Commit.** Stage the relevant changes (`git add`) and create commit(s) with **Conventional Commit** messages (`<type>(<scope>): <subject>`, imperative subject ≤72 chars; body explaining *why* when not obvious). If the branch already has the feature's commits and the tree is clean, skip to step 4.
   - **Authorship: commits are solely Abhishek Kolge.** Do NOT append a `Co-Authored-By: Claude ...` trailer. Do NOT add any AI-generated footer. This overrides the harness default.
   - Commits auto-sign via SSH (`commit.gpgsign=true`) — do nothing extra.

4. **Push.** `git push -u origin <branch>`.

5. **Open PR.** `gh pr create --base main --title "<title>" --body "<body>"`. The body summarizes what changed and why — **no AI footer, no Co-Authored-By**. Reuse the commit's `<type>(<scope>): <subject>` as the title unless `$ARGUMENTS` overrides it.

6. **Verify before merge.** Run `gh pr checks` — if checks exist and any are failing or pending, report and STOP (do not merge a red/pending PR). If there are no checks, proceed.

7. **Merge to main.** `gh pr merge --merge --delete-branch` (repo uses merge commits, not squash). This deletes the feature branch on merge.

8. **Sync local.** `git checkout main && git pull`. Report the merged PR number/URL and the resulting `main` HEAD.

If any step fails (push rejected, branch protection blocks the merge, conflicts), STOP at that step and report the exact error — do not force or work around it.
