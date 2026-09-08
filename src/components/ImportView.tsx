import React, { useState, useRef } from 'react';
import { Track } from '../types';
import { sanitizeAudioFilename, formatTime, fileToDataUrl } from '../utils/vaultStorage';
import { triggerHaptic } from '../utils/haptics';
import { CoverArtPickerModal, COVER_PRESETS } from './CoverArtPickerModal';
import { coverOnError } from '../utils/coverArt';

interface ImportViewProps {
  onAddTrackToVault: (newTrack: Track) => void;
  recentTracks?: Track[];
}

export const ImportView: React.FC<ImportViewProps> = ({ onAddTrackToVault, recentTracks = [] }) => {
  const [streamUrl, setStreamUrl] = useState('');
  const [isFetchingStream, setIsFetchingStream] = useState(false);
  const [fetchButtonText, setFetchButtonText] = useState('Parse URL');

  // Staged track state
  const [hasFileStaged, setHasFileStaged] = useState(false);
  const [rawFilename, setRawFilename] = useState('');
  const [scrubEnabled, setScrubEnabled] = useState(true);
  const [stagedTitle, setStagedTitle] = useState('');
  const [stagedArtist, setStagedArtist] = useState('');
  const [stagedAlbum, setStagedAlbum] = useState('Offline Vault Master');
  const [targetFormat, setTargetFormat] = useState<'ALAC' | 'FLAC' | 'WAV' | 'MP3'>('FLAC');
  const [targetBitrate, setTargetBitrate] = useState('BIT-EXACT 192k');
  const [stagedCoverArt, setStagedCoverArt] = useState(COVER_PRESETS[0].url);
  const [stagedAudioBlob, setStagedAudioBlob] = useState<Blob | null>(null);
  const [stagedAudioUrl, setStagedAudioUrl] = useState<string>('');
  const [stagedDuration, setStagedDuration] = useState<number>(240);
  const [stagedFileSizeMB, setStagedFileSizeMB] = useState<number>(25);

  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [saveBtnSuccess, setSaveBtnSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const directCoverInputRef = useRef<HTMLInputElement>(null);

  // Handle URL fetch simulation/parsing
  const handleFetchStream = () => {
    if (!streamUrl.trim()) return;
    setIsFetchingStream(true);
    setFetchButtonText('Parsing Audio...');
    triggerHaptic('medium');

    setTimeout(() => {
      setIsFetchingStream(false);
      setFetchButtonText('Loaded!');
      setHasFileStaged(true);

      const filename = streamUrl.split('/').pop()?.split('?')[0] || 'stream_audio_rip.m4a';
      setRawFilename(filename);

      if (scrubEnabled) {
        const cleaned = sanitizeAudioFilename(filename);
        setStagedTitle(cleaned.title);
        setStagedArtist(cleaned.artist);
        setStagedAlbum(cleaned.album);
      } else {
        setStagedTitle(filename);
        setStagedArtist('Downloaded Audio');
      }

      setStagedDuration(215);
      setStagedFileSizeMB(18);

      setTimeout(() => {
        setFetchButtonText('Parse URL');
      }, 2000);
    }, 900);
  };

  // Handle Scrub Switch toggle
  const handleToggleScrub = () => {
    triggerHaptic('light');
    const nextVal = !scrubEnabled;
    setScrubEnabled(nextVal);
    if (nextVal && rawFilename) {
      const sanitized = sanitizeAudioFilename(rawFilename);
      setStagedTitle(sanitized.title);
      setStagedArtist(sanitized.artist);
    } else if (!nextVal && rawFilename) {
      setStagedTitle(rawFilename);
    }
  };

  // Handle File Input from Android phone storage
  const handleProcessFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const raw = file.name;
    setRawFilename(raw);
    setHasFileStaged(true);
    triggerHaptic('medium');

    const objectUrl = URL.createObjectURL(file);
    setStagedAudioBlob(file);
    setStagedAudioUrl(objectUrl);
    setStagedFileSizeMB(Math.max(1, Math.round(file.size / (1024 * 1024))));

    // Determine format
    const ext = file.name.split('.').pop()?.toUpperCase();
    if (ext === 'WAV') setTargetFormat('WAV');
    else if (ext === 'FLAC') setTargetFormat('FLAC');
    else if (ext === 'ALAC' || ext === 'M4A') setTargetFormat('ALAC');
    else setTargetFormat('MP3');

    // Read audio duration
    const tempAudio = new Audio();
    tempAudio.src = objectUrl;
    tempAudio.addEventListener('loadedmetadata', () => {
      if (tempAudio.duration && !isNaN(tempAudio.duration)) {
        setStagedDuration(Math.round(tempAudio.duration));
      }
    });

    if (scrubEnabled) {
      const cleaned = sanitizeAudioFilename(raw);
      setStagedTitle(cleaned.title);
      setStagedArtist(cleaned.artist);
      setStagedAlbum(cleaned.album);
    } else {
      setStagedTitle(raw);
      setStagedArtist('Local Artist');
    }
  };

  // Direct cover file pick
  const handleDirectCoverChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    triggerHaptic('medium');
    try {
      const dataUrl = await fileToDataUrl(file);
      setStagedCoverArt(dataUrl);
    } catch {
      setStagedCoverArt(URL.createObjectURL(file));
    }
  };

  // Save to Offline Vault
  const handleSaveToVault = () => {
    if (!stagedTitle.trim() && !rawFilename) return;

    triggerHaptic('success');
    const formatStr =
      targetFormat === 'ALAC'
        ? 'LOSSLESS ALAC 24b'
        : targetFormat === 'FLAC'
        ? 'FLAC 24/192'
        : targetFormat === 'WAV'
        ? 'WAV 32-bit'
        : '320kbps MP3';

    const newTrack: Track = {
      id: 'track-' + Date.now(),
      title: stagedTitle.trim() || 'Imported Audio',
      artist: stagedArtist.trim() || 'SoundVault Artist',
      album: stagedAlbum.trim() || 'Offline Vault',
      duration: stagedDuration || 180,
      durationFormatted: formatTime(stagedDuration || 180),
      format: formatStr,
      formatType: targetFormat,
      fileSizeMB: stagedFileSizeMB || 15,
      dynamicRange: 'DR14',
      bitrate: targetBitrate,
      sampleRate: '96.0 kHz / 24-bit',
      coverArt: stagedCoverArt,
      originalRawName: rawFilename || 'custom_upload.wav',
      audioUrl: stagedAudioUrl,
      audioBlob: stagedAudioBlob || undefined,
      dateAdded: new Date().toISOString().split('T')[0],
      isFavorite: false,
      isLossless: targetFormat !== 'MP3',
      tags: ['Local Ingest', 'Custom Cover'],
    };

    onAddTrackToVault(newTrack);

    setSaveBtnSuccess(true);
    setTimeout(() => {
      setSaveBtnSuccess(false);
      // Reset staging
      setHasFileStaged(false);
      setRawFilename('');
      setStagedTitle('');
      setStagedArtist('');
      setStagedAudioBlob(null);
      setStagedAudioUrl('');
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full px-4 gap-4 pt-2 pb-36 max-w-lg mx-auto select-none">
      {/* Page Header */}
      <div className="flex flex-col gap-1 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-[#4cd7f6] tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse" />
            Audio Ingestion & Cover Staging
          </span>
          <span className="text-[10px] font-mono text-[#4edea3] bg-[#282a32] px-2.5 py-0.5 rounded-full border border-[#4edea3]/20">
            100% Offline
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#e2e1ee]">
          Import & Rename Audio
        </h1>
        <p className="text-xs text-[#cbc3d7]/70">
          Import your local audio songs, clean raw file names, and attach custom song images from your phone.
        </p>
      </div>

      {/* Main File Picker Drag-and-Drop Area */}
      <div
        onClick={() => {
          triggerHaptic('medium');
          fileInputRef.current?.click();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleProcessFiles(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#191b24] border-2 border-dashed border-white/10 text-center gap-2 cursor-pointer hover:border-[#d0bcff]/40 hover:bg-[#1d1f28] transition-all shadow-md active:scale-[0.99]"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.flac,.wav,.alac,.m4a,.opus,.mp3,.ogg,.aac"
          className="hidden"
          onChange={(e) => handleProcessFiles(e.target.files)}
        />
        <div className="w-14 h-14 rounded-2xl bg-[#282a32] flex items-center justify-center text-[#d0bcff] shadow-inner border border-white/5">
          <span className="material-symbols-outlined text-[30px]">audio_file</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-[#e2e1ee]">
            Tap to Select Audio from Phone
          </span>
          <span className="text-xs text-[#cbc3d7]/70">
            Choose from Android Downloads, Internal Storage, or SD Card
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#33343e] text-[#4cd7f6] font-bold">
            FLAC
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#33343e] text-[#4edea3] font-bold">
            WAV 32b
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#33343e] text-[#d0bcff] font-bold">
            M4A
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#33343e] text-[#cbc3d7] font-semibold">
            MP3
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#33343e] text-[#cbc3d7] font-semibold">
            OPUS
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#33343e] text-[#cbc3d7] font-semibold">
            OGG
          </span>
        </div>
      </div>

      {/* Or Paste Audio URL */}
      <div className="flex flex-col gap-1.5 bg-[#1d1f28] p-3 rounded-xl border border-white/5 shadow-sm">
        <label className="text-[10px] font-mono uppercase text-[#cbc3d7]/70 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">link</span>
          Or Fetch Direct Online Audio Link
        </label>
        <div className="flex items-center gap-1.5 bg-[#0c0e16] rounded-lg p-1 border border-white/5">
          <input
            type="url"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="Paste audio file link or online stream URL..."
            className="w-full bg-transparent px-2.5 py-1 text-xs text-[#e2e1ee] placeholder-[#958ea0] focus:outline-none font-mono"
          />
          <button
            onClick={handleFetchStream}
            disabled={isFetchingStream}
            className="shrink-0 bg-[#4cd7f6] text-[#003640] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[15px] ${isFetchingStream ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{fetchButtonText}</span>
          </button>
        </div>
      </div>

      {/* Staged Audio File Cleaning & Custom Cover Section */}
      {hasFileStaged && (
        <section className="flex flex-col rounded-3xl bg-[#282a32] p-4 shadow-xl gap-4 border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3] animate-pulse" />
              <span className="text-xs font-bold font-mono text-[#e2e1ee] uppercase">
                Staged Audio Inspector
              </span>
            </div>
            <span className="text-[10px] font-mono bg-[#0c0e16] text-[#4cd7f6] px-2 py-0.5 rounded-full">
              {stagedFileSizeMB} MB • {targetFormat}
            </span>
          </div>

          {/* Original Raw Name Banner */}
          {rawFilename && (
            <div className="flex flex-col gap-1 bg-[#0c0e16] p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#ffb4ab] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[13px]">info</span>
                  Original Raw File Name
                </span>
                <span className="text-[9px] font-mono text-[#958ea0]">Unformatted</span>
              </div>
              <code className="text-[11px] font-mono text-[#cbc3d7] break-all pt-0.5">
                {rawFilename}
              </code>
            </div>
          )}

          {/* Auto-Scrub Switch */}
          <div className="flex items-center justify-between bg-[#1d1f28] rounded-2xl p-3 border border-white/5">
            <div className="flex items-start gap-2.5 min-w-0 pr-2">
              <span className="material-symbols-outlined text-[#d0bcff] text-[20px] mt-0.5 shrink-0">
                auto_fix_high
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#e2e1ee] truncate">
                  Auto-Scrub Messy Tags & Rips
                </span>
                <span className="text-[11px] text-[#cbc3d7]/70 truncate">
                  Removes .m4a, bitrate tags, yt_dl strings & bracket noise
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={scrubEnabled}
              onClick={handleToggleScrub}
              className={`w-11 h-6 rounded-full relative flex items-center p-0.5 shrink-0 transition-colors cursor-pointer ${
                scrubEnabled ? 'bg-[#a078ff]' : 'bg-[#33343e]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-[#340080] shadow-sm transform transition-transform flex items-center justify-center ${
                  scrubEnabled ? 'translate-x-5' : 'translate-x-0 bg-[#958ea0]'
                }`}
              >
                {scrubEnabled && (
                  <span className="material-symbols-outlined text-[12px] text-[#d0bcff]">
                    check
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* Custom Artwork Section */}
          <div className="flex flex-col gap-2 bg-[#1d1f28] p-3 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#e2e1ee] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#d0bcff] text-[18px]">
                  image
                </span>
                Custom Song Image / Cover Art
              </label>
              <span className="text-[10px] font-mono text-[#4edea3]">
                1:1 High Quality
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#0c0e16] border border-white/10 shadow-md shrink-0">
                <img
                  src={stagedCoverArt}
                  alt="Song cover" onError={coverOnError()}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <input
                  ref={directCoverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleDirectCoverChange(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsCoverModalOpen(true);
                  }}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#a078ff]/30 to-[#4cd7f6]/20 hover:from-[#a078ff]/40 hover:to-[#4cd7f6]/30 text-[#d0bcff] hover:text-white border border-[#d0bcff]/30 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                  <span>Change / Upload Image</span>
                </button>

                <span className="text-[10px] text-[#cbc3d7]/60 leading-tight">
                  Pick from phone downloads, paste image URL, or choose artwork presets
                </span>
              </div>
            </div>
          </div>

          {/* Manual Metadata Inputs (Song Name, Artist, Album) */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase text-[#cbc3d7]/70 font-semibold">
                Song Title (Rename manually if needed)
              </label>
              <div className="flex items-center bg-[#0c0e16] border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#d0bcff]">
                <input
                  type="text"
                  value={stagedTitle}
                  onChange={(e) => setStagedTitle(e.target.value)}
                  placeholder="Song Title..."
                  className="w-full bg-transparent text-sm font-bold text-[#e2e1ee] focus:outline-none"
                />
                {stagedTitle && (
                  <button
                    type="button"
                    onClick={() => setStagedTitle('')}
                    className="text-[#958ea0] hover:text-[#e2e1ee] p-0.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase text-[#cbc3d7]/70 font-semibold">
                Artist Name
              </label>
              <div className="flex items-center bg-[#0c0e16] border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#d0bcff]">
                <span className="material-symbols-outlined text-[#958ea0] text-[18px] mr-2">
                  person
                </span>
                <input
                  type="text"
                  value={stagedArtist}
                  onChange={(e) => setStagedArtist(e.target.value)}
                  placeholder="Artist name..."
                  className="w-full bg-transparent text-xs text-[#e2e1ee] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase text-[#cbc3d7]/70 font-semibold">
                Album / Collection
              </label>
              <div className="flex items-center bg-[#0c0e16] border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#d0bcff]">
                <span className="material-symbols-outlined text-[#958ea0] text-[18px] mr-2">
                  album
                </span>
                <input
                  type="text"
                  value={stagedAlbum}
                  onChange={(e) => setStagedAlbum(e.target.value)}
                  placeholder="Album name..."
                  className="w-full bg-transparent text-xs text-[#e2e1ee] focus:outline-none"
                />
              </div>
            </div>

            {/* Target Format Switcher */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div
                onClick={() => {
                  triggerHaptic('light');
                  const formats: ('ALAC' | 'FLAC' | 'WAV' | 'MP3')[] = ['FLAC', 'WAV', 'ALAC', 'MP3'];
                  const nextIdx = (formats.indexOf(targetFormat) + 1) % formats.length;
                  setTargetFormat(formats[nextIdx]);
                }}
                className="flex flex-col bg-[#0c0e16] p-2.5 rounded-xl border border-white/5 cursor-pointer hover:border-white/20 transition-colors"
              >
                <span className="text-[9px] font-mono uppercase text-[#958ea0]">
                  Target Format (Tap)
                </span>
                <span className="text-[11px] font-mono font-bold text-[#4cd7f6] mt-0.5">
                  {targetFormat}
                </span>
              </div>

              <div
                onClick={() => {
                  triggerHaptic('light');
                  setTargetBitrate(
                    targetBitrate === 'BIT-EXACT 192k' ? 'VBR HIGH RES' : 'BIT-EXACT 192k'
                  );
                }}
                className="flex flex-col bg-[#0c0e16] p-2.5 rounded-xl border border-white/5 cursor-pointer hover:border-white/20 transition-colors"
              >
                <span className="text-[9px] font-mono uppercase text-[#958ea0]">
                  Bitrate Mode
                </span>
                <span className="text-[11px] font-mono font-bold text-[#4edea3] mt-0.5">
                  {targetBitrate}
                </span>
              </div>
            </div>
          </div>

          {/* Commit Button */}
          <button
            type="button"
            onClick={handleSaveToVault}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all duration-300 cursor-pointer ${
              saveBtnSuccess
                ? 'bg-[#4edea3] text-[#003824]'
                : 'bg-gradient-to-r from-[#d0bcff] via-[#a078ff] to-[#4cd7f6] text-[#2c006b] shadow-[0_0_20px_rgba(208,188,255,0.4)]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {saveBtnSuccess ? 'check_circle' : 'save'}
            </span>
            <span>
              {saveBtnSuccess
                ? 'Saved & Added to Offline Vault!'
                : 'Save Song to SoundVault'}
            </span>
          </button>
        </section>
      )}

      {/* Real Ingest History from Vault */}
      <section className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#e2e1ee]">Recently Stored in Vault</h2>
          <span className="text-[11px] font-mono text-[#d0bcff] font-semibold">
            {recentTracks.length} Total
          </span>
        </div>

        {recentTracks.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#191b24] border border-white/5 text-center text-xs text-[#cbc3d7]/60">
            No songs imported yet. Choose an audio file above to add your first track.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentTracks.slice(0, 5).map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#191b24] border border-white/5 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-[#282a32] overflow-hidden shrink-0 border border-white/5">
                    {track.coverArt ? (
                      <img
                        src={track.coverArt}
                        alt={track.title}
                        onError={coverOnError()}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#d0bcff]">
                        <span className="material-symbols-outlined text-[18px]">music_note</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[#e2e1ee] truncate">
                      {track.title}
                    </span>
                    <span className="text-[11px] text-[#cbc3d7]/70 truncate">
                      {track.artist}
                    </span>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[9px] font-mono text-[#4edea3] font-bold">
                        {track.format}
                      </span>
                      <span className="text-[#958ea0]">•</span>
                      <span className="text-[10px] font-mono text-[#958ea0]">
                        {track.fileSizeMB} MB
                      </span>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#4edea3] text-[20px] shrink-0">
                  check_circle
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cover Art Modal */}
      <CoverArtPickerModal
        isOpen={isCoverModalOpen}
        currentArtwork={stagedCoverArt}
        songTitle={stagedTitle || 'New Import'}
        onClose={() => setIsCoverModalOpen(false)}
        onSelectArtwork={(newArt) => {
          setStagedCoverArt(newArt);
        }}
      />
    </div>
  );
};
