# Contributing

Issues and focused pull requests are welcome.

Before submitting a change:

1. Run `node --check app/server.js`.
2. Run `node --check app/inject.js`.
3. Run `node --check app/embedded-launcher.js`.
4. Run `node --check app/restore-official.js`.
5. Confirm the tree opens in the existing official profile, renamed threads refresh, a Codex main-workspace remount repopulates the embedded frame, native navigation restores the Codex workspace, and abnormal pointer cancellation does not leave the canvas dragging.
6. Confirm `app/restore-official.js` detects the packaged launcher name, `embedded-launcher.js`.

Do not commit screenshots containing real thread titles, working directories, account names, or session identifiers.
