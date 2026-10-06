@echo off
setlocal
cd /d "%~dp0"
where gcc >nul 2>nul
if errorlevel 1 (
 echo Install a 64-bit MinGW-w64 toolchain and add its bin folder to PATH.
 exit /b 1
)
where makensis >nul 2>nul
if errorlevel 1 (
 echo Install NSIS and add its directory to PATH.
 exit /b 1
)
gcc -Os -s -static -municode -mwindows launcher.c -o Backrooms.exe -lws2_32 -lshell32
if errorlevel 1 exit /b 1
makensis installer.nsi
if errorlevel 1 exit /b 1
echo Created Backrooms-V98-Windows-Setup.exe
