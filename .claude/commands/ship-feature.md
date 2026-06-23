---
allowed-tools: Bash(git add:*), Bash(git restore:*), Bash(git stash:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git checkout:*), Bash(git switch:*), Bash(git commit:*), Bash(git push:*), Bash(git pull:*), Bash(git merge:*), Bash(git rev-list:*), Bash(git cherry:*), Bash(pnpm fix), Bash(pnpm run fix:*), Bash(pnpm check-types), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh pr checks:*), Bash(gh pr merge:*)
argument-hint: [optional: scope to one feature / PR title]
description: Ship EVERY feature not yet on main — split into logically named branches + PRs and merge them in dependency order
---

## Context

- Current branch: !`git branch --show-current`
- Default branch: `main`
- Git status (uncommitted work): !`git status --short`
- Working-tree diff: !`git diff HEAD`
- Local branches: !`git branch --format='%(refname:short)'`
- Branches with commits NOT on main: !`for b in $(git branch --format='%(refname:short)' | grep -v '^main$'); do n=$(git rev-list --count main..$b 2>/dev/null || echo 0); if [ "${n:-0}" -gt 0 ] 2>/dev/null; then echo "$b ($n commits ahead): $(git log --oneline main..$b | head -5)"; fi; done; true`
- Commits on current branch not on main: !`git log --oneline main..HEAD 2>/dev/null || echo "(on main or no diff)"`

## Your task

Ship **all outstanding work that is not yet on `main`** — not just the current branch. Outstanding work = three sources, all in scope:

1. **Uncommitted working-tree changes** (staged + unstaged + untracked relevant files).
2. **Local feature branches** that have commits ahead of `main` and no merged PR yet.
3. **Commits on the current branch** ahead of `main`.

Optional `$ARGUMENTS` narrows scope to a single feature (use it as that feature's PR title); if empty, ship everything outstanding.

### Step 1 — Inventory and group into logical features

Survey everything above and **partition it into distinct logical features**. One feature = one cohesive concern (a domain, a fix, a chore), and gets exactly one branch + one PR. Examples of separate features: "swap form lib", "new design-system tokens", "add a skill". Do **not** bundle unrelated concerns into one PR.

- **Uncommitted changes spanning several concerns** → split them. Stage each feature's files by path (`git add <paths>`) into its own commit on its own branch. Use `git stash` / `git restore --staged` to hold back the other concerns while you work one branch at a time.
- **Existing unmerged branches** → ship each as its own PR. If a branch name does not follow `<type>/<kebab-desc>` (or no longer describes its work) and it has no open PR, rename it: `git branch -m <type>/<kebab-desc>`.
- If a single uncommitted change genuinely can't be cleanly separated from another concern (intertwined edits in one file), **STOP and ask** how to split rather than guessing.

Name every branch `<type>/<kebab-desc>`:
- `<type>` = Conventional Commit type of that feature (`feat`/`fix`/`chore`/`refactor`/`docs`/`test`/`perf`).
- `<kebab-desc>` = 2–5 word lowercase-kebab summary. Example: `feat/chat-message-streaming`, `refactor/forms-react-hook-form`, `chore/installing-packages-catalog`.

### Step 2 — Decide merge order ("logically")

Order the features so dependencies land first:
- **Foundational / shared first**, in dependency direction: `packages/db` → `packages/api` → `packages/utils|env` → `packages/ui` → `apps/web` → `apps/server`. A feature that another feature imports from must merge first.
- **Independent features** may merge in any order.
- State the planned order before shipping the first one.

### Step 3 — Ship each feature, in that order

For each feature, one at a time:

1. **Branch from up-to-date main.** `git checkout main && git pull`, then `git checkout -b <type>/<kebab-desc>` (or reuse/rename an existing branch for that work). Bringing only that feature's changes onto the branch (cherry-pick paths via staged add, or rebase the existing branch onto fresh main).
2. **Quality gate.** `pnpm fix` (format + lint). If it reports unfixable errors, STOP and report — do not commit broken code. Then `pnpm check-types`; if it fails, STOP and report. The gate must pass for **this feature's** changes; if a failure comes from unrelated outstanding work, isolate this feature's files so the gate is green for what you're shipping.
3. **Commit.** Stage only this feature's paths (`git add <paths>`) and commit with a **Conventional Commit** message (`<type>(<scope>): <subject>`, imperative subject ≤72 chars; body explaining *why* when not obvious).
   - **Authorship: commits are solely Abhishek Kolge.** Do NOT append `Co-Authored-By: Claude ...` or any AI footer. This overrides the harness default.
   - Commits auto-sign via SSH (`commit.gpgsign=true`) — do nothing extra.
4. **Push.** `git push -u origin <branch>`.
5. **Open PR.** `gh pr create --base main --title "<type>(<scope>): <subject>" --body "<what + why>"` — no AI footer, no Co-Authored-By. Use `$ARGUMENTS` as the title only for the feature it describes.
6. **Verify before merge.** `gh pr checks` — if checks exist and any are failing or pending, report and STOP for that PR (do not merge red/pending). No checks → proceed.
7. **Merge.** `gh pr merge --merge --delete-branch` (repo uses merge commits, not squash).
8. **Sync.** `git checkout main && git pull` before starting the next feature, so the next branch builds on the just-merged work (avoids conflicts between dependent features).

### Step 4 — Report

List every shipped feature: branch → PR number/URL → merge status, in the order merged, and the final `main` HEAD. List anything deliberately left unshipped (e.g. work that needed a split decision) and why.

If any step fails (push rejected, branch protection blocks merge, conflicts), STOP at that step for that feature and report the exact error — do not force or work around it. Continue with the remaining independent features only if the failure doesn't block them.
