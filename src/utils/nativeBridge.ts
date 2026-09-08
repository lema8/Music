/**
 * Native Android bridge (Capacitor).
 *
 * The SoundVault web app is packaged as a native Android application with
 * Capacitor. In a normal browser / PWA these helpers transparently fall
 * back to the classic web behaviours, so this file never breaks the
 * existing web deployment — it only *adds* native behaviour when the app
 * is running inside the Capacitor Android WebView (window.Capacitor).
 */
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';

/** True when the app runs inside the Capacitor native Android shell. */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/** True on the Android platform (native shell or Android browser). */
export const isAndroidPlatform = (): boolean => {
  if (isNativeApp()) return true;
  return /android/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');
};

// ---------------------------------------------------------------------------
// File export / share
// ---------------------------------------------------------------------------

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data: URL prefix — Capacitor Filesystem wants raw base64.
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Classic browser download fallback used by the web / PWA version. */
function browserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a tick to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Export a Blob to the user.
 *  - Native Android: writes the file into the app cache, then opens the
 *    Android share sheet ("Export" / "Save to Files" / Bluetooth / …).
 *    The cache copy is cleaned up afterwards.
 *  - Web / PWA: falls back to a regular `<a download>`.
 */
export async function exportFile(blob: Blob, filename: string): Promise<'shared' | 'downloaded' | 'failed'> {
  if (isNativeApp()) {
    try {
      const base64 = await blobToBase64(blob);
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `soundvault-exports/${Date.now()}-${safeName}`;
      const written = await Filesystem.writeFile({
        path: filePath,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      });

      try {
        await Share.share({
          title: safeName,
          text: `SoundVault export: ${safeName}`,
          url: written.uri,
          dialogTitle: 'Export from SoundVault',
        });
        return 'shared';
      } finally {
        // Best-effort cleanup of the temporary cache file.
        try {
          await Filesystem.deleteFile({ path: filePath, directory: Directory.Cache });
        } catch {
          // Cache is auto-managed by Android anyway — ignore.
        }
      }
    } catch {
      return 'failed';
    }
  }

  try {
    browserDownload(blob, filename);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

/** Copy text; resolves to true when the write went through. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (isNativeApp()) {
      await Clipboard.write({ string: text });
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy textarea trick.
  }

  // Legacy fallback for non-secure contexts (plain http hosting).
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Android hardware back button
// ---------------------------------------------------------------------------

let backButtonHandle: { remove: () => void } | null = null;

/**
 * Register a single Android hardware-back handler.
 *
 * Capacitor's default behaviour would exit the app on the first back press
 * (or walk the WebView history, which this SPA never uses), so we map the
 * back button to the app's own overlay stack instead: `onBackPressed` is
 * invoked while an overlay/modal is open (App.tsx closes it), and when
 * nothing is open the app is minimised to the home screen — like a normal
 * Android media app — instead of being killed.
 */
export function registerAndroidBackButton(onBackPressed: () => void): void {
  if (!isNativeApp()) return;
  // Only ever one registration (App.tsx re-mounts under StrictMode).
  if (backButtonHandle) return;

  App.addListener('backButton', () => {
    onBackPressed();
  }).then((handle) => {
    backButtonHandle = handle;
  });
}

/** Send the native app to the background (Android home screen). */
export function minimizeAndroidApp(): void {
  if (!isNativeApp()) return;
  try {
    void App.minimizeApp();
  } catch {
    // ignore
  }
}
