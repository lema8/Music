import React from 'react';
import { Track } from '../types';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onOpenPlayer: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNextTrack,
  onOpenPlayer,
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-16 inset-x-0 z-30 px-3 max-w-lg mx-auto">
      <div
        onClick={onOpenPlayer}
        className="relative flex flex-col rounded-xl bg-[#282a32]/95 backdrop-blur-xl p-3 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform group"
      >
        {/* Top Playback Progress Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#33343e]">
          <div
            className="h-full bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Track Info & Artwork / Visualizer */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-lg bg-[#191b24] overflow-hidden flex items-center justify-center shrink-0 border border-white/5">
              {currentTrack.coverArt ? (
                <img
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-[#11131b]/40 flex items-center justify-center">
                {isPlaying ? (
                  <div className="flex items-end gap-[2px] h-3.5">
                    <span className="w-[2.5px] h-full bg-[#4cd7f6] rounded-full animate-pulse" />
                    <span className="w-[2.5px] h-2 bg-[#d0bcff] rounded-full animate-bounce" />
                    <span className="w-[2.5px] h-3 bg-[#4edea3] rounded-full animate-pulse" />
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-[#d0bcff] text-[20px]">
                    graphic_eq
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-[#e2e1ee] truncate group-hover:text-[#d0bcff] transition-colors">
                {currentTrack.title}
              </span>
              <span className="text-[10px] font-mono uppercase text-[#4cd7f6] truncate">
                {currentTrack.format} • OFFLINE STORAGE
              </span>
            </div>
          </div>

          {/* Controls */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onNextTrack}
              aria-label="Skip to next track"
              className="w-10 h-10 flex items-center justify-center text-[#cbc3d7] hover:text-[#e2e1ee] active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[24px]">skip_next</span>
            </button>

            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 rounded-full bg-[#d0bcff] text-[#3c0091] flex items-center justify-center shadow-[0_0_14px_rgba(208,188,255,0.45)] hover:bg-white active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
