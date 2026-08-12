param([switch]$KeepPlugin)
$ErrorActionPreference = 'Stop'
$installDir = Join-Path $env:LOCALAPPDATA 'CodexConversationTree'

Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq 'node.exe' -and $_.ExecutablePath -and $_.ExecutablePath.StartsWith($installDir, [System.StringComparison]::OrdinalIgnoreCase)
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

$desktopShortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Codex Conversation Tree.lnk'
if (Test-Path -LiteralPath $desktopShortcut) { Remove-Item -LiteralPath $desktopShortcut -Force }
if (Test-Path -LiteralPath $installDir) { Remove-Item -LiteralPath $installDir -Recurse -Force }

if (-not $KeepPlugin) {
  $pluginDir = Join-Path $env:USERPROFILE 'plugins\codex-conversation-tree'
  if (Test-Path -LiteralPath $pluginDir) { Remove-Item -LiteralPath $pluginDir -Recurse -Force }
  $marketplacePath = Join-Path $env:USERPROFILE '.agents\plugins\marketplace.json'
  if (Test-Path -LiteralPath $marketplacePath) {
    $marketplace = Get-Content -LiteralPath $marketplacePath -Raw | ConvertFrom-Json
    $marketplace.plugins = @($marketplace.plugins | Where-Object { $_.name -ne 'codex-conversation-tree' })
    $marketplace | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $marketplacePath -Encoding UTF8
  }
}
Write-Host 'Codex Conversation Tree was removed.' -ForegroundColor Green

