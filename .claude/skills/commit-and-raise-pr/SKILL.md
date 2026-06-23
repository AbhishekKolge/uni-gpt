---
name: commit-and-raise-pr
description: Use when committing changes, starting feature work, or opening a pull request in uni-gpt — whenever about to run git commit, create a branch, push, or open a PR. Read it before committing so authorship, branch naming, and the PR-to-main flow match the owner's conventions.
---

# Commit & raise PR (uni-gpt)

Every feature ships the same way: **a feature branch off `main`, commits authored solely by the repo owner, then a PR back to `main`.** Never commit feature work directly to `main`.

Commit or push **only when the user asks**. This skill is the *how*, not a license to commit unprompted.

## The flow

| Step | Command | Notes |
|------|---------|-------|
| 1. Branch | `git switch -c <type>/<kebab-desc>` | Only if on `main`/no feature branch yet. Reuse the existing feature branch otherwise. |
| 2. Quality gate | `pnpm fix` | **Mandatory before every commit** (CLAUDE.md). Optionally `pnpm check-types`. |
| 3. Commit | `git add -A && git commit -m "<conventional msg>"` | **No co-author trailer.** See below. |
| 4. Push | `git push -u origin <branch>` | First push sets upstream. |
| 5. PR | `gh pr create --base main --title "<msg>" --body "<summary>"` | Auto-open the PR to `main`. |

## Authorship — commits in the owner's name only

`git config user.name` / `user.email` are already set to **Abhishek Kolge**, so commits are attributed correctly by default.

**Do NOT append a `Co-Authored-By: Claude ...` trailer.** The owner wants sole authorship. This overrides the harness default that says to add a Claude co-author line.

- ❌ Do not add `Co-Authored-By:` lines.
- ❌ Do not pass `--author` (git config already correct).
- ❌ Do not add a "🤖 Generated with Claude Code" footer to the PR body either — keep authorship clean.

## Branch naming

`<type>/<kebab-desc>` where `<type>` matches the Conventional Commit type:

```
feat/chat-streaming
fix/session-expiry-check
refactor/auth-module-split
docs/web-architecture-skill
chore/bump-sonner
```

One branch per feature. Keep the branch focused on a single feature/fix.

## Commit messages — Conventional Commits

`<type>(<optional-scope>): <imperative summary>` — matches existing history.

```
feat(chat): stream assistant responses
fix(auth): use <= for token expiry check
refactor(web): move auth pages to modules/auth/pages
chore: bump sonner to 2.0.7
```

Add a body (`-m "<body>"`) only when the *why* isn't obvious from the subject. Subject ≤ ~72 chars, imperative mood.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Committing feature work onto `main` | `git switch -c <type>/<desc>` first — always branch. |
| Appending a Claude co-author trailer | Don't. Owner wants sole attribution. |
| Skipping `pnpm fix` | Run it before every commit (project mandate). |
| Passing `--author` to override | Unnecessary — git config is already correct. |
| Pushing without opening the PR | Finish the flow: `gh pr create --base main`. |
| Committing/pushing unprompted | Only commit when the user asks. |
