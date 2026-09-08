<div align="center">

# 🎧 SoundVault

**Offline hi-res audio player, local library manager, metadata sanitizer & sound-bundle sharing — now a native Android application.**

</div>

SoundVault is a fully client-side audio app: import audio files from your phone, clean messy rip filenames, attach cover art, play with an EQ + visualizer, organize tracks into "SoundBundles", and export/share them — **all offline, zero tracking, zero backend**.

This repository contains **two targets built from the same codebase**:

| Target | Where | What it is |
| --- | --- | --- |
| 🌐 **Web / PWA** | repo root (`vite` + React) | The original installable PWA (play store–free install via Chrome). |
| 🤖 **Native Android app** | [`/android`](android) | A real Android Studio project (Java/Gradle) that wraps the web app in Capacitor's native shell — custom launcher icon, splash screen, Android share sheet for exports, hardware-back-button support, haptics permission. |

---

## ✨ Features

- 📂 **Import audio** (`FLAC / WAV / ALAC / M4A / MP3 / OPUS / OGG / AAC`) via the Android file picker
- 🧼 **Smart filename scrubber** — strips `yt_dl` tags, bitrate suffixes, bracket noise, rip IDs
- 🖼️ **Cover art** — upload from the phone, paste a URL, or pick from 6 local offline art presets (no network needed)
- 🎛️ **Player** — 5 EQ presets, volume, seek, visualizer, favorites, gapless crossfade setting
- 📦 **SoundBundles** — group tracks into offline `.soundvault` archives and export them via the Android share sheet
- 📴 **100% offline** — fonts, icons and artwork are bundled locally; music lives in the app's private storage

---

## 🚀 Run as a web app

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # production PWA → dist/
```

## 🤖 Run as an Android app

### Option A — GitHub Actions (no local Android tooling)

1. Push this repository to GitHub.
2. Open **Actions → “Build Android APK” → Run workflow**.
3. Download the **`SoundVault-debug-apk`** artifact when the build finishes.
4. On your Android phone enable *install unknown apps*, then install the APK.

### Option B — Local build (Android Studio / CLI)

Requirements: **Node 20+**, **JDK 21** (Temurin), **Android SDK** (compileSdk 36 — Android Studio will offer to install it).

```bash
./scripts/build-android.sh
# or manually:
npm ci && npm run build && npx cap sync android
cd android && ./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`
Install: `adb install android/app/build/outputs/apk/debug/app-debug.apk` (or copy the APK to the phone).

### Option C — Android Studio

```bash
npm ci && npm run build && npx cap sync android
```
then open the **`android/`** folder in Android Studio and press ▶ Run.

> After changing web code, re-run `npm run build && npx cap sync android` (or `npx cap copy android` for just the web assets).

---

## 📱 What was adapted for native Android

- **`android/`** — full Capacitor 8 project: `com.soundvault.app`, minSdk 24 (Android 7+), target/compile SDK 36, dark theme, Android 12+ splash screen.
- **Launcher icon & splash** — generated from `public/icon.svg` for every density, including an adaptive-icon foreground layer fitted to the 66dp safe zone (`node scripts/generate-android-icons.mjs`).
- **`src/utils/nativeBridge.ts`** — platform bridge:
  - *Export / share files* (tracks & bundles) → real **Android share sheet** (web keeps `<a download>`).
  - *Copy link* → native clipboard (web: `navigator.clipboard`).
  - *Hardware back button* → closes sheets/modals → collapses the fullscreen player → backgrounds the app (instead of exiting).
- **Haptics** — `VIBRATE` permission declared; `navigator.vibrate` works inside the WebView.
- **`audioEngine` fix** — imported songs persisted in IndexedDB as blobs now **play again after an app restart** (fresh object URL is minted from the stored blob).
- **Offline fonts** — Inter / JetBrains Mono / Material Symbols are self-hosted under `public/fonts/` (no Google Fonts dependency at runtime).
- **Offline artwork** — the Unsplash-hosted preset covers were replaced with locally generated SVG art (`src/utils/coverArt.ts`), and every cover `<img>` falls back to local art on error.
- **Install CTA** — inside the native app, the “Install App” pill becomes an “Android App” badge.

## ⚠️ Known limitations (WebView shell)

- **Lockscreen media controls** rely on the WebView's MediaSession support — playback controls may not appear on the lock screen / notification shade on all Android versions. True lockscreen + always-on background playback would need a native foreground media service (a possible future extension of this project).
- Audio keeps playing while the app is backgrounded on most devices, but the OS may pause it under memory pressure; re-opening the app resumes normally. Your library itself is never lost (IndexedDB persistence).
- “Parse URL” in Import is a simulated flow; real remote streaming would require a network stack (the app is deliberately offline-first).

## 🗂 Project structure

```
├── public/fonts/          self-hosted fonts (offline)
├── src/
│   ├── utils/nativeBridge.ts   Capacitor ↔ web platform bridge
│   ├── utils/coverArt.ts       local SVG cover-art generator + presets
│   ├── utils/audioEngine.ts    audio engine (EQ, MediaSession, synth fallback)
│   └── components/             React UI (Vault, Player, Import, Bundles…)
├── android/               native Android project (Capacitor)
├── scripts/               icon generator + local APK build script
└── .github/workflows/     cloud APK builds (Actions)
```

## 🔐 Privacy

Everything is stored **on your device** (IndexedDB / localStorage inside the app sandbox). No accounts, no telemetry, no servers.
