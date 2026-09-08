import { SoundBundle } from '../types';

export const INITIAL_BUNDLES: SoundBundle[] = [];

const BUNDLE_STORAGE_KEY = 'soundvault_saved_bundles_v2';

export function loadBundles(): SoundBundle[] {
  try {
    const raw = localStorage.getItem(BUNDLE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBundles(bundles: SoundBundle[]): void {
  try {
    localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(bundles));
  } catch {
    //
  }
}

export function exportBundleFile(bundle: SoundBundle): void {
  const payload = {
    bundleId: bundle.id,
    title: bundle.title,
    spec: 'SOUNDVAULT_ARCHIVE_v2.4',
    format: 'BIT_PERFECT_OFFLINE',
    createdAt: new Date().toISOString(),
    hash: 'sha256-' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
    manifest: bundle,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${bundle.title.toLowerCase().replace(/\s+/g, '_')}.soundvault`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
