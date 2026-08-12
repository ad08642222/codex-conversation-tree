# Security

Codex Conversation Tree is local-first and read-only. It reads Codex's local thread index and the first `session_meta` record from rollout files. It does not upload transcripts or require an API key.

## Local debugging bridge

The embedded view starts a dedicated Codex window with Chromium DevTools Protocol (CDP) bound to `127.0.0.1:9239`. CDP is not authenticated. Other processes running under the same Windows account may be able to connect while the embedded Codex window is open.

The project does not patch `app.asar`, replace Codex binaries, or edit Codex session data. Close the dedicated Codex window when you do not need the embedded view.

## Reporting a vulnerability

Please open a GitHub security advisory rather than a public issue when the report contains a working exploit or sensitive local data.

