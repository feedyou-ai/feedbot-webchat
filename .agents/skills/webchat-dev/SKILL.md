---
name: webchat-dev
description: Run the webchat locally and see it in a browser. Starts or reuses the test channel dev server (`npm run dev`), lists the test bots and channels from `test_channels.js`, and drives the widget with the Playwright MCP server. Use when asked to run, open, test, screenshot or visually verify the webchat, or to check a change in a real browser.
---

# Webchat dev server

`npm run dev` serves every channel listed in `test_channels.js`, each on its own page that embeds the webchat exactly as a customer website does, using the snippet from `samples/feedyou/local.html`. Never change how that embed snippet is handled, or how the widget looks, as a side effect of dev tooling.

The server only serves files that are already built. It does **not** build or watch anything. See [Rebuilding](#rebuilding).

## Start or reuse the server

The port is `${PORT:-1234}`.

1. Check whether a server is already answering:
   `curl -s -o /dev/null -w '%{http_code}' http://localhost:${PORT:-1234}/`
   If it returns `200`, reuse it. Never start a second copy.
2. Otherwise, start `npm run dev` as a background task, through the agent's own background task or terminal mechanism, so its output stays readable. Do not use `nohup` or `&`.
3. Poll the URL from step 1 until it returns `200`, for about 10 s at most, before opening the browser. If it doesn't, read the task output. "Port … is already in use" means another server owns the port: reuse it, or start this one with a different `PORT`.
4. The startup output lists every channel URL and warns if `botchat-es5.js` or `botchat.css` is older than `src/`. Take that warning seriously: you would be testing an old build.
5. When you are done: if the user asked for the server to keep running, leave it. If you started it only for your own test, stop that same background task. Never stop a server someone else started.

## Routes

| URL | Content |
|---|---|
| `/` | All bots and their channels, plus any warnings about an old build |
| `/{botId}` | Channels of one bot |
| `/{botId}/{channelId}` | Chat page for that channel. It sets `#feedbot-test-mode` by itself |
| anything else | 404 listing the valid routes |

The built files (`/botchat-es5.js`, `/botchat.css`, …) are served from the repo root.

## Test channels

`test_channels.js` exports an array of bots:

```js
{ botId: 'webapp', hostingId: 'feedbot-webapp-app', channelIds: ['7yqkmz', 'gmqgsfch'] }
```

- `hostingId` is passed to `BotChat.App` as `bot.id`. `botId` is used only in URLs.
- A whole bot object can be pasted from the Designer dev tools ("copy channel data").
- The file is re-read on every request, so there's no need to restart.
- An invalid file (duplicate `botId`, a missing field, a syntax error) makes every page return a 500 that shows the error.

## Driving the widget with Playwright MCP

The `playwright` MCP server is configured in `.mcp.json` (Claude Code) and `.codex/config.toml` (Codex). It runs headed Google Chrome with an in-memory profile, so every session starts clean.

- **Every page load starts a real conversation with a live bot.** It runs in test mode, but it still uses the real bot. Keep messages purposeful and don't reload in loops.
- **Wait for the widget to appear.** The widget renders only after its remote config arrives, which can take several seconds. After `browser_navigate`, wait (`browser_wait_for` with `time`) and take a snapshot again until the widget shows up.
- **If the page stays blank,** check `browser_console_messages` for "Failed to fetch Feedyou WebChat remote config".
  - A `429 Too Many Requests` on `…azurewebsites.net/webchat/config` means the bot's config endpoint is rate-limiting you after many page loads. Wait a few minutes before loading pages of that bot again.
  - It is not a webchat bug, and nothing local needs fixing.
- **Expect different layouts.** Each channel's remote config picks a template:
  - Assistant and full-screen templates show the message textbox right away.
  - The expandable template starts collapsed: the snapshot shows only a bare `generic: Chatbot` with no ref. Expand it with `browser_click` and `target: ".feedbot-wrapper.collapsed .feedbot-header"`.
- **Sending a message:** `browser_type` with `target: "role=textbox"`, your text, and `submit: true`.
- **Waiting for a reply:** `browser_wait_for` with text you expect from the bot.
  - Bot messages have the `.wc-message-from-bot` class; your messages have `.wc-message-from-me`.
  - The typing indicator is also an empty `.wc-message-from-bot`.
  - Test mode replies usually include "Chatbot je spuštěn v TESTOVACÍM režimu."
- **Snapshots:** they are often saved as files under `.playwright-mcp/` (gitignored). Read the linked file.
- **Console:** `browser_console_messages`. A React DevTools info message and the React dev-mode warnings are normal.
- **Screenshots:** `browser_take_screenshot`, for visual checks.

Headed mode needs a display, so it won't work for cloud or remote agents.

The MCP server needs Node ≥ 18. If the agent was launched from a shell running an older Node, `npx` starts the server with it and it fails. Restart the agent from a shell running Node 22 (see `.nvmrc`).

## Rebuilding

```sh
npm run build
```

It type-checks, compiles `built/` and the CSS, and builds the development bundles (a few seconds). `npm run build:release` builds the minified bundles that are published, and `npm run verify:build` checks them.

Reload the browser page afterwards. The server sends `Cache-Control: no-store`, so the new bundle is picked up.
