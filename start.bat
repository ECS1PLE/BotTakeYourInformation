@echo off
setlocal
cd bot
start /B node server.js
cd ..
cd panel
start /B npm run dev
cd ..