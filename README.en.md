# Codex Conversation Tree

A local, read-only infinite tree for real Codex task lineage on Windows—embedded in the Codex workspace.

![Codex Conversation Tree](assets/screenshots/tree-overview.png)

This is an unofficial community project. It reads real `forked_from_id` relationships, adds a **Conversation Tree** entry below **Plugins**, and opens tasks in Codex when you click a node.

## Install

1. Download and extract the repository ZIP.
2. Double-click `install.cmd`.
3. Launch **Codex Conversation Tree** from the desktop. If Codex is already open, it restarts once and keeps the same official profile and conversations.

No administrator rights or npm install are required. The installer downloads the official portable Node.js runtime, verifies its SHA-256 checksum, and installs to `%LOCALAPPDATA%\CodexConversationTree`.

## Highlights

- Real Codex parent/child task lineage
- Infinite pan, zoom, search, collapse, and node layout
- Sidebar entry and embedded main-workspace viewer
- Native task navigation
- Manual thread-name sync within about five seconds, while search still matches the original generated title
- Local-only, read-only data access
- Optional Skill for opening the tree by natural language

## Why does Codex restart once?

Codex plugins do not currently expose a public sidebar UI extension point. This project therefore starts the official Codex window with a localhost-only CDP bridge and injects the sidebar entry at runtime. Version 1.1 reuses your existing official profile instead of creating a second profile, so login state and conversation titles stay aligned. A Codex UI update may occasionally require selector maintenance.

Use the desktop **Restore Official Codex** shortcut to stop the local helpers and restart Codex normally without injection. The project never patches `app.asar`.

## Similar projects

- [Agentree](https://github.com/serban-cercelescu/Agentree): a broader standalone desktop viewer with message-level branching.
- [Codex Conversation Map](https://github.com/Atman-Angle/Codex-Conversation-Map): semantic maps for Obsidian Canvas/tldraw rather than native task lineage.
- [CodexMonitor ChatTree branch](https://github.com/Reekin/CodexMonitor/tree/feat/chattree-integration): a tree inside an external Codex monitor.

See the [Chinese README](README.md) for the full comparison, architecture, security notes, usage, and troubleshooting.

## Support and feedback

- Questions and setup help: [GitHub Discussions](https://github.com/ad08642222/codex-conversation-tree/discussions)
- Reproducible bugs: [open an Issue](https://github.com/ad08642222/codex-conversation-tree/issues/new/choose)
- Feature requests: use the **Ideas** discussion category

Remove usernames, local paths, thread titles, thread IDs, and tokens from screenshots or logs before posting.

## License

[MIT](LICENSE)
