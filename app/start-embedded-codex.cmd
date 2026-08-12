@echo off
setlocal
set "APP_DIR=%~dp0"
wscript.exe "%APP_DIR%embedded-launcher.vbs"
endlocal
