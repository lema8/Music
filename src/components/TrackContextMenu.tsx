import React, { useState } from 'react';
import { Track } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { CoverArtPickerModal } from './CoverArtPickerModal';

interface TrackContextMenuProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (trackId: string) => void;
  onUpdateTrack: (updated: Track) => void;
  onAddToBundle?: (track: Track) => void;
}

export const TrackContextMenu: React.FC<TrackContextMenuProps> = ({
  track,
  isOpen,
  onClose,
  onDelete,
  onUpdateTrack,
  onAddToBundle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editCoverArt, setEditCoverArt] = useState('');
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  if (!isOpen || !track) return null;

  const handleStartEdit = () => {
    triggerHaptic('light');
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditAlbum(track.album);
    setEditCoverArt(track.coverArt);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    triggerHaptic('success');
    onUpdateTrack({
      ...track,
      title: editTitle.trim() || track.title,
      artist: editArtist.trim() || track.artist,
      album: editAlbum.trim() || track.album,
      coverArt: editCoverArt || track.coverArt,
    });
    setIsEditing(false);
    onClose();
  };

  const handleExport = () => {
    triggerHaptic('medium');
    const blob = track.audioBlob || new Blob([`Audio: ${track.title}`], { type: 'audio/flac' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.title.toLowerCase().replace(/\s+/g, '_')}.${track.formatType.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[#0c0e16]/80 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200 select-none"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg bg-[#282a32] rounded-t-3xl p-4 shadow-2xl flex flex-col gap-3 border-t border-white/10 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#11131b] shrink-0 border border-white/10">
                <img
                  src={track.coverArt}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#e2e1ee] truncate">
                  {track.title}
                </span>
                <span className="text-[10px] font-mono text-[#4cd7f6] uppercase tracking-wider">
                  {track.format} • {track.fileSizeMB} MB
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close track options"
              className="w-8 h-8 rounded-full bg-[#33343e] text-[#e2e1ee] flex items-center justify-center hover:bg-[#373942]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {isEditing ? (
            /* Metadata & Cover Art Edit Form */
            <div className="flex flex-col gap-3 py-1">
              {/* Artwork Row with Change Button */}
              <div className="flex items-center justify-between bg-[#191b24] p-2.5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10">
                    <img
                      src={editCoverArt}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#e2e1ee]">Song Artwork</span>
                    <span className="text-[10px] text-[#cbc3d7]/60">Custom high-res image</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsCoverModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#33343e] hover:bg-[#4cd7f6] hover:text-[#003640] text-xs font-semibold text-[#d0bcff] transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  <span>Change Art</span>
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase text-[#cbc3d7]">
                  Track Title (Rename)
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#11131b] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#e2e1ee] focus:outline-none focus:border-[#d0bcff]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase text-[#cbc3d7]">
                  Artist / Producer
                </label>
                <input
                  type="text"
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  className="w-full bg-[#11131b] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#e2e1ee] focus:outline-none focus:border-[#d0bcff]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase text-[#cbc3d7]">
                  Album Master
                </label>
                <input
                  type="text"
                  value={editAlbum}
                  onChange={(e) => setEditAlbum(e.target.value)}
                  className="w-full bg-[#11131b] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#e2e1ee] focus:outline-none focus:border-[#d0bcff]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 rounded-xl bg-[#33343e] text-[#e2e1ee] font-medium text-xs hover:bg-[#373942]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] text-[#2c006b] font-bold text-xs shadow-lg active:scale-95 transition-transform"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            /* Context Menu Options */
            <div className="flex flex-col gap-1.5 pt-1">
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1d1f28] hover:bg-[#33343e] text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#33343e] flex items-center justify-center text-[#d0bcff] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#e2e1ee]">
                    Rename & Change Cover Art
                  </span>
                  <span className="text-xs text-[#cbc3d7]/70">
                    Update Song Title, Artist, Album, or attach Custom Photo
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsCoverModalOpen(true);
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1d1f28] hover:bg-[#33343e] text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#33343e] flex items-center justify-center text-[#4edea3] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#e2e1ee]">
                    Set Custom Song Image
                  </span>
                  <span className="text-xs text-[#cbc3d7]/70">
                    Upload image from phone or paste downloaded URL
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  if (onAddToBundle) onAddToBundle(track);
                  onClose();
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1d1f28] hover:bg-[#33343e] text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#33343e] flex items-center justify-center text-[#4cd7f6] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#e2e1ee]">
                    Add to SoundBundle
                  </span>
                  <span className="text-xs text-[#cbc3d7]/70">
                    Group into portable archive for offline backup
                  </span>
                </div>
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1d1f28] hover:bg-[#33343e] text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#33343e] flex items-center justify-center text-[#d0bcff] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">ios_share</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#e2e1ee]">
                    Export Audio File
                  </span>
                  <span className="text-xs text-[#cbc3d7]/70">
                    Share or download raw audio file to device storage
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onDelete(track.id);
                  onClose();
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1d1f28] hover:bg-red-950/30 text-left transition-colors text-[#ffb4ab]"
              >
                <div className="w-9 h-9 rounded-lg bg-[#93000a]/20 flex items-center justify-center text-[#ffb4ab] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#ffb4ab]">
                    Delete from SoundVault
                  </span>
                  <span className="text-xs text-[#cbc3d7]/70">
                    Removes track from device and frees {track.fileSizeMB} MB
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cover Art Picker Modal */}
      <CoverArtPickerModal
        isOpen={isCoverModalOpen}
        currentArtwork={isEditing ? editCoverArt : track.coverArt}
        songTitle={track.title}
        onClose={() => setIsCoverModalOpen(false)}
        onSelectArtwork={(newArt) => {
          if (isEditing) {
            setEditCoverArt(newArt);
          } else {
            onUpdateTrack({
              ...track,
              coverArt: newArt,
            });
            onClose();
          }
        }}
      />
    </>
  );
};
