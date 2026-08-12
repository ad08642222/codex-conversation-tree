# Codex Conversation Tree

A local, read-only infinite tree for real Codex task lineage on Windows—embedded in the Codex workspace.

![Codex Conversation Tree](assets/screenshots/tree-overview.png)

This is an unofficial community project. It reads real `forked_from_id` relationships, adds a **Conversation Tree** entry below **Plugins**, and opens tasks in Codex when you click a node.

## Install

1. Download and extract the repository ZIP.
2. Double-click `install.cmd`.
3. Launch **Codex Conversation Tree** from the desktop. The dedicated Codex window may ask you to sign in once.

No administrator rights or npm install are required. The installer downloads the official portable Node.js runtime, verifies its SHA-256 checksum, and installs to `%LOCALAPPDATA%\CodexConversationTree`.

## Highlights

- Real Codex parent/child task lineage
- Infinite pan, zoom, search, collapse, and node layout
- Sidebar entry and embedded main-workspace viewer
- Native task navigation
- Local-only, read-only data access
- Optional Skill for opening the tree by natural language

## Why a dedicated Codex window?

Codex plugins do not currently expose a public sidebar UI extension point. This project therefore uses a local CDP bridge in an isolated Codex profile. It leaves your normal Codex window alone, but a Codex UI update may occasionally require selector maintenance.

## Similar projects

- [Agentree](https://github.com/serban-cercelescu/Agentree): a broader standalone desktop viewer with message-level branching.
- [Codex Conversation Map](https://github.com/Atman-Angle/Codex-Conversation-Map): semantic maps for Obsidian Canvas/tldraw rather than native task lineage.
- [CodexMonitor ChatTree branch](https://github.com/Reekin/CodexMonitor/tree/feat/chattree-integration): a tree inside an external Codex monitor.

See the [Chinese README](README.md) for the full comparison, architecture, security notes, usage, and troubleshooting.

## License

[MIT](LICENSE)
