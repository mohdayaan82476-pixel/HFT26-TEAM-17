@echo off
title Exoplanet Odyssey 3D
echo Starting Exoplanet Odyssey Local Web Server...
set PYTHON_PATH="C:\Users\sachin\.local\bin\python3.11.exe"
if exist %PYTHON_PATH% (
    %PYTHON_PATH% serve.py
) else (
    python serve.py
)
pause
