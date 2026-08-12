---
name: conversation-tree
description: Open, inspect, or explain the local Codex Conversation Tree on Windows. Use when the user asks to open the conversation tree, check its status, inspect Codex branches, or explain tree navigation.
---

# Codex Conversation Tree

The runtime is installed at `%LOCALAPPDATA%\CodexConversationTree`.

When the user asks to open it, run `scripts/open-conversation-tree.ps1` from the plugin root. Explain that the separate Codex window contains a **Conversation Tree** entry directly below **Plugins**.

For a health check:

1. Request `http://127.0.0.1:47831/api/health`.
2. Check `http://127.0.0.1:9239/json/list` for the injected Codex window.
3. Verify the local Node processes belong to the installation directory.
4. Never close an ordinary Codex window during troubleshooting.

The viewer is read-only. Relationships come from Codex session metadata (`forked_from_id`). The sidebar entry uses a local CDP bridge because Codex plugins do not currently expose a native sidebar-extension point.

