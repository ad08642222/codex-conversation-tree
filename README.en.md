# Codex Conversation Tree

Real Codex task lineage inside the official Windows app: open an infinite conversation tree from the sidebar, inspect branches in the main workspace, and jump back to any native task.

> **Version 1.1.1 uses your existing official Codex window.** There is no second client or separate conversation store. Your login and task list stay the same, manual renames sync in about five seconds, rebuilt content frames recover automatically, and one shortcut restores the normal official launch path.

![Codex Conversation Tree](assets/screenshots/tree-overview.png)

This is an unofficial, local-first community project. It reads real `forked_from_id` relationships without modifying task data, adds a **Conversation Tree** entry below **Plugins**, and opens tasks in Codex when you click a node.

[Download v1.1.1](https://github.com/ad08642222/codex-conversation-tree/releases/tag/v1.1.1) · [Chinese README](README.md) · [Security](SECURITY.md)

## The problem it solves

Codex's normal task list is convenient for recent work, but it does not provide a global visual map when one task grows into several branches. As the list grows, you have to remember relationships from titles and timestamps, search repeatedly to recover an older route, or rely on a separate viewer that may split login state and conversation data.

| Before | With Codex Conversation Tree |
|---|---|
| Parent, child, and sibling tasks look like unrelated list items | Real `forked_from_id` relationships become a navigable tree |
| Returning to an older branch requires searching and reopening tasks | Click a node to open the matching native Codex task |
| A separate window or profile can create two unsynchronized task stores | The tree runs inside the same official window and profile |
| A manual rename may leave an external viewer showing the old title | Names refresh in about five seconds; original-title search still works |
| Remote dashboards create extra privacy questions | Parsing stays local and read-only; task data is never uploaded |
| Runtime injection feels difficult to undo | **Restore Official Codex** returns to the normal launch path in one step |

## Install

1. Download and extract `codex-conversation-tree-v1.1.1.zip` from the [latest release](https://github.com/ad08642222/codex-conversation-tree/releases/tag/v1.1.1).
2. Double-click `install.cmd`.
3. Launch **Codex Conversation Tree** from the desktop. If Codex is already open, it restarts once and keeps the same official profile and conversations.

No administrator rights or npm install are required. The installer downloads the official portable Node.js runtime, verifies its SHA-256 checksum, and installs to `%LOCALAPPDATA%\CodexConversationTree`.

## Highlights

- Real Codex parent/child task lineage
- The same official profile, login, and conversation list—no separate `CodexProfile`
- Infinite pan, zoom, search, collapse, and node layout
- Sidebar entry and embedded main-workspace viewer
- Native task navigation
- Manual thread-name sync within about five seconds, while search still matches the original generated title
- One-click **Restore Official Codex** rollback
- Automatic recovery when Codex rebuilds the embedded Chromium frame
- Local-only, read-only data access
- Optional Skill for opening the tree by natural language

## Why does Codex restart once?

Codex plugins do not currently expose a public sidebar UI extension point. This project therefore starts the official Codex window with a localhost-only CDP bridge and injects the sidebar entry at runtime. Version 1.1 reuses your existing official profile instead of creating a second profile, so login state and conversation titles stay aligned. A Codex UI update may occasionally require selector maintenance.

Use the desktop **Restore Official Codex** shortcut to stop the local helpers and restart Codex normally without injection. The project never patches `app.asar`.

See the [Chinese README](README.md) for the full architecture, security notes, usage, and troubleshooting.

## Support and feedback

- Questions and setup help: [GitHub Discussions](https://github.com/ad08642222/codex-conversation-tree/discussions)
- Reproducible bugs: [open an Issue](https://github.com/ad08642222/codex-conversation-tree/issues/new/choose)
- Feature requests: use the **Ideas** discussion category

Remove usernames, local paths, thread titles, thread IDs, and tokens from screenshots or logs before posting.

## License

[MIT](LICENSE)
