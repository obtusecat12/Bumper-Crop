#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
x86_64-w64-mingw32-gcc -Os -s -static -municode -mwindows launcher.c -o Backrooms.exe -lws2_32 -lshell32
makensis installer.nsi
