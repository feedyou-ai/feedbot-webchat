---
name: release-test-plan
description: Build or update the manual release test plan (test scenarios) for a Feedbot release from the Jira fixVersion tickets and the git diff between release tags, publish it to Confluence and create the Jira TestPlan and TestExecution tickets. Use when preparing release testing, a release test plan, manual test scenarios, or ticket-to-test coverage for a release.
---

# Release Test Plan

Produces `docs/release-test-scenarios/v<release>-manual-test-scenarios/manual-test-scenarios.md` and its Confluence copy. Read the previous plan in `docs/release-test-scenarios/` first and keep its layout, language and naming.

## Prerequisites

Needs Atlassian (Jira + Confluence) MCP tools, the `azure-devops` MCP server and an authenticated `gh`. If any is missing, stop and point the user to `docs/release-process/README.md` instead of asking for CSV exports or guessing.

## Inputs

Resolve these yourself and state the resolved values before analysis. Ask only when something cannot be resolved.

| Input           | Default                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Release         | Next minor after the latest `v*.*.0` tag, e.g. `v2026.5.0` → `2026.6`                                                    |
| Tickets         | Jira via Atlassian MCP, cloudId `feedyou.atlassian.net`, JQL `project = FBOT AND fixVersion = "v<release>" ORDER BY key` |
| `fromTag`       | Latest `v*.*.0` tag (`git tag --list 'v*.*.0' --sort=-v:refname \| head -1`)                                             |
| `toTag`         | The new release tag if it exists, otherwise `origin/master` (run `git fetch --tags origin` first)                        |
| Release profile | Auto-detected (see below), user may override                                                                             |
| Wave 2-4 names  | From the release profile, user may override                                                                              |

The fixVersion defines the release tickets and git defines what actually ships. No CSV export is needed. Also fetch the tickets referenced by commits in `fromTag..toTag` that lack the fixVersion. They ship too, so they get scenarios and land in `Extra Coverage — Commits Not in Jira`.

Jira status is orientation only, never a filter:

- `To production` — waits for this release.
- `Done` — usually shipped in an earlier patch; still in scope when its commits are in the range.
- `To Code` / `In code` — partly merged or not merged at all. The team does not wait for these; unfinished parts get cherry-picked as a patch later or slip to the next release. Test only what is merged and note the rest.

Report fixVersion tickets with no commit in the range as `Not in release yet`, not as coverage gaps.

Per ticket, collect key, type, summary, priority, status, fixVersions and the description (`responseContentFormat: markdown`). Read the description and comments of tickets whose summary alone does not tell what to test.

Default responsibility mapping, unless the user overrides it:

| Product Area              | Responsible |
| ------------------------- | ----------- |
| Flow Designer             | Tína        |
| Bot Management            | Tína        |
| Mutation and Localization | Tína        |
| Webchat                   | Tína        |
| Voice and Telephony       | Luky S.     |
| NLP Classifiers           | Tína        |
| Gen AI (including KB)     | Luky S.     |
| Bot Tester                | Luky S.     |
| E2E Cypress Tests         | Luky S.     |
| Release Process           | Luky S.     |
| Conversation List         | Luky S.     |
| Documentation             | Tína        |

## Analysis

1. `git log --oneline fromTag..toTag` and `git diff --stat fromTag..toTag`. Map commits to tickets via the `FBOT-XXXX` key in the message.
2. Identify user-visible changes and high-risk regressions (templating, LLM invocation, deploy, shared `schema`/`utils` changes).
3. Commits with a ticket key that is not in the Jira result go to `Extra Coverage — Commits Not in Jira`.
4. Release profile: >40 % of tickets in Gen AI/KB → `ai-heavy`; else >40 % Designer/UI/Webchat → `ui-heavy`; else >40 % infrastructure/deployment → `infra-heavy`; else `balanced`.
5. Optional patch check. The scope is strictly `fromTag..toTag`; hotfix patch tags (`v<prev>.1`, `.2`, …) never reduce or change it. Features are not supposed to ship in patches, so as a side check list the non-`chore(release)` commits in `fromTag..origin/release/latest`, flag any that look like a real feature rather than a fix, and check whether the previous release's test plan covered them. Report the result as a note to the user, not as part of the plan.

| Profile     | Wave 2                      | Wave 3                                | Wave 4                         |
| ----------- | --------------------------- | ------------------------------------- | ------------------------------ |
| ai-heavy    | Gen AI & KB Integration     | Gen AI Regressions & Fallbacks        | Gen AI Edge Cases              |
| ui-heavy    | Flow Designer & UI          | UI Regression & Localization          | UI Performance & Accessibility |
| infra-heavy | Deployment & Infrastructure | High-Load Scenarios                   | Failover & Recovery            |
| balanced    | Core Feature Validation     | Backward Compatibility and Regression | Non-Functional and Resiliency  |

Wave 1 is always `Critical Release Smoke` (login, deploy, basic dialog flow). Wave names tell testers which product areas deserve more attention. Keep them even when a wave also holds scenarios outside its theme.

## Document

Section order:

1. `Purpose` — tag range, ticket count, profile, the high-risk changes
2. `How To Use`
3. `Responsibility` — product area owners, scenario ownership
4. `Release Coverage Map`
5. `Summary`
6. `Wave 1 - Critical Release Smoke`
7. `Wave 2 - <profile name>`
8. `Wave 3 - <profile name>`
9. `Wave 4 - <profile name>`
10. `Defects Found`
11. `Test Guides` — step-by-step guides for behavior that is hidden or not obvious from the UI: JSON-only config, values that only land in storages or App Insights, timing effects, mocked calls. No fixed count; write one wherever a tester would otherwise miss what to check.
12. `Sign-off`
13. `To Production Ticket Summary` — `Coverage Overview`, `Ticket-to-Test Mapping`, `Extra Coverage — Commits Not in Jira`

Scenario table columns: `ID | Done | Scenario | Priority | Status | Responsible Tester | Tested By | Executed At | Bug Report | Notes`. `Done` is `[ ]`. `Responsible Tester` comes from the mapping and never changes for load balancing. To balance workload, pre-fill `Tested By` with the tester who will run the scenario; otherwise leave it empty.

Ticket summary: every ticket links to `https://feedyou.atlassian.net/browse/<KEY>`, maps to scenario IDs and has a coverage status `Covered`, `Partially Covered`, `Not Covered` (with a short action note) or `N/A`.

Rules:

- When updating an existing plan, keep executed evidence and existing scenario IDs; add IDs only for new scenarios.
- No duplicate scenarios. Every ticket appears in the summary.
- Keep scenarios that are hard or slow to execute (e.g. a bot archived for 30+ days). They record what the release should verify; testers decide how to handle them.
- Scenarios are written so a tester can run them in the Designer, Webchat or phone without reading code.

## Confluence

Test plans live in folder `276234241` in space `~60c3596e9469280070224931` (https://feedyou.atlassian.net/wiki/spaces/~60c3596e9469280070224931/folder/276234241). One page per minor release, titled `Release v<YYYY.M>` (e.g. `Release v2026.6`).

1. Find an existing page with CQL `ancestor = 276234241 AND title = "Release v<YYYY.M>"`.
2. Publishing is outward-facing: show the user the repo file first and publish only after they confirm.
3. Create the page with `spaceId: "~60c3596e9469280070224931"`, `parentId: "276234241"` and `contentFormat: html`, or update the existing page, following **Page format** below. Keep the `tinyui` link from the response (`https://feedyou.atlassian.net/wiki/x/<id>`) for Jira.
4. If the Confluence page was edited by testers, read it back before overwriting and merge their execution data (Done checkbox state, Status, Tested By, Executed At, Bug Report, Notes) into the repo file first.

### Page format

The testers work directly in the Confluence page, so it must match the previous plans:

- **HTML, never markdown.** Convert the repo file to HTML. Markdown cannot carry table width or checkboxes.
- **Stretched tables.** Write every table as `<table data-layout="default" data-width="4000">`. Without it the ten-column scenario tables render squeezed and unreadable. The width is capped by the page, so `4000` effectively means "as wide as possible".
- **Real checkboxes in `Done`.** Render the `Done` cell of every scenario row as `<ul data-type="task-list"><li data-type="task-item"><input type="checkbox"></li></ul>` (add `checked` for `[x]`), not the literal `[ ]`.
- **Full-width page.** Text outside tables is left-aligned only on a full-width page. Confluence stores this as page content properties (`content-appearance-published` and `content-appearance-draft` set to `full-width`), not in the body. As of September 2026 the Atlassian MCP has no tool for page properties, so this is a known limitation we are waiting on. On every new page, first try it: look for an Atlassian MCP tool or parameter that sets page appearance or content properties and use it if one exists, then confirm the result. If nothing works, that is fine; ask the user to switch it on once in the editor (↔ "Make page full-width" in the toolbar or the ••• menu). If it did work, replace this bullet with the working call.
- **Verify.** Read the page back as `adf` and check that every table has `layout: default, width: 4000` and every scenario row has a `taskList` in `Done`.

## Jira Test Plan And Executions

After the Confluence page exists and the user confirmed publishing, create the AgileTest tickets in project `FBOT`. Follow the latest release's tickets as the pattern (v2026.6: FBOT-3672, FBOT-3673, FBOT-3674) and check with JQL `project = FBOT AND issuetype in (TestPlan, TestExecution) AND summary ~ "v<YYYY.M>"` that they do not exist yet.

| Issue type      | Summary                             | Assignee                                                           | Description                                                                                   |
| --------------- | ----------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `TestPlan`      | `[TP] - release v<YYYY.M>`          | Lukáš Secký (`60c3596e9469280070224931`)                           | 1–2 Czech sentences on what this release's testing focuses on, then the Confluence page embed |
| `TestExecution` | `[TE] - Release v<YYYY.M> - Luky S` | Lukáš Secký                                                        | the Confluence page embed                                                                     |
| `TestExecution` | `[TE] - Release v<YYYY.M> - Tína`   | Kristína Svitačová (`712020:986c73f9-420b-45a3-89e5-44e6489b6c53`) | the Confluence page embed                                                                     |

The Confluence link goes in as an **Embed** smart link, not a plain link. Create the issues with `contentFormat: adf` and put the tiny link in an `embedCard` node: `{"type": "embedCard", "attrs": {"url": "<tiny link>", "layout": "center"}}`, after the paragraph in the TestPlan and as the only node in the executions. Check with `expand: renderedFields` that the link has `title="smart-embed"`.

Keep the summaries exactly as above, including the lowercase `release` in the TestPlan. Set no fixVersion and no issue links; the latest pattern has neither. Linking executions to the plan happens inside AgileTest and cannot be done through MCP, so tell the user to link them there.

## Output

Report the file path, the Confluence URL (if published), the created Jira keys, the total scenario count, newly added scenarios, ticket coverage counts, the list of uncovered or partially covered tickets and suggested next actions.
