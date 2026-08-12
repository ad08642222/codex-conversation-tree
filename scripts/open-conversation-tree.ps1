$launcher = Join-Path $env:LOCALAPPDATA 'CodexConversationTree\embedded-launcher.vbs'
if (-not (Test-Path -LiteralPath $launcher)) {
  throw 'Codex Conversation Tree is not installed. Run install.cmd from the repository first.'
}
Start-Process -FilePath 'wscript.exe' -ArgumentList $launcher -WindowStyle Hidden

