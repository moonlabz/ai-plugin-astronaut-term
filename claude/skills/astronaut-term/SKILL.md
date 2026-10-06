---
name: astronaut-term
description: Use when someone asks to configure, disable, reinstall, or troubleshoot the Astronaut Term Claude Code astronaut mod.
---

# Astronaut Term for Claude Code

The astronaut is rendered by Claude Code's local mod hooks above the terminal prompt. It uses no external services or runtime network access.

## Configure

Run `/plugin`, open the Installed tab, select Astronaut Term, then choose **Configure options**. Defaults are normal speed, sleep after 120 seconds, HUD off, status line on, satellite companions on, and moon scene on.

## Disable or restore

- Disable the mod from `/plugin` or run `claude plugin disable astronaut-term@astronaut-term`.
- Restore it with `claude plugin enable astronaut-term@astronaut-term`.
- Remove it with `claude plugin uninstall astronaut-term@astronaut-term`.
- For local development, start Claude Code with `claude --plugin-dir ./claude`.

The runtime only observes local session and tool events needed to choose an animation. It renders generic labels and never displays tool arguments.
