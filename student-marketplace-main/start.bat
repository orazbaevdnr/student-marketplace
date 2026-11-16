@echo off
chcp 65001 > nul
title Student Marketplace — Dev Server

echo ========================================================
echo       Starting Student Marketplace Frontend...
echo ========================================================
echo.

:: 1. Проверяем наличие .env, если нет — копируем из .env.example
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] .env not found. Creating from .env.example...
        copy .env.example .env > nul
    )
)

:: 2. Проверяем наличие node_modules
if not exist "node_modules\" (
    echo [INFO] Dependencies not installed. Running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b %errorlevel%
    )
)

echo [INFO] Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo [INFO] Launching Vite dev server...
echo.
call npm run dev

pause
