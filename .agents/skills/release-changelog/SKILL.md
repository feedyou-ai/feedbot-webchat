---
name: release-changelog
description: Write the non-technical, customer-facing changelog (release notes) for a Feedbot minor release from the git range, the technical CHANGELOG.md and the release's Jira tickets. Use when preparing release notes or a changelog for customers.
---

# Release Changelog

Produces `docs/release-notes/v<YYYY.M>-non-technical-changelog.md`. Read the newest file in `docs/release-notes/` and `docs/changelog-example.md` first and match their tone and format.

## Inputs

Resolve these yourself and state them before writing. Ask only when something cannot be resolved.

| Input               | Default                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release             | The newest `v*.*.0` tag, e.g. `v2026.6.0` → `v2026.6`                                                                                                                                                                                                               |
| Range               | Previous minor `.0` tag .. newest tag of this release (e.g. `v2026.5.0..v2026.6.1`), the same scope as the release test plan                                                                                                                                        |
| Technical changelog | `CHANGELOG.md` at the newest release tag (`git show <tag>:CHANGELOG.md`), section of the new release                                                                                                                                                                |
| Tickets             | Jira via Atlassian MCP, cloudId `feedyou.atlassian.net`, JQL `project = FBOT AND fixVersion = "v<YYYY.M>"`, plus every ticket key from commits in the range; read descriptions (`responseContentFormat: markdown`) of tickets whose summary is not self-explanatory |
| Test plan           | `docs/release-test-scenarios/v<YYYY.M>.0-manual-test-scenarios/` if it exists; its ticket mapping is a good checklist of what shipped                                                                                                                               |

No CSV export is needed.

## What goes in

Write for **customers and bot administrators**, not developers: what changed for them and why it matters, in plain language, one feature in 1–4 lines.

Include:

- New features and significant user-visible improvements
- Bug fixes that affected user workflows
- Security improvements, without internal details
- Anything the user has to do (approvals, configuration changes)
- Changes that already reached customers in a patch of the previous minor but were not in its release notes

Exclude:

- Refactoring, CI/CD, test infrastructure, build tooling, developer tooling for this repo (agent instructions, skills, Copilot, release scripts)
- Package, SDK, library names, file paths, endpoints, code
- `chore:`, `ci:`, `test:`, `refactor:` commits without user impact
- Features behind a `DEVELOPMENT` feature flag (`packages/designer/src/store/features/featuresSchema.ts` at the release tag), unless previous notes already present that area as a private beta; then mark it `(Private beta - Feedyou users)` like the Bot Tester
- Tickets in `To Code` / `In code` whose merged part is not usable by customers yet

When unsure whether something is customer-facing or ready, include it and list it in the summary for the user to decide.

## Format

```markdown
# Feedbot Platform — Release v<YYYY.M> (<Month Year>)

### 🚀 Features

- **Feature title**
  - What it does and why it matters

- **Smaller feature** — One-line description

### 🐛 Bug Fixes

- **Affected area** - What was broken, now fixed

- Various smaller fixes: comma-separated list

### 🔒 Security & Dependencies

- One-line summary without package names

### ⚙️ Dev / CI / Ops

- 1–2 lines from the customer's perspective

### 📝 Notes

- **Topic**: What the user needs to know or do

Don't forget about our [product portal](https://portal.productboard.com/cx2f2fsrnilp6ubvjdyx1l6g), where you can comment on planned features and suggest new ones!
```

- `###` section headers, no horizontal rules, no priority tags, no code backticks for feature names, no links to source code.
- Group related items (five KB fixes → one Knowledge Base bullet).
- Most impactful features first; blocking bug fixes first and "Various smaller fixes" last.
- Leave out empty sections.
- Link every feature to the docs page that documents it: `[documentation](/zakaznici/...)` as the last sub-bullet, or ` ([documentation](...))` after a one-line feature; several pages as `[documentation: <topic>](...)`. Find pages with `grep -rl` in `packages/docs/src/content/docs/`; URLs are the lower-cased path without `.mdx` and with a trailing slash. Link only `zakaznici/` and `verejne/` pages; customers cannot open `interni/`, so features documented only there get no link (tell the user). Check them with `pnpm --prefix packages/docs check:links` while the docs dev server runs.

## Copy to the documentation site

For now the customer changelog is also copied by hand into the docs site (a separate process from the rest of the docs). Create `packages/docs/src/content/docs/zakaznici/changelog/<YYYYM>.mdx` (e.g. `20266.mdx`) from the release notes file:

- Frontmatter `title: "<YYYY.M>"` and `sidebar.order` one lower than the current newest page, so it lands on top of the sidebar.
- Drop the H1; then `:::tip` / `<release status>` / `:::`. The status follows the deployment stage: `Release in progress` while the release is being tested, `Released on internal implementations <D.M.YYYY>` once it is on internal instances, `Released <D.M.YYYY>` after the production release. Update it when the user reports the next stage.
- Section headers as `## Features`, `## Bug Fixes`, … without emoji, sub-bullets without blank lines between them.
- Add `<LinkCard title="<YYYY.M>" href="/zakaznici/changelog/<YYYYM>/" />` at the top of the list in `index.mdx`.

Check it with `pnpm --prefix packages/docs dev` at `http://localhost:4321/zakaznici/changelog/<YYYYM>/`.

## Output

Save the file, then report: the file path, the range and ticket count used, and a short list of items you left out or were unsure about (flags, partial merges, internal-looking features) so the user can adjust. Publishing the notes anywhere else is outward-facing: only on the user's request.
