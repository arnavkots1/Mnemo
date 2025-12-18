@echo off
echo ========================================
echo Mnemo - Android Emulator Setup Checker
echo ========================================
echo.

echo [1/5] Checking Android Studio installation...
if exist "C:\Program Files\Android\Android Studio" (
    echo [OK] Android Studio found!
) else (
    echo [X] Android Studio not found
    echo     Download from: https://developer.android.com/studio
)
echo.

echo [2/5] Checking Android SDK...
if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
    echo [OK] Android SDK found!
    set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
) else (
    echo [X] Android SDK not found
    echo     Install through Android Studio SDK Manager
)
echo.

echo [3/5] Checking ADB (Platform Tools)...
where adb >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] ADB is available!
    adb --version
) else (
    echo [X] ADB not found
    echo     Add to PATH: %%ANDROID_HOME%%\platform-tools
)
echo.

echo [4/5] Checking Emulator...
where emulator >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Emulator is available!
    echo Available AVDs:
    emulator -list-avds
) else (
    echo [X] Emulator not found
    echo     Add to PATH: %%ANDROID_HOME%%\emulator
)
echo.

echo [5/5] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js is available!
    node --version
) else (
    echo [X] Node.js not found
)
echo.

echo ========================================
echo Setup Status:
echo ========================================
echo If all checks pass [OK], you're ready!
echo If any check fails [X], follow ANDROID_EMULATOR_SETUP.md
echo.
pause

