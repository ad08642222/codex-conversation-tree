Option Explicit
Dim shell, fso, appDir, nodeExe, launcher, command
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
nodeExe = fso.BuildPath(appDir, "runtime\node.exe")
launcher = fso.BuildPath(appDir, "embedded-launcher.js")
command = Chr(34) & nodeExe & Chr(34) & " --no-warnings " & Chr(34) & launcher & Chr(34)
shell.Run command, 0, False
