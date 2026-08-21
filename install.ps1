param(
  [string]$InstallDir = (Join-Path $env:LOCALAPPDATA 'CodexConversationTree'),
  [switch]$SkipPlugin,
  [switch]$NoShortcut,
  [switch]$NoLaunch
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$appSource = Join-Path $repoRoot 'app'
$nodeVersion = '22.23.2'
$nodeArchive = "node-v$nodeVersion-win-x64.zip"
$nodeBaseUrl = "https://nodejs.org/dist/v$nodeVersion"

if (-not (Test-Path -LiteralPath (Join-Path $appSource 'server.js'))) {
  throw 'The app source is incomplete. Download or clone the whole repository.'
}
if (-not (Get-AppxPackage OpenAI.Codex -ErrorAction SilentlyContinue)) {
  throw 'OpenAI Codex for Windows is not installed.'
}

Write-Host "Installing Codex Conversation Tree to $InstallDir" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
Copy-Item -Path (Join-Path $appSource '*') -Destination $InstallDir -Recurse -Force

$runtimeDir = Join-Path $InstallDir 'runtime'
$nodeExe = Join-Path $runtimeDir 'node.exe'
if (-not (Test-Path -LiteralPath $nodeExe)) {
  $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("codex-tree-" + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
  try {
    $zipPath = Join-Path $tempRoot $nodeArchive
    $sumsPath = Join-Path $tempRoot 'SHASUMS256.txt'
    Write-Host "Downloading the official Node.js $nodeVersion portable runtime..."
    Invoke-WebRequest -UseBasicParsing -Uri "$nodeBaseUrl/$nodeArchive" -OutFile $zipPath
    Invoke-WebRequest -UseBasicParsing -Uri "$nodeBaseUrl/SHASUMS256.txt" -OutFile $sumsPath
    $expected = (Get-Content -LiteralPath $sumsPath | Where-Object { $_ -match "\s+$([regex]::Escape($nodeArchive))$" } | Select-Object -First 1) -split '\s+' | Select-Object -First 1
    if (-not $expected) { throw 'The Node.js checksum was not found.' }
    $actual = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $expected.ToLowerInvariant()) { throw 'Node.js checksum verification failed.' }
    Expand-Archive -LiteralPath $zipPath -DestinationPath $tempRoot -Force
    New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $tempRoot "node-v$nodeVersion-win-x64\node.exe") -Destination $nodeExe -Force
  } finally {
    if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force }
  }
}

if (-not $SkipPlugin) {
  $pluginDir = Join-Path $env:USERPROFILE 'plugins\codex-conversation-tree'
  New-Item -ItemType Directory -Path $pluginDir -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $repoRoot '.codex-plugin') -Destination $pluginDir -Recurse -Force
  Copy-Item -LiteralPath (Join-Path $repoRoot 'skills') -Destination $pluginDir -Recurse -Force
  Copy-Item -LiteralPath (Join-Path $repoRoot 'scripts') -Destination $pluginDir -Recurse -Force

  $marketplacePath = Join-Path $env:USERPROFILE '.agents\plugins\marketplace.json'
  $marketplaceDir = Split-Path -Parent $marketplacePath
  New-Item -ItemType Directory -Path $marketplaceDir -Force | Out-Null
  if (Test-Path -LiteralPath $marketplacePath) {
    $marketplace = Get-Content -LiteralPath $marketplacePath -Raw | ConvertFrom-Json
  } else {
    $marketplace = [pscustomobject]@{ name='personal'; interface=[pscustomobject]@{ displayName='Personal' }; plugins=@() }
  }
  $entries = @($marketplace.plugins | Where-Object { $_.name -ne 'codex-conversation-tree' })
  $entries += [pscustomobject]@{
    name='codex-conversation-tree'
    source=[pscustomobject]@{ source='local'; path='./plugins/codex-conversation-tree' }
    policy=[pscustomobject]@{ installation='AVAILABLE'; authentication='ON_INSTALL' }
    category='Productivity'
  }
  $marketplace.plugins = $entries
  $marketplace | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $marketplacePath -Encoding UTF8
}

if (-not $NoShortcut) {
  $desktop = [Environment]::GetFolderPath('Desktop')
  $shortcutPath = Join-Path $desktop 'Codex Conversation Tree.lnk'
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = Join-Path $InstallDir 'start-embedded-codex.cmd'
  $shortcut.WorkingDirectory = $InstallDir
  $shortcut.Description = 'Open the official Codex window with the embedded conversation tree'
  $shortcut.Save()

  $restoreShortcutPath = Join-Path $desktop 'Restore Official Codex.lnk'
  $restoreShortcut = $shell.CreateShortcut($restoreShortcutPath)
  $restoreShortcut.TargetPath = Join-Path $InstallDir 'restore-official-codex.cmd'
  $restoreShortcut.WorkingDirectory = $InstallDir
  $restoreShortcut.Description = 'Restart Codex normally without the conversation tree injection'
  $restoreShortcut.Save()
}

Write-Host 'Installation complete.' -ForegroundColor Green
Write-Host 'Use the desktop shortcut: Codex Conversation Tree'
Write-Host 'Use Restore Official Codex to disable the injection and return to the normal launcher.'
if (-not $NoLaunch) {
  Start-Process -FilePath 'wscript.exe' -ArgumentList (Join-Path $InstallDir 'embedded-launcher.vbs') -WindowStyle Hidden
}
