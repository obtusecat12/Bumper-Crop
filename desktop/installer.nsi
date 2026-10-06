Unicode true
!include "MUI2.nsh"
Name "Backrooms V98"
OutFile "Backrooms-V98-Windows-Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\BackroomsV98"
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 32
BrandingText "Backrooms V98 | Offline Desktop"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\Backrooms.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Backrooms V98"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"
Section "Game"
SetShellVarContext current
SetOutPath "$INSTDIR"
File "Backrooms.exe"
File "README.txt"
SetOutPath "$INSTDIR\game"
File /r "../dist/*"
WriteUninstaller "$INSTDIR\Uninstall.exe"
CreateShortcut "$DESKTOP\Backrooms V98.lnk" "$INSTDIR\Backrooms.exe"
CreateDirectory "$SMPROGRAMS\Backrooms V98"
CreateShortcut "$SMPROGRAMS\Backrooms V98\Backrooms V98.lnk" "$INSTDIR\Backrooms.exe"
CreateShortcut "$SMPROGRAMS\Backrooms V98\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BackroomsV98" "DisplayName" "Backrooms V98"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BackroomsV98" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BackroomsV98" "DisplayVersion" "98.0"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BackroomsV98" "DisplayIcon" "$INSTDIR\Backrooms.exe"
WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BackroomsV98" "EstimatedSize" 240000
SectionEnd
Section "Uninstall"
SetShellVarContext current
Delete "$DESKTOP\Backrooms V98.lnk"
Delete "$SMPROGRAMS\Backrooms V98\Backrooms V98.lnk"
Delete "$SMPROGRAMS\Backrooms V98\Uninstall.lnk"
RMDir "$SMPROGRAMS\Backrooms V98"
RMDir /r "$INSTDIR\game"
Delete "$INSTDIR\Backrooms.exe"
Delete "$INSTDIR\README.txt"
Delete "$INSTDIR\Uninstall.exe"
RMDir "$INSTDIR"
DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BackroomsV98"
SectionEnd
