# Changelog

## 1.1.1

- Reload the embedded tree after Codex recreates its Chromium frame, preventing a blank black page after main-workspace remounts.

## 1.1.0

- Replaced the isolated `CodexProfile` window with the user's existing official Codex profile.
- Added a one-click **Restore Official Codex** launcher that removes the runtime injection after restart.
- Synced manually renamed thread names via `threads.name`, with automatic fallback to the generated title.
- Added five-second quiet title refresh and immediate refresh when the embedded view becomes visible.
- Preserved search across both the manual name and the original generated title.
- Tied the local read-only server lifetime to the launcher and expanded live verification.

## 1.0.0

- Embedded conversation tree entry below Codex Plugins.
- Infinite parent/child lineage from `forked_from_id`.
- Pan, zoom, search, collapse, archive visibility, details, and native thread navigation.
- Pointer-capture cleanup for cancel, blur, hidden documents, and lost capture.
- Single-instance launcher and automatic monitor shutdown.
- One-click Windows installer, uninstaller, plugin manifest, and Skill.
