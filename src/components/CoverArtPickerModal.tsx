import React, { useState, useRef } from 'react';
import { fileToDataUrl } from '../utils/vaultStorage';
import { triggerHaptic } from '../utils/haptics';

export interface CoverPreset {
  id: string;
  name: string;
  url: string;
}

export const COVER_PRESETS: CoverPreset[] = [
  {
    id: 'preset-cyber',
    name: 'Cyber Synth',
    url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'preset-vinyl',
    name: 'Vintage Vinyl',
    url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'preset-cosmic',
    name: 'Deep Nebula',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'preset-acoustic',
    name: 'Acoustic Warmth',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'preset-ambient',
    name: 'Solar Drift',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'preset-tape',
    name: 'Analog Master',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
  },
];

interface CoverArtPickerModalProps {
  isOpen: boolean;
  currentArtwork: string;
  songTitle?: string;
  onClose: () => void;
  onSelectArtwork: (newArtworkUrl: string) => void;
}

export const CoverArtPickerModal: React.FC<CoverArtPickerModalProps> = ({
  isOpen,
  currentArtwork,
  songTitle = 'Selected Song',
  onClose,
  onSelectArtwork,
}) => {
  const [selectedUrl, setSelectedUrl] = useState(currentArtwork);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setLoading(true);
    triggerHaptic('medium');

    try {
      // Convert to base64 Data URL so it is stored permanently in IndexedDB without expiring
      const dataUrl = await fileToDataUrl(file);
      setSelectedUrl(dataUrl);
    } catch {
      // Fallback object URL
      setSelectedUrl(URL.createObjectURL(file));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    triggerHaptic('light');
    setSelectedUrl(urlInput.trim());
    setUrlInput('');
  };

  const handleConfirm = () => {
    triggerHaptic('success');
    onSelectArtwork(selectedUrl);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0c0e16]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#282a32] rounded-3xl p-4 shadow-2xl flex flex-col gap-4 border border-white/10 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#381e72] flex items-center justify-center text-[#d0bcff]">
              <span className="material-symbols-outlined text-[22px]">image</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-bold text-[#e2e1ee] truncate">
                Set Custom Cover Art
              </h3>
              <span className="text-[11px] font-mono text-[#4cd7f6] truncate">
                {songTitle}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#33343e] flex items-center justify-center text-[#cbc3d7] hover:text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Live Square Preview */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-44 h-44 rounded-2xl overflow-hidden bg-[#11131b] border-2 border-[#d0bcff]/40 shadow-xl flex items-center justify-center">
            {selectedUrl ? (
              <img
                src={selectedUrl}
                alt="Cover Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-[#958ea0]">
                <span className="material-symbols-outlined text-4xl">broken_image</span>
                <span className="text-xs">No Cover Chosen</span>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-[#11131b]/70 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-[#4cd7f6] animate-spin">
                  sync
                </span>
              </div>
            )}
          </div>
          <span className="text-[10px] font-mono text-[#4edea3] uppercase font-semibold">
            Square 1:1 Aspect Ratio • Bit-Exact Hi-Res
          </span>
        </div>

        {/* Option 1: Pick from Device Storage / Downloads */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase text-[#cbc3d7]/70 font-semibold">
            Method 1: Upload from Phone (Gallery / Downloads)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleFilePick}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-3.5 rounded-xl bg-[#191b24] hover:bg-[#1d1f28] border border-white/10 flex items-center justify-center gap-2 text-xs font-semibold text-[#e2e1ee] active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px] text-[#4edea3]">
              add_photo_alternate
            </span>
            <span>Choose Image File from Phone</span>
          </button>
        </div>

        {/* Option 2: Paste Image URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase text-[#cbc3d7]/70 font-semibold">
            Method 2: Paste Downloaded / Online Image URL
          </label>
          <div className="flex items-center gap-1.5 bg-[#191b24] p-1 rounded-xl border border-white/10">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://.../album-artwork.jpg"
              className="w-full bg-transparent px-2.5 py-1 text-xs text-[#e2e1ee] placeholder-[#958ea0] focus:outline-none font-mono"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-[#33343e] hover:bg-[#4cd7f6] hover:text-[#003640] text-xs font-bold text-[#e2e1ee] transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Option 3: Presets */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase text-[#cbc3d7]/70 font-semibold">
            Method 3: Choose Instant Art Preset
          </label>
          <div className="grid grid-cols-3 gap-2">
            {COVER_PRESETS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedUrl(preset.url);
                }}
                className={`flex flex-col items-center gap-1 p-1 rounded-xl cursor-pointer border transition-all ${
                  selectedUrl === preset.url
                    ? 'border-[#d0bcff] bg-[#381e72]/30 shadow-md'
                    : 'border-white/5 bg-[#191b24] hover:border-white/20'
                }`}
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-black/40">
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[9px] font-mono text-[#cbc3d7] truncate w-full text-center">
                  {preset.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Android Tip Callout */}
        <div className="p-2.5 rounded-xl bg-[#191b24]/80 border border-white/5 text-[11px] text-[#cbc3d7]/70 leading-relaxed flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#4cd7f6] mt-0.5 shrink-0">
            lightbulb
          </span>
          <p>
            <strong>Android Tip:</strong> Search for the album art on Google, long-press to save to your Android Downloads folder, then tap "Choose Image File from Phone" above!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#33343e] text-[#e2e1ee] font-semibold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] text-[#2c006b] font-bold text-xs shadow-lg active:scale-95 transition-transform"
          >
            Save to Song
          </button>
        </div>
      </div>
    </div>
  );
};
