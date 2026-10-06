' Starts run-admin-background.cmd with no window, for the logon task
Set shell = CreateObject("WScript.Shell")
folder = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
shell.Run "cmd /c """ & folder & "\run-admin-background.cmd""", 0, True
