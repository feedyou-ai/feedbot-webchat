---
name: start-designer-codex
description: Start, check, monitor, or stop the Feedbot Designer and Server development stack when operating inside Codex, including before browser testing. Do not use for Claude Code, GitHub Copilot, or generic shell workflows.
---

# Start Designer in Codex

This workflow overrides generic long-running-process instructions and package-specific start commands when operating in Codex.

- Do not use the generic `nohup` or PID workflow for the Designer stack.
- Run `pnpm start:designer:codex` in a Codex-managed background terminal and retain its terminal or process handle.
- Before opening or reloading Designer in a browser, run `pnpm start:designer:status` and wait for exit code 0. It checks both the Designer and Server portless URLs and succeeds only when both return HTTP 2xx or 3xx. Vite's `ready` message alone is not sufficient: the frontend can load before the backend is ready. A portless 404 means the app is not running.
- If the status check fails while startup is still progressing, inspect output from the original managed terminal and retry the status check. Do not start another stack instance. If startup fails, diagnose the error before proceeding to the browser.
- Read output from the same managed terminal.
- If the user asked to start Designer for continued use, leave the stack running after verification. If this agent started it solely for a test, terminate that exact terminal by its handle or send Ctrl-C to the same terminal session when testing is complete. Do not stop a stack started by someone else.
- Do not detach the command with `nohup` or `&`, persist OS PIDs, rediscover it with `ps` or `pgrep`, or stop it with `pkill`; Codex sandboxes may not be able to inspect or signal a process created by an earlier command.
