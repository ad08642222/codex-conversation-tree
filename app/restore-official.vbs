Option Explicit
Dim shell, fso, appDir, nodeExe, launcher, command
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
nodeExe = fso.BuildPath(appDir, "runtime\node.exe")
launcher = fso.BuildPath(appDir, "restore-official.js")
If Not fso.FileExists(nodeExe) Then
  MsgBox "Portable Node.js runtime was not found. Reinstall Codex Conversation Tree.", 16, "Restore Official Codex"
  WScript.Quit 1
End If
command = Chr(34) & nodeExe & Chr(34) & " --no-warnings " & Chr(34) & launcher & Chr(34)
shell.Run command, 0, False
