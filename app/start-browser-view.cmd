@echo off
setlocal
set "APP_DIR=%~dp0"
set "NODE_EXE=%APP_DIR%runtime\node.exe"
if not exist "%NODE_EXE%" (
  echo [Codex Conversation Tree] Missing runtime\node.exe
  pause
  exit /b 1
)
wscript.exe "%APP_DIR%launch.vbs"
endlocal
