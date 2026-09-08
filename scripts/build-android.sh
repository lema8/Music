#!/usr/bin/env bash
#
# Build an installable SoundVault Android APK locally.
#
# Requirements:
#   - Node.js 20+  (npm)
#   - JDK 21       (e.g. Temurin 21)
#   - Android SDK  (ANDROID_HOME set; platform android-36 + build-tools 36
#                   auto-installed by Gradle/Android Studio if licensed)
#
# Output: android/app/build/outputs/apk/debug/app-debug.apk
#
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 1/4 Installing npm dependencies"
npm ci

echo "==> 2/4 Building the web bundle"
npm run build

echo "==> 3/4 Copying web assets into the native Android project"
npx cap sync android

echo "==> 4/4 Compiling the debug APK (first run downloads Gradle + SDK deps)"
cd android
./gradlew assembleDebug --no-daemon

APK="app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "✔ Done! Installable APK: android/${APK}"
echo "  Install it on a device via:  adb install ${APK}"
