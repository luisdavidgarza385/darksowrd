echo off
title SPECTRAL X PRO - Web Control Server
color 0A
echo.
echo  ╔══════════════════════════════════════╗
echo  ║  SPECTRAL X PRO - Web Control Panel ║
echo  ╚══════════════════════════════════════╝
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python no encontrado. Instalar desde python.org
    echo.
    pause
    exit /b 1
)

echo Instalando dependencias...
pip install websocket_server --quiet 2>nul
echo.

echo Iniciando servidor...
echo.
python "%~dp0server.py" %*

pause
