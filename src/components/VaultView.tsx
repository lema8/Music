import React, { useState, useMemo } from 'react';
import { Track, VaultFilter } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface VaultViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onOpenContextMenu: (track: Track) => void;
  onShuffleAll: () => void;
  onGoToImport: () => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onOpenContextMenu,
  onShuffleAll,
  onGoToImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<VaultFilter>('all');
  const [sortAsc, setSortAsc] = useState(false);

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    let list = [...tracks];

    // Filter pills
    if (activeFilter === 'recent') {
      list.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    } else if (activeFilter === 'hires') {
      list = list.filter((t) => t.isLossless);
    } else if (activeFilter === 'tags') {
      list = list.filter((t) => t.tags && t.tags.length > 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q) ||
          t.format.toLowerCase().includes(q)
      );
    }

    if (sortAsc) {
      list.reverse();
    }

    return list;
  }, [tracks, activeFilter, searchQuery, sortAsc]);

  // Real Storage calculation metrics based strictly on user imported tracks
  const totalSizeMB = tracks.reduce((acc, t) => acc + (t.fileSizeMB || 0), 0);
  const totalSizeFormatted = totalSizeMB > 1024 
    ? `${(totalSizeMB / 1024).toFixed(2)} GB` 
    : `${totalSizeMB} MB`;

  const flacCount = tracks.filter((t) => t.formatType === 'FLAC' || t.formatType === 'ALAC').length;
  const wavCount = tracks.filter((t) => t.formatType === 'WAV').length;
  const mp3Count = tracks.filter((t) => t.formatType === 'MP3' || t.formatType === 'M4A' || t.formatType === 'OPUS' || t.formatType === 'OGG').length;

  return (
    <div className="flex flex-col w-full px-4 gap-4 pt-2 pb-36 max-w-lg mx-auto select-none">
      {/* Search Bar */}
      <div className="sticky top-14 z-20 pt-1">
        <div className="relative flex items-center w-full rounded-2xl bg-[#282a32]/95 backdrop-blur-md border border-white/10 shadow-lg py-2 px-3.5">
          <span className="material-symbols-outlined text-[#4cd7f6] text-[20px] shrink-0 mr-2">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tracks.length > 0 ? `Search ${tracks.length} imported tracks...` : 'Search offline vault...'}
            className="w-full bg-transparent text-[#e2e1ee] text-sm placeholder-[#958ea0] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setSearchQuery('');
              }}
              className="text-[#958ea0] hover:text-[#e2e1ee] p-1"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/10 shrink-0">
            <span className="material-symbols-outlined text-[#4edea3] text-[18px]">
              verified_user
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#4edea3] font-semibold">
              Offline
            </span>
          </div>
        </div>
      </div>

      {/* Offline Storage Overview Card */}
      <div className="relative rounded-2xl bg-[#191b24] p-4 border border-white/5 shadow-md overflow-hidden flex flex-col gap-3">
        {/* Ambient subtle glow blob */}
        <div className="absolute -right-8 -top-12 w-48 h-48 rounded-full bg-gradient-to-br from-[#a078ff]/15 to-[#4cd7f6]/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#282a32] flex items-center justify-center text-[#d0bcff] shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                sd_card
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#e2e1ee]">Phone Local Storage</span>
              <span className="text-[10px] font-mono text-[#4cd7f6] uppercase tracking-wider">
                Isolated Android Vault
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#33343e] px-2.5 py-1 rounded-full shrink-0 border border-[#4edea3]/20">
            <span className="material-symbols-outlined text-[#4edea3] text-[15px]">
              lock
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4edea3] uppercase">
              Private Library
            </span>
          </div>
        </div>

        {/* Storage Meter Bar & Metrics */}
        <div className="flex flex-col gap-1 relative z-10">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-[#e2e1ee]">
              {totalSizeFormatted}
            </span>
            <span className="text-[11px] font-mono text-[#958ea0] uppercase tracking-wider">
              {tracks.length} {tracks.length === 1 ? 'Imported Track' : 'Imported Tracks'}
            </span>
          </div>

          {/* Segmented Multi-format Bar Indicator */}
          <div className="w-full h-2 rounded-full bg-[#33343e] flex overflow-hidden gap-0.5 p-[1px]">
            {tracks.length === 0 ? (
              <div className="h-full w-full bg-[#282a32] rounded-full" />
            ) : (
              <>
                <div
                  className="h-full rounded-l-full bg-[#d0bcff]"
                  style={{ width: `${Math.max(10, (flacCount / tracks.length) * 100)}%` }}
                  title="FLAC/ALAC"
                />
                <div
                  className="h-full bg-[#4cd7f6]"
                  style={{ width: `${Math.max(5, (wavCount / tracks.length) * 100)}%` }}
                  title="WAV"
                />
                <div
                  className="h-full rounded-r-full bg-[#958ea0]"
                  style={{ width: `${Math.max(10, (mp3Count / tracks.length) * 100)}%` }}
                  title="MP3/Other"
                />
              </>
            )}
          </div>
        </div>

        {/* Format Breakdown Pills */}
        <div className="flex flex-wrap items-center gap-2 relative z-10 pt-1">
          <div className="flex items-center gap-1.5 bg-[#282a32] px-2.5 py-1 rounded-full border border-white/5">
            <span className="w-2 h-2 rounded-full bg-[#d0bcff]" />
            <span className="text-[10px] font-mono text-[#e2e1ee] uppercase font-semibold">
              FLAC ({flacCount})
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#282a32] px-2.5 py-1 rounded-full border border-white/5">
            <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
            <span className="text-[10px] font-mono text-[#e2e1ee] uppercase font-semibold">
              WAV ({wavCount})
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#282a32] px-2.5 py-1 rounded-full border border-white/5">
            <span className="w-2 h-2 rounded-full bg-[#958ea0]" />
            <span className="text-[10px] font-mono text-[#cbc3d7] uppercase font-semibold">
              Compressed ({mp3Count})
            </span>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onGoToImport();
            }}
            className="ml-auto flex items-center gap-1 text-[#4cd7f6] hover:text-white cursor-pointer py-1 text-[11px] font-mono uppercase font-bold tracking-wider"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scrolling Filter Chips */}
      {tracks.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 -mx-4 px-4 no-scrollbar">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveFilter('all');
            }}
            className={`shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeFilter === 'all'
                ? 'bg-[#d0bcff] text-[#3c0091] shadow-[0_0_12px_rgba(208,188,255,0.4)]'
                : 'bg-[#282a32] text-[#cbc3d7] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">folder_open</span>
            <span>All Tracks ({tracks.length})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveFilter('recent');
            }}
            className={`shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeFilter === 'recent'
                ? 'bg-[#d0bcff] text-[#3c0091] shadow-[0_0_12px_rgba(208,188,255,0.4)]'
                : 'bg-[#282a32] text-[#cbc3d7] hover:text-white'
            }`}
          >
            <span>Recently Added</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveFilter('hires');
            }}
            className={`shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeFilter === 'hires'
                ? 'bg-[#d0bcff] text-[#3c0091] shadow-[0_0_12px_rgba(208,188,255,0.4)]'
                : 'bg-[#282a32] text-[#cbc3d7] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[#4cd7f6] text-[16px]">high_res</span>
            <span>Hi-Res Lossless</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveFilter('tags');
            }}
            className={`shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeFilter === 'tags'
                ? 'bg-[#d0bcff] text-[#3c0091] shadow-[0_0_12px_rgba(208,188,255,0.4)]'
                : 'bg-[#282a32] text-[#cbc3d7] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tag</span>
            <span>Tagged</span>
          </button>
        </div>
      )}

      {/* Vault Quick Action Transport & Sort Controls */}
      {tracks.length > 0 && (
        <div className="flex items-center justify-between gap-2 py-0.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('medium');
                onShuffleAll();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#a078ff] to-[#03b5d3] text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">shuffle</span>
              <span>Shuffle Vault</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setSortAsc(!sortAsc);
              }}
              className="w-9 h-9 rounded-full bg-[#282a32] text-[#cbc3d7] hover:text-[#e2e1ee] flex items-center justify-center transition-colors border border-white/5 active:scale-90"
              title="Toggle Sort Direction"
            >
              <span className="material-symbols-outlined text-[18px]">repeat</span>
            </button>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setSortAsc(!sortAsc);
            }}
            className="flex items-center gap-1 bg-[#191b24] px-3 py-1.5 rounded-lg hover:bg-[#282a32] transition-colors border border-white/5 text-xs text-[#cbc3d7]"
          >
            <span className="material-symbols-outlined text-[#958ea0] text-[16px]">swap_vert</span>
            <span className="font-mono text-[11px]">
              {sortAsc ? 'Oldest First' : 'Date Added'}
            </span>
          </button>
        </div>
      )}

      {/* Track List or Material 3 Empty State */}
      {tracks.length === 0 ? (
        /* Empty State: Only Imported Songs Rule */
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-[#191b24] border border-white/5 text-center gap-4 my-2 shadow-xl">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#381e72] to-[#282a32] flex items-center justify-center text-[#d0bcff] shadow-inner border border-white/10">
              <span className="material-symbols-outlined text-[40px]">music_cast</span>
            </div>
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#4edea3] text-[#003824] flex items-center justify-center font-bold shadow-md">
              <span className="material-symbols-outlined text-[18px]">add</span>
            </span>
          </div>

          <div className="flex flex-col gap-1 max-w-xs">
            <h2 className="text-lg font-bold text-[#e2e1ee]">Your SoundVault is Empty</h2>
            <p className="text-xs text-[#cbc3d7]/70 leading-relaxed">
              No pre-loaded songs or sample tracks. SoundVault stores only the songs you import, keeping your music 100% offline and bit-perfect on your phone.
            </p>
          </div>

          <div className="flex flex-col w-full gap-2.5 pt-1">
            <button
              onClick={() => {
                triggerHaptic('medium');
                onGoToImport();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#d0bcff] via-[#a078ff] to-[#4cd7f6] text-[#2c006b] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#a078ff]/20 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[22px]">file_upload</span>
              <span>Import Songs from Storage</span>
            </button>

            <span className="text-[10px] font-mono text-[#958ea0]">
              Supports FLAC, WAV, M4A, MP3, OPUS + Custom Cover Art
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filteredTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            const isRowPlaying = isCurrent && isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectTrack(track);
                }}
                className={`group relative flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                  isCurrent
                    ? 'bg-[#1d1f28] border-[#d0bcff]/30 shadow-[0_0_15px_rgba(208,188,255,0.08)]'
                    : 'bg-[#191b24]/60 hover:bg-[#1d1f28] border-transparent hover:border-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Album Art with Visualizer if playing */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-sm bg-[#282a32] border border-white/5">
                    {track.coverArt ? (
                      <img
                        src={track.coverArt}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#282a32] to-[#191b24] text-[#d0bcff]">
                        <span className="material-symbols-outlined text-[20px]">music_note</span>
                      </div>
                    )}

                    {isRowPlaying && (
                      <div className="absolute inset-0 bg-[#340080]/60 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex items-end gap-[2px] h-3.5">
                          <span className="w-[3px] h-full bg-[#4cd7f6] rounded-full animate-pulse" />
                          <span className="w-[3px] h-2 bg-[#d0bcff] rounded-full animate-bounce" />
                          <span className="w-[3px] h-3 bg-[#4edea3] rounded-full animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Track Details */}
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-[#d0bcff]' : 'text-[#e2e1ee]'
                      }`}
                    >
                      {track.title}
                    </span>
                    <span className="text-xs text-[#cbc3d7]/70 truncate">
                      {track.artist}
                    </span>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span
                        className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${
                          track.isLossless
                            ? 'bg-[#33343e] text-[#4cd7f6]'
                            : 'bg-[#282a32] text-[#958ea0]'
                        }`}
                      >
                        {track.format}
                      </span>
                      {track.fileSizeMB && (
                        <span className="text-[10px] font-mono text-[#958ea0]">
                          {track.fileSizeMB} MB
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Duration & 3-dots */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs font-mono text-[#958ea0]">
                    {track.durationFormatted}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('medium');
                      onOpenContextMenu(track);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#958ea0] hover:text-[#e2e1ee] hover:bg-[#33343e] transition-colors"
                    aria-label="Track options"
                  >
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTracks.length === 0 && searchQuery && (
            <div className="py-12 text-center text-[#cbc3d7]/60 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-4xl text-[#958ea0]">search_off</span>
              <p className="text-sm">No offline tracks matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}

      {/* End of collection footer */}
      {tracks.length > 0 && (
        <div className="flex flex-col items-center justify-center text-center py-6 gap-1 border-t border-white/5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] shadow-[0_0_6px_rgba(76,215,246,0.8)]" />
          <span className="text-[10px] font-mono uppercase text-[#958ea0] tracking-wider">
            {tracks.length} Master Tracks Offline • No network telemetry
          </span>
        </div>
      )}
    </div>
  );
};
