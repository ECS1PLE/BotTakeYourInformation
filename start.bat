@echo off
setlocal
mode con: cols=44 lines=7
title Управление сервером и панелью
cd bot
start /B node server.js
cd ..
cd panel
start /B npm run dev
cd ..