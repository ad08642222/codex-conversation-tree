Option Explicit
Dim shell, fso, appDir, nodeExe, serverJs, command
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
nodeExe = fso.BuildPath(appDir, "runtime\node.exe")
serverJs = fso.BuildPath(appDir, "server.js")
command = Chr(34) & nodeExe & Chr(34) & " --no-warnings " & Chr(34) & serverJs & Chr(34)
shell.Run command, 0, False

