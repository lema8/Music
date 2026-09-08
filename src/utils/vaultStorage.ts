import { Track } from '../types';

export const INITIAL_TRACKS: Track[] = [];

const DB_NAME = 'SoundVaultDB';
const DB_VERSION = 2;
const STORE_NAME = 'tracks';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Dummy track IDs to purge from previous versions
const LEGACY_MOCK_IDS = new Set(['track-1', 'track-2', 'track-3', 'track-4', 'track-5', 'track-6']);

export async function loadVaultTracks(): Promise<Track[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const allStored = await new Promise<Track[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as Track[]);
      req.onerror = () => reject(req.error);
    });

    if (!allStored || allStored.length === 0) {
      return [];
    }

    // Clean out any legacy mock demo tracks so the user sees ONLY their imported songs
    const userTracks: Track[] = [];
    for (const track of allStored) {
      if (LEGACY_MOCK_IDS.has(track.id)) {
        store.delete(track.id);
      } else {
        userTracks.push(track);
      }
    }

    return userTracks;
  } catch {
    return [];
  }
}

export async function saveVaultTrack(track: Track): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(track);
  } catch {
    // Fallback: silently fail or handle gracefully
  }
}

export async function deleteVaultTrack(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(trackId);
  } catch {
    //
  }
}

/**
 * Intelligent Smart Filename Cleaner
 * Removes .m4a, bitrate tags, ripped IDs, track counters, brackets
 */
export function sanitizeAudioFilename(filename: string): { title: string; artist: string; album: string } {
  // Strip file extension
  let clean = filename.replace(/\.(mp3|wav|flac|alac|m4a|aac|ogg|opus|aiff)$/i, '');

  // Strip YouTube DL tags, rip IDs, bitrate suffixes like _1080p_rip, _v837492, [Official Video]
  clean = clean.replace(/\[.*?\]|\(.*?\)/g, ' ');
  clean = clean.replace(/yt_dl_audio_stream[a-zA-Z0-9_-]*/gi, '');
  clean = clean.replace(/_1080p_rip|_720p|_320kbps|_hq|_master|_final|_v\d+/gi, '');
  clean = clean.replace(/official video|music video|audio rip|lyric video/gi, '');

  // Replace underscores and repeated dashes with single space
  clean = clean.replace(/[_\-]+/g, ' ').trim();

  // Split on hyphen or "by" if present to separate artist & title
  let artist = 'Unknown Artist';
  let title = clean;
  let album = 'Local Vault Master';

  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } else if (clean.toLowerCase().includes(' by ')) {
    const parts = clean.split(/ by /i);
    title = parts[0].trim();
    artist = parts[1].trim();
  }

  // Capitalize nicely
  const titleCase = (str: string) =>
    str
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

  title = titleCase(title) || 'Imported Audio';
  artist = titleCase(artist) || 'SoundVault Artist';

  return { title, artist, album };
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Utility to convert an image File or Blob into a base64 Data URL
 * so it can be reliably persisted into IndexedDB and loaded offline without expiring object URLs.
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
