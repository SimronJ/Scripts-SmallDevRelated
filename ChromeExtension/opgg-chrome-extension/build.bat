@echo off
echo Building OP.GG Stats Card Chrome Extension...

REM Check if icons folder exists
if not exist "icons" (
    echo Creating icons folder...
    mkdir icons
    echo Please run create-icons.html to generate the required icon files
    echo Then place them in the icons/ folder with these names:
    echo   icon16.png
    echo   icon32.png
    echo   icon48.png
    echo   icon128.png
    pause
    exit /b 1
)

REM Check if all required icon files exist
if not exist "icons\icon16.png" (
    echo Missing icon16.png
    echo Please generate icons using create-icons.html
    pause
    exit /b 1
)
if not exist "icons\icon32.png" (
    echo Missing icon32.png
    echo Please generate icons using create-icons.html
    pause
    exit /b 1
)
if not exist "icons\icon48.png" (
    echo Missing icon48.png
    echo Please generate icons using create-icons.html
    pause
    exit /b 1
)
if not exist "icons\icon128.png" (
    echo Missing icon128.png
    echo Please generate icons using create-icons.html
    pause
    exit /b 1
)

REM Create ZIP file for Chrome Web Store
echo Creating extension package...
powershell -Command "Compress-Archive -Path . -DestinationPath ..\opgg-stats-card-extension.zip -Force"

if exist "..\opgg-stats-card-extension.zip" (
    echo Successfully created opgg-stats-card-extension.zip
    echo This file is ready for Chrome Web Store submission
) else (
    echo Failed to create ZIP file
    pause
    exit /b 1
)

echo.
echo Extension package created successfully!
echo You can now:
echo 1. Test the extension by loading it in Chrome
echo 2. Submit opgg-stats-card-extension.zip to Chrome Web Store
echo.
pause 