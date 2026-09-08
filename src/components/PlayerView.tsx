import React, { useState, useRef } from 'react';
import { Track, EQPreset, OutputRoute } from '../types';
import { formatTime } from '../utils/vaultStorage';
import { triggerHaptic } from '../utils/haptics';
import { CoverArtPickerModal } from './CoverArtPickerModal';

interface PlayerViewProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  eqPreset: EQPreset;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onEQChange: (eq: EQPreset) => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenContextMenu: (track: Track) => void;
  onMinimize: () => void;
  onUpdateTrack?: (updatedTrack: Track) => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  eqPreset,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onVolumeChange,
  onEQChange,
  onToggleFavorite,
  onOpenContextMenu,
  onMinimize,
  onUpdateTrack,
}) => {
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');
  const [outputRoute, setOutputRoute] = useState<OutputRoute>('USB DAC / ASIO');
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);

  const waveformRef = useRef<HTMLDivElement>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remainingTime = Math.max(0, duration - currentTime);

  // Waveform click / drag seek handler
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    triggerHaptic('light');
    onSeek(ratio * duration);
  };

  // Volume slider click / drag
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeSliderRef.current) return;
    const rect = volumeSliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    triggerHaptic('light');
    onVolumeChange(ratio);
  };

  // Cycle EQ Presets
  const cycleEQ = () => {
    triggerHaptic('light');
    const presets: EQPreset[] = [
      'Studio Warmth',
      'Bass Boost',
      'Hi-Res Clarity',
      'Direct Neutral',
      'Vocal Focus',
    ];
    const nextIdx = (presets.indexOf(eqPreset) + 1) % presets.length;
    onEQChange(presets[nextIdx]);
  };

  // Cycle Output Routes
  const cycleOutput = () => {
    triggerHaptic('light');
    const routes: OutputRoute[] = [
      'USB DAC / ASIO',
      'Internal 32-bit DAC',
      'Bluetooth LDAC 990k',
    ];
    const nextIdx = (routes.indexOf(outputRoute) + 1) % routes.length;
    setOutputRoute(routes[nextIdx]);
  };

  // 60 Procedural Sound Bars
  const barHeights = [
    35, 50, 70, 40, 85, 95, 60, 75, 45, 60, 100, 80, 65, 50, 70, 90, 45, 60, 75,
    95, 85, 40, 70, 80, 60, 75, 90, 100, 65, 55, 70, 85, 45, 60, 75, 90, 50, 35,
    65, 80, 95, 60, 70, 40, 55, 75, 90, 65, 45, 30, 55, 70, 85, 65, 45, 75, 90,
    60, 40, 30,
  ];

  return (
    <div className="flex flex-col w-full px-4 gap-3.5 pt-1 pb-32 max-w-lg mx-auto select-none">
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between py-1">
        <button
          onClick={() => {
            triggerHaptic('light');
            onMinimize();
          }}
          aria-label="Minimize player"
          className="w-10 h-10 rounded-full bg-[#282a32] flex items-center justify-center text-[#e2e1ee] hover:text-[#d0bcff] transition-colors border border-white/5 active:scale-90"
        >
          <span className="material-symbols-outlined text-[24px]">keyboard_arrow_down</span>
        </button>

        <div className="flex flex-col items-center min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#4cd7f6] font-semibold">
            Offline Storage Hub
          </span>
          <span className="text-xs font-bold text-[#e2e1ee] truncate">
            Playing from Local Vault
          </span>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenContextMenu(currentTrack);
          }}
          aria-label="Audio options"
          className="w-10 h-10 rounded-full bg-[#282a32] flex items-center justify-center text-[#e2e1ee] hover:text-[#d0bcff] transition-colors border border-white/5 active:scale-90"
        >
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>

      {/* Centerpiece: Album Artwork with Ambient Glow, Vinyl Peek, & Change Cover Button */}
      <div className="relative w-full aspect-square max-w-[320px] mx-auto flex items-center justify-center my-1">
        {/* Ambient Neon Aura Backlight */}
        <div className="absolute inset-4 rounded-3xl bg-gradient-to-tr from-[#a078ff]/40 via-[#4cd7f6]/30 to-[#d0bcff]/20 blur-2xl opacity-75 animate-pulse pointer-events-none" />

        {/* Vinyl Disc Slide Hint */}
        <div className="absolute -right-3 top-4 bottom-4 w-24 rounded-full bg-[#0c0e16] shadow-2xl flex items-center justify-center border border-white/5 opacity-80">
          <div className="w-14 h-14 rounded-full bg-[#282a32] flex items-center justify-center border border-white/10">
            <div className="w-5 h-5 rounded-full bg-[#0c0e16]" />
          </div>
        </div>

        {/* Main Album Frame */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-[#282a32] z-10 flex flex-col justify-end border border-white/10 group">
          <img
            src={currentTrack.coverArt}
            alt={currentTrack.title}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Quick Change Cover Art Overlay Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsCoverPickerOpen(true);
            }}
            className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-[#0c0e16]/80 backdrop-blur-md text-[10px] font-mono text-[#d0bcff] hover:text-white flex items-center gap-1 border border-white/10 shadow-lg active:scale-95 transition-transform"
            title="Add or change custom song image"
          >
            <span className="material-symbols-outlined text-[14px]">photo_camera</span>
            <span>Cover Art</span>
          </button>

          {/* Subtle internal scrim gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e16]/80 via-transparent to-transparent pointer-events-none" />

          <div className="relative p-3.5 flex items-center justify-between z-10 pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-[#0c0e16]/80 backdrop-blur-md text-[10px] font-mono text-[#4cd7f6] flex items-center gap-1.5 font-bold border border-white/5">
              <span className="material-symbols-outlined text-[13px]">graphic_eq</span>
              STUDIO MASTER
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#0c0e16]/80 backdrop-blur-md text-[10px] font-mono text-[#4edea3] flex items-center gap-1.5 font-bold border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] shadow-[0_0_6px_rgba(78,222,163,0.8)]" />
              100% BIT-PERFECT
            </span>
          </div>
        </div>
      </div>

      {/* Track Meta & Favorite */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex flex-col min-w-0">
          <h2 className="text-xl font-black text-[#e2e1ee] truncate tracking-tight">
            {currentTrack.title}
          </h2>
          <p className="text-sm text-[#cbc3d7]/80 truncate font-medium">
            {currentTrack.artist} • {currentTrack.album}
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onToggleFavorite(currentTrack.id);
          }}
          aria-label="Toggle favorite"
          className="w-12 h-12 rounded-full bg-[#1d1f28] flex items-center justify-center transition-all active:scale-90 shrink-0 border border-white/5"
        >
          <span
            className={`material-symbols-outlined text-[26px] ${
              currentTrack.isFavorite ? 'text-[#d0bcff]' : 'text-[#cbc3d7]/60'
            }`}
            style={{ fontVariationSettings: currentTrack.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>
      </div>

      {/* Audiophile Lossless Spec Banner */}
      <div className="w-full rounded-xl bg-[#282a32] p-3 flex items-center justify-between gap-2 shadow-md border border-white/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#33343e] flex items-center justify-center text-[#4edea3] shrink-0">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[11px] font-mono font-bold text-[#4edea3]">
                {currentTrack.format}
              </span>
              <span className="text-[#958ea0] text-[10px]">•</span>
              <span className="text-[11px] font-mono text-[#e2e1ee]">
                {currentTrack.sampleRate || '24-bit / 96.0 kHz'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#cbc3d7]/70">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] shadow-[0_0_6px_rgba(78,222,163,0.7)] shrink-0" />
              <span className="text-[9px] font-mono uppercase tracking-wider truncate">
                Local Storage Direct • Offline Validated
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            setShowTagsModal(!showTagsModal);
          }}
          className="px-2.5 py-1 rounded-lg bg-[#33343e] hover:bg-[#373942] text-[10px] font-mono text-[#4cd7f6] shrink-0 font-bold border border-white/5"
        >
          TAGS
        </button>
      </div>

      {/* Interactive Audio Waveform Scrubber */}
      <div className="flex flex-col gap-1 pt-1">
        <div
          ref={waveformRef}
          onClick={handleWaveformClick}
          className="relative w-full h-12 bg-[#1d1f28] rounded-xl flex items-center justify-between px-3 gap-[2px] cursor-pointer overflow-hidden border border-white/5 group"
        >
          {/* Scrub Fill Scrim Layer */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-[#d0bcff]/15 transition-all pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Playhead Scrub Pin */}
          <div
            className="absolute top-1 bottom-1 w-1 bg-gradient-to-b from-[#4cd7f6] to-[#d0bcff] rounded-full shadow-[0_0_12px_rgba(76,215,246,0.9)] pointer-events-none transition-all"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Procedural Sound Slice Bars */}
          <div className="flex items-center justify-between w-full h-8 z-10 pointer-events-none">
            {barHeights.map((heightPercent, index) => {
              const barProgress = (index / barHeights.length) * 100;
              const isPlayed = barProgress <= progressPercent;

              return (
                <span
                  key={index}
                  className={`w-1 rounded-full transition-colors duration-150 ${
                    isPlayed
                      ? index % 3 === 0
                        ? 'bg-[#4cd7f6]'
                        : 'bg-[#d0bcff]'
                      : 'bg-[#33343e]'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Time Markers */}
        <div className="flex items-center justify-between px-1 text-xs font-mono">
          <span className="text-[#4cd7f6] font-semibold">{formatTime(currentTime)}</span>
          <span className="text-[#cbc3d7]/70">-{formatTime(remainingTime)}</span>
        </div>
      </div>

      {/* Primary Playback Hub */}
      <div className="flex items-center justify-between px-2 pt-1">
        {/* Shuffle */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setIsShuffle(!isShuffle);
          }}
          aria-label="Toggle shuffle"
          className={`w-11 h-11 flex flex-col items-center justify-center transition-colors active:scale-90 ${
            isShuffle ? 'text-[#4cd7f6]' : 'text-[#cbc3d7]/60 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">shuffle</span>
          <span
            className={`w-1 h-1 rounded-full bg-[#4cd7f6] mt-0.5 ${
              isShuffle ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </button>

        {/* Previous Track */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onPrevTrack();
          }}
          aria-label="Previous Track"
          className="w-12 h-12 flex items-center justify-center text-[#e2e1ee] hover:text-[#d0bcff] transition-colors active:scale-90"
        >
          <span className="material-symbols-outlined text-[34px]">skip_previous</span>
        </button>

        {/* Master Neon Play/Pause Knob */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onTogglePlay();
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#d0bcff] via-[#a078ff] to-[#4cd7f6] flex items-center justify-center text-[#340080] shadow-[0_0_24px_rgba(208,188,255,0.6)] active:scale-95 transition-transform"
        >
          <span
            className="material-symbols-outlined text-[40px] text-[#23005c]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>

        {/* Next Track */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onNextTrack();
          }}
          aria-label="Next Track"
          className="w-12 h-12 flex items-center justify-center text-[#e2e1ee] hover:text-[#d0bcff] transition-colors active:scale-90"
        >
          <span className="material-symbols-outlined text-[34px]">skip_next</span>
        </button>

        {/* Repeat Loop Mode */}
        <button
          onClick={() => {
            triggerHaptic('light');
            const next = repeatMode === 'all' ? 'one' : repeatMode === 'one' ? 'off' : 'all';
            setRepeatMode(next);
          }}
          aria-label="Repeat Loop Mode"
          className={`w-11 h-11 flex flex-col items-center justify-center transition-colors active:scale-90 ${
            repeatMode !== 'off' ? 'text-[#d0bcff]' : 'text-[#cbc3d7]/60 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            {repeatMode === 'one' ? 'repeat_one' : 'repeat'}
          </span>
          <span
            className={`w-1 h-1 rounded-full bg-[#d0bcff] mt-0.5 ${
              repeatMode !== 'off' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </button>
      </div>

      {/* Studio Sound Tuning & Device Dock */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {/* Quick EQ Preset Strip */}
        <div
          onClick={cycleEQ}
          className="flex flex-col justify-between p-3 rounded-xl bg-[#282a32] border border-white/5 cursor-pointer hover:border-[#4cd7f6]/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#cbc3d7]/70 uppercase">
              10-Band EQ
            </span>
            <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">
              equalizer
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#e2e1ee] truncate">
                {eqPreset}
              </span>
              <span className="text-[9px] font-mono text-[#4cd7f6] truncate">
                {eqPreset === 'Studio Warmth'
                  ? '+2.5dB Bass • Linear'
                  : eqPreset === 'Bass Boost'
                  ? '+5.0dB Sub • Punch'
                  : '+1.5dB Treble • Clarity'}
              </span>
            </div>
          </div>
        </div>

        {/* Active Hardware Output Selector */}
        <div
          onClick={cycleOutput}
          className="flex flex-col justify-between p-3 rounded-xl bg-[#282a32] border border-white/5 cursor-pointer hover:border-[#4edea3]/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#cbc3d7]/70 uppercase">
              Output Route
            </span>
            <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
              headphones
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#e2e1ee] truncate">
                {outputRoute}
              </span>
              <span className="text-[9px] font-mono text-[#4edea3] truncate">
                Direct Passthrough
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Smooth Hardware-Style Master Volume Fader */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#191b24] border border-white/5">
        <button
          onClick={() => {
            triggerHaptic('light');
            onVolumeChange(volume === 0 ? 0.75 : 0);
          }}
          aria-label="Mute volume"
          className="text-[#cbc3d7] hover:text-[#e2e1ee]"
        >
          <span className="material-symbols-outlined text-[20px]">
            {volume === 0 ? 'volume_off' : 'volume_down'}
          </span>
        </button>

        <div
          ref={volumeSliderRef}
          onClick={handleVolumeClick}
          className="relative flex-1 h-2 bg-[#33343e] rounded-full flex items-center cursor-pointer"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6]"
            style={{ width: `${volume * 100}%` }}
          />
          <div
            className="absolute -ml-2 w-4 h-4 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none"
            style={{ left: `${volume * 100}%` }}
          />
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            onVolumeChange(1);
          }}
          aria-label="Max volume"
          className="text-[#cbc3d7] hover:text-[#e2e1ee]"
        >
          <span className="material-symbols-outlined text-[20px]">volume_up</span>
        </button>
      </div>

      {/* Tags Modal */}
      {showTagsModal && (
        <div
          className="fixed inset-0 z-50 bg-[#0c0e16]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowTagsModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#282a32] p-5 shadow-2xl flex flex-col gap-3 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/5">
              <span className="text-sm font-bold text-[#e2e1ee]">Audio Spec Tags</span>
              <button
                onClick={() => setShowTagsModal(false)}
                className="w-7 h-7 rounded-full bg-[#33343e] flex items-center justify-center text-[#e2e1ee]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#958ea0]">CONTAINER:</span>
                <span className="text-[#4cd7f6]">{currentTrack.format}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#958ea0]">SAMPLE RATE:</span>
                <span className="text-[#4edea3]">{currentTrack.sampleRate || '96.0 kHz'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#958ea0]">DYNAMIC RANGE:</span>
                <span className="text-[#d0bcff]">{currentTrack.dynamicRange || 'DR14'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#958ea0]">STORAGE SIZE:</span>
                <span className="text-[#e2e1ee]">{currentTrack.fileSizeMB} MB</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#958ea0]">ORIGINAL FILE:</span>
                <span className="text-[#958ea0] truncate max-w-[150px]">
                  {currentTrack.originalRawName || 'imported_audio'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowTagsModal(false)}
              className="w-full py-2.5 rounded-lg bg-[#33343e] text-[#e2e1ee] text-xs font-semibold hover:bg-[#373942]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cover Art Picker Modal directly from Player */}
      <CoverArtPickerModal
        isOpen={isCoverPickerOpen}
        currentArtwork={currentTrack.coverArt}
        songTitle={currentTrack.title}
        onClose={() => setIsCoverPickerOpen(false)}
        onSelectArtwork={(newArtwork) => {
          if (onUpdateTrack) {
            onUpdateTrack({
              ...currentTrack,
              coverArt: newArtwork,
            });
          }
        }}
      />
    </div>
  );
};
