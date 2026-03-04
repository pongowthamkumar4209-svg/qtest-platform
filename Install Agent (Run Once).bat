@echo off
title QTest Agent Installer
echo ================================================
echo   QTest Agent - One Time Setup
echo ================================================
echo.
echo Installing required packages...
pip install requests pystray pillow
echo.
echo Adding agent to Windows startup...
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SCRIPT_DIR=%~dp0

echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\create_shortcut.vbs"
echo Set oShortcut = WshShell.CreateShortcut("%STARTUP%\QTest Agent.lnk") >> "%TEMP%\create_shortcut.vbs"
echo oShortcut.TargetPath = "pythonw.exe" >> "%TEMP%\create_shortcut.vbs"
echo oShortcut.Arguments = "%SCRIPT_DIR%qtest_agent_tray.py" >> "%TEMP%\create_shortcut.vbs"
echo oShortcut.WorkingDirectory = "%SCRIPT_DIR%" >> "%TEMP%\create_shortcut.vbs"
echo oShortcut.Save >> "%TEMP%\create_shortcut.vbs"
cscript //nologo "%TEMP%\create_shortcut.vbs"

echo.
echo ================================================
echo   Setup Complete!
echo ================================================
echo.
echo - Agent will AUTO-START every time Windows starts
echo - Starting agent now...
echo.
start "" pythonw.exe "%SCRIPT_DIR%qtest_agent_tray.py"
echo Agent started! Look for the QTest icon in your system tray (bottom right).
echo.
pause
