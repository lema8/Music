export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  durationFormatted: string; // e.g. "06:24"
  format: string; // e.g. "FLAC 24/192", "WAV 32-bit", "320kbps"
  formatType: 'FLAC' | 'WAV' | 'MP3' | 'ALAC' | 'M4A' | 'OPUS' | 'OGG';
  fileSizeMB: number;
  dynamicRange?: string; // e.g. "DR14"
  bitrate?: string;
  sampleRate?: string;
  coverArt: string;
  originalRawName?: string;
  audioUrl?: string; // object URL or synth key
  dateAdded: string;
  isFavorite: boolean;
  isLossless: boolean;
  tags?: string[];
  audioBlob?: Blob;
}

export interface SoundBundle {
  id: string;
  title: string;
  trackCount: number;
  totalSizeMB: number;
  lossless: boolean;
  coverArt: string;
  tags: string[];
  trackIds: string[];
  sharedWith?: string;
  status: 'SYNCED' | 'READY' | 'BROADCASTING';
  formatLabel: string;
  dateCreated: string;
}

export type EQPreset = 'Studio Warmth' | 'Bass Boost' | 'Hi-Res Clarity' | 'Direct Neutral' | 'Vocal Focus';

export type OutputRoute = 'USB DAC / ASIO' | 'Internal 32-bit DAC' | 'Bluetooth LDAC 990k';

export interface AppSettings {
  smartSanitizer: boolean;
  defaultBitrateLossless: boolean;
  autoEmbedID3: boolean;
  bitPerfectPlayback: boolean;
  gaplessCrossfadeSec: number;
  replayGain: boolean;
  wifiOnlyIngest: boolean;
  localP2PSharing: boolean;
}

export type ActiveTab = 'vault' | 'import' | 'player' | 'bundles' | 'settings';

export type VaultFilter = 'all' | 'recent' | 'hires' | 'bundles' | 'tags';
