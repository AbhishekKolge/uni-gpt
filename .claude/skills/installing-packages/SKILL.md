---
name: installing-packages
description: Use when about to add or install a new npm/pnpm package or run pnpm dlx/npx in uni-gpt — before any pnpm add / npm i / yarn add / bun add or pulling a new dependency. Read it first so the package is vetted for supply-chain compromise, typosquatting, malicious install scripts, release age (minimumReleaseAge 1440), and known-bad versions before it touches the lockfile.
---

# Installing packages in uni-gpt

**The rule: no `add`/`install` until the package + the exact version you'll install have passed the vetting checklist below.** A malicious `postinstall` runs the moment the package lands — there is no "undo" after install. Vet first, install second.

**Violating the letter of this is violating the spirit of it.** "I web-searched it" is not the check — the check is the ordered command sequence with a pass/fail gate. Running `npm view` and eyeballing the output is **not** verification; it shows metadata, not advisories or droppers.

The `PreToolUse` install-pause hook is the **cue to run this checklist**, not a rubber stamp to click through.

## Vetting checklist (run in order, before installing)

Substitute the real package name for `<pkg>`. Decide the **exact version** you intend to install first, then vet *that* version — not just "latest".

```bash
# A. Resolve the exact version + tags you'd install.
npm view <pkg> version dist-tags --json

# B. Real package, not a typosquat. Repo URL must match the KNOWN official project.
npm view <pkg> name description repository.url homepage maintainers --json
#    → web-search the EXACT name; compare the repo/publisher to what you expect.

# C. Release age. minimumReleaseAge:1440 blocks <24h, but YOU confirm the target
#    version is >24h old AND not freshly bumped right before you happened to need it.
npm view <pkg> time --json
#    → look up the timestamp of the exact version from step A. Brand-new package or
#      a version published hours ago = red flag, even if pnpm would let it through.

# D. Install-script inspection — THE dropper vector (easy-day-js was a postinstall).
npm view <pkg> scripts --json
#    → ANY preinstall / install / postinstall must be inspected and understood
#      before you trust it. Unexpected install hook on a lib that needs none = STOP.

# E. Reputation — don't trust memory for download counts; fetch them.
curl -s https://api.npmjs.org/downloads/point/last-week/<pkg>
#    → near-zero weekly downloads on a "popular" name = typosquat red flag.

# F. Advisory search (MANDATORY — cannot be replaced by npm view).
#    WebSearch each: "<pkg> <version> malware", "<pkg> compromised supply chain",
#    "<pkg> postinstall dropper", "<pkg> typosquat", "<pkg> CVE advisory".
```

## Decision gate — install ONLY if ALL hold

- Repo URL / publisher matches the known official project (B).
- Target version is >24h old and not a suspicious fresh bump (C).
- No surprise install scripts — or scripts were inspected and are benign (D).
- Download volume is consistent with the package's claimed popularity (E).
- Web search surfaces **no** malware / compromise / typosquat advisory for the name or that version (F).

Any one fails → do not install. Find a vetted alternative, an older known-good version, or stop and report.

## Installing, once vetted

- **pnpm only, from repo root**, scoped to a workspace: `pnpm -F web add <pkg>@<version>` (never `cd` + `npm i`).
- **Shared external dep** → add the version to `catalog:` in `pnpm-workspace.yaml`, reference as `"<pkg>": "catalog:"`. A single-app web-only dep can be a direct dependency. See [[monorepo-conventions]].
- **`@mastra/*` → pin EXACT, no `^`/`~`.** Use `@mastra/core@1.43.0`. **NEVER `1.42.1`** (compromised 2026-06-17 via `easy-day-js` postinstall dropper).

## Post-install verification (every time)

```bash
grep -c easy-day-js pnpm-lock.yaml   # MUST print 0
```

If it prints anything but `0`: STOP, remove the dep, investigate — a known dropper reached the lockfile. Never weaken `minimumReleaseAge: 1440` or `blockExoticSubdeps: true` to make an install go through.

## Rationalizations — all mean "run the checklist anyway"

| Excuse | Reality |
|--------|---------|
| "It's a famous package, obviously safe" | Famous names are exactly what typosquats and hijacked releases impersonate. Vet it. |
| "`npm view` output looked fine = verified" | `npm view` shows metadata, not advisories or install-script droppers. Steps D + F are not optional. |
| "I know it has millions of downloads" | Memory is not verification. Fetch the count (E); a compromised version can ride a trusted name. |
| "Demo in 20 min, no time" | The checklist is ~2 minutes. A malicious postinstall runs at install and cannot be undone. |
| "pnpm rejects fresh versions anyway" | `minimumReleaseAge` blocks <24h. It does NOT block a 2-day-old malicious release. Age ≠ safe. |
| "It's just a dev/transitive dep" | Postinstall droppers run regardless of dep type. Lockfile grep + `blockExoticSubdeps` still required. |
| "The hook asked, I'll just approve" | The hook is the cue to vet, not the verification. Approve only after the gate passes. |

## Red flags — STOP before install

- Package first-published recently, or the target version is <24h old / freshly bumped.
- A surprise `preinstall` / `install` / `postinstall` script.
- Repo URL missing, or doesn't match the known project.
- Near-zero downloads for a supposedly popular package.
- Maintainer changed right before the version you want.
- Any web result mentioning malware / compromise / typosquat for the name or version.
- You're about to type `1.42.1` for any `@mastra/*` package.
