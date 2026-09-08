import React, { useState } from 'react';
import { SoundBundle, Track } from '../types';
import { exportBundleFile } from '../utils/bundleStorage';

interface BundlesViewProps {
  bundles: SoundBundle[];
  vaultTracks: Track[];
  onSaveBundle: (bundle: SoundBundle) => void;
}

export const BundlesView: React.FC<BundlesViewProps> = ({
  bundles,
  vaultTracks,
  onSaveBundle,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'p2p' | 'zip'>('p2p');
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeShareBundle, setActiveShareBundle] = useState<SoundBundle>(bundles[0]);
  const [copySuccess, setCopySuccess] = useState(false);

  // New Bundle Creator state
  const [isCreatingBundle, setIsCreatingBundle] = useState(false);
  const [newBundleTitle, setNewBundleTitle] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  const handleOpenShare = (bundle: SoundBundle) => {
    setActiveShareBundle(bundle);
    setShowQrModal(true);
  };

  const handleCopyLink = () => {
    setCopySuccess(true);
    setTimeout(() => {
      setCopySuccess(false);
    }, 1800);
  };

  const handleCreateBundleSubmit = () => {
    if (!newBundleTitle.trim()) return;

    const chosenTracks = vaultTracks.filter((t) => selectedTrackIds.includes(t.id));
    const totalSize = chosenTracks.reduce((sum, t) => sum + (t.fileSizeMB || 30), 0) || 120;

    const newBundle: SoundBundle = {
      id: 'bundle-' + Date.now(),
      title: newBundleTitle.trim(),
      trackCount: Math.max(1, chosenTracks.length),
      totalSizeMB: totalSize,
      lossless: chosenTracks.some((t) => t.isLossless),
      coverArt: chosenTracks[0]?.coverArt || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
      tags: ['Local Offline Package', 'Zero Loss'],
      trackIds: selectedTrackIds,
      status: 'READY',
      formatLabel: `${totalSize} MB Master Archive`,
      dateCreated: new Date().toISOString().split('T')[0],
    };

    onSaveBundle(newBundle);
    setIsCreatingBundle(false);
    setNewBundleTitle('');
    setSelectedTrackIds([]);
  };

  const activeBundle = bundles[0] || {
    id: 'bundle-synth-8893',
    title: 'Late Night Synthwave Vault',
    trackCount: 24,
    totalSizeMB: 680,
    lossless: true,
    coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&auto=format&fit=crop',
    tags: ['Full Dynamic Masters', '3000px Covers & Cues', 'P2P Verified Hash'],
    trackIds: ['track-1', 'track-2'],
    status: 'SYNCED',
    formatLabel: '680 MB Lossless Audio',
    dateCreated: '2026-09-02',
  };

  return (
    <div className="flex flex-col w-full px-4 gap-4 pt-2 pb-36 max-w-lg mx-auto select-none">
      {/* Page Header */}
      <div className="flex flex-col gap-1 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#d0bcff] text-[24px]">archive</span>
            <h1 className="text-2xl font-bold tracking-tight text-[#e2e1ee]">SoundBundles</h1>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#282a32] text-[#4cd7f6] border border-[#4cd7f6]/20">
            v2.4 P2P SYNC
          </span>
        </div>
        <p className="text-xs text-[#cbc3d7]/70">
          Export & share lossless offline packages with zero quality loss.
        </p>
      </div>

      {/* Hero / Primary Action CTA Button */}
      <button
        onClick={() => {
          setSelectedTrackIds(vaultTracks.slice(0, 3).map((t) => t.id));
          setIsCreatingBundle(true);
        }}
        className="w-full relative group overflow-hidden rounded-2xl p-[1.5px] bg-gradient-to-r from-[#a078ff] via-[#03b5d3] to-[#00a572] shadow-[0_4px_24px_rgba(160,120,255,0.25)] active:scale-[0.99] transition-transform text-left"
      >
        <div className="flex items-center justify-between w-full h-full px-4 py-3.5 bg-[#282a32]/95 rounded-[14.5px] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#d0bcff] flex items-center justify-center text-[#3c0091] shadow-[0_0_16px_rgba(208,188,255,0.4)] shrink-0">
              <span className="material-symbols-outlined text-[24px]">add</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#e2e1ee]">
                + Create New Bundle
              </span>
              <span className="text-xs text-[#cbc3d7]/70">
                Pack tracks, metadata & hires art into .soundvault
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#d0bcff] text-[20px] transition-transform group-hover:translate-x-1">
            arrow_forward_ios
          </span>
        </div>
      </button>

      {/* Active Bundle Showcase Card */}
      <div className="flex flex-col rounded-2xl bg-[#282a32]/80 backdrop-blur-xl p-4 shadow-xl gap-3.5 border border-white/10 relative overflow-hidden">
        {/* Ambient back-glows */}
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#a078ff]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-[#03b5d3]/15 blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10 bg-[#191b24]">
              <img
                src={activeBundle.coverArt}
                alt={activeBundle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e16]/80 via-transparent to-transparent flex items-end p-1">
                <span className="text-[9px] font-mono uppercase text-[#4cd7f6] font-bold">
                  FLAC
                </span>
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-[#4edea3] uppercase font-bold">
                  Active Bundle
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
              </div>
              <span className="text-sm font-bold text-[#e2e1ee] truncate">
                {activeBundle.title}
              </span>
              <span className="text-xs text-[#cbc3d7]/70">
                {activeBundle.trackCount} Tracks • {activeBundle.totalSizeMB} MB Lossless Audio
              </span>
            </div>
          </div>

          <button
            onClick={() => handleOpenShare(activeBundle)}
            className="w-8 h-8 rounded-full bg-[#33343e] flex items-center justify-center text-[#cbc3d7] hover:text-[#e2e1ee]"
          >
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>
        </div>

        {/* Metadata Tags Micro Chips */}
        <div className="flex flex-wrap gap-1.5 relative z-10">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#0c0e16] text-[#4cd7f6] flex items-center gap-1 border border-white/5">
            <span className="material-symbols-outlined text-[13px]">album</span>
            Full Dynamic Masters
          </span>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#0c0e16] text-[#cbc3d7] flex items-center gap-1 border border-white/5">
            <span className="material-symbols-outlined text-[13px]">image</span>
            3000px Covers & Cues
          </span>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#0c0e16] text-[#4edea3] flex items-center gap-1 border border-white/5">
            <span className="material-symbols-outlined text-[13px]">lock</span>
            P2P Verified Hash
          </span>
        </div>

        {/* Sharing Topology & Format Selector */}
        <div className="flex flex-col gap-1.5 relative z-10 pt-1">
          <span className="text-[10px] font-mono uppercase text-[#cbc3d7]/70 tracking-wider">
            Sharing Topology & Format
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div
              onClick={() => setSelectedFormat('p2p')}
              className={`flex flex-col p-2.5 rounded-xl cursor-pointer border transition-all ${
                selectedFormat === 'p2p'
                  ? 'bg-[#0c0e16] border-[#4cd7f6]/40 shadow-sm'
                  : 'bg-[#191b24] border-transparent opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">
                  sensors
                </span>
                {selectedFormat === 'p2p' && (
                  <span className="w-2 h-2 rounded-full bg-[#4cd7f6] shadow-[0_0_6px_rgba(76,215,246,0.8)]" />
                )}
              </div>
              <span className="text-xs font-bold text-[#e2e1ee]">P2P AirDrop / Wi-Fi</span>
              <span className="text-[11px] text-[#cbc3d7]/70 leading-tight mt-0.5">
                Direct local network stream
              </span>
            </div>

            <div
              onClick={() => setSelectedFormat('zip')}
              className={`flex flex-col p-2.5 rounded-xl cursor-pointer border transition-all ${
                selectedFormat === 'zip'
                  ? 'bg-[#0c0e16] border-[#d0bcff]/40 shadow-sm'
                  : 'bg-[#191b24] border-transparent opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="material-symbols-outlined text-[#d0bcff] text-[20px]">
                  inventory_2
                </span>
                <span className="text-[9px] font-mono text-[#d0bcff] font-bold">ZIP-RAW</span>
              </div>
              <span className="text-xs font-bold text-[#e2e1ee]">.soundvault File</span>
              <span className="text-[11px] text-[#cbc3d7]/70 leading-tight mt-0.5">
                Encrypted single archive
              </span>
            </div>
          </div>
        </div>

        {/* Main Card Action Buttons */}
        <div className="flex flex-col gap-2 relative z-10 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleOpenShare(activeBundle)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#d0bcff] text-[#3c0091] font-bold text-xs shadow-[0_0_16px_rgba(208,188,255,0.3)] active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              <span>QR Sync / Link</span>
            </button>

            <button
              onClick={() => exportBundleFile(activeBundle)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1d1f28] text-[#e2e1ee] hover:bg-[#33343e] font-semibold text-xs border border-white/5 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">
                download_for_offline
              </span>
              <span>Export File</span>
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedTrackIds(activeBundle.trackIds || []);
              setIsCreatingBundle(true);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-transparent text-[#cbc3d7]/70 hover:text-[#e2e1ee] text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">playlist_add</span>
            <span>Add or Remove Tracks ({activeBundle.trackCount} Selected)</span>
          </button>
        </div>
      </div>

      {/* Peer Discovery Active Radar Widget */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#191b24] border border-white/5 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-full bg-[#282a32] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#4edea3] text-[20px] animate-pulse">
              radar
            </span>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#4edea3] rounded-full shadow-[0_0_8px_rgba(78,222,163,0.9)]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#e2e1ee] truncate">
              3 Local Peers Nearby
            </span>
            <span className="text-[11px] text-[#cbc3d7]/70 truncate">
              Ready to receive bundles via Zero-Loss LAN
            </span>
          </div>
        </div>

        <button
          onClick={() => alert('Broadcasting presence to local network on 5 GHz Wi-Fi Direct...')}
          className="px-3 py-1.5 rounded-full bg-[#282a32] text-[#4edea3] font-mono text-[10px] font-bold hover:bg-[#33343e] border border-[#4edea3]/20 active:scale-95 transition-transform"
        >
          BROADCAST
        </button>
      </div>

      {/* Existing Saved Bundles List */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#e2e1ee]">Your Saved Bundles</h2>
          <span className="text-xs font-mono text-[#d0bcff] font-semibold">
            {bundles.length} Bundles
          </span>
        </div>

        {bundles.map((bundle) => (
          <div
            key={bundle.id}
            className="flex flex-col p-3 rounded-2xl bg-[#282a32] border border-white/5 gap-2 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md bg-[#191b24] border border-white/5">
                  <img
                    src={bundle.coverArt}
                    alt={bundle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#e2e1ee] truncate">
                    {bundle.title}
                  </span>
                  <span className="text-[11px] text-[#cbc3d7]/70">
                    {bundle.trackCount} songs • {bundle.totalSizeMB} MB {bundle.lossless ? 'FLAC' : 'Mastered'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenShare(bundle)}
                  className="w-9 h-9 rounded-full bg-[#1d1f28] flex items-center justify-center text-[#cbc3d7] hover:text-[#4cd7f6] active:scale-90 transition-transform"
                  aria-label="Share bundle"
                >
                  <span className="material-symbols-outlined text-[19px]">share</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-[#cbc3d7]/70">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[15px]">
                  {bundle.sharedWith ? 'group' : 'cloud_off'}
                </span>
                <span className="text-[10px] font-mono">
                  {bundle.sharedWith
                    ? `Shared with ${bundle.sharedWith}`
                    : 'Self-Contained Library File'}
                </span>
              </div>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                  bundle.status === 'SYNCED'
                    ? 'text-[#4edea3] bg-[#003824]'
                    : 'text-[#cbc3d7] bg-[#1d1f28]'
                }`}
              >
                {bundle.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Quick Sync Modal Overlay */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e16]/80 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="relative flex flex-col w-full max-w-sm rounded-2xl bg-[#282a32] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.8)] gap-3.5 items-center text-center border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#1d1f28] flex items-center justify-center text-[#cbc3d7] hover:text-white"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Modal Title */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="w-12 h-12 rounded-full bg-[#a078ff]/20 flex items-center justify-center text-[#d0bcff] mb-1">
                <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
              </div>
              <span className="text-base font-bold text-[#e2e1ee]">Scan to Clone Bundle</span>
              <p className="text-xs text-[#cbc3d7]/70 px-2">
                Your friend simply points their SoundVault app camera to receive the entire vault
                over Wi-Fi Direct.
              </p>
            </div>

            {/* Styled Futuristic QR Card */}
            <div className="relative p-4 rounded-xl bg-[#11131b] shadow-inner flex flex-col items-center border border-white/5">
              <svg
                className="w-44 h-44 text-[#e2e1ee]"
                fill="none"
                viewBox="0 0 160 160"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="160" height="160" rx="8" fill="#11131b" />
                <rect x="16" y="16" width="36" height="36" rx="4" stroke="#d0bcff" strokeWidth="4" />
                <rect x="24" y="24" width="20" height="20" rx="2" fill="#d0bcff" />
                <rect x="108" y="16" width="36" height="36" rx="4" stroke="#d0bcff" strokeWidth="4" />
                <rect x="116" y="24" width="20" height="20" rx="2" fill="#d0bcff" />
                <rect x="16" y="108" width="36" height="36" rx="4" stroke="#4cd7f6" strokeWidth="4" />
                <rect x="24" y="116" width="20" height="20" rx="2" fill="#4cd7f6" />
                <circle cx="64" cy="24" r="3" fill="#4cd7f6" />
                <circle cx="76" cy="24" r="3" fill="#d0bcff" />
                <circle cx="88" cy="24" r="3" fill="#e2e1ee" />
                <circle cx="64" cy="36" r="3" fill="#e2e1ee" />
                <circle cx="88" cy="36" r="3" fill="#4edea3" />
                <rect x="64" y="60" width="32" height="32" rx="4" fill="#282a32" />
                <path d="M74 76L80 70L86 76V84H74V76Z" fill="#d0bcff" />
                <circle cx="24" cy="64" r="3" fill="#e2e1ee" />
                <circle cx="36" cy="64" r="3" fill="#4edea3" />
                <circle cx="48" cy="64" r="3" fill="#d0bcff" />
                <circle cx="24" cy="76" r="3" fill="#4cd7f6" />
                <circle cx="36" cy="88" r="3" fill="#e2e1ee" />
                <circle cx="48" cy="76" r="3" fill="#4cd7f6" />
                <circle cx="116" cy="64" r="3" fill="#d0bcff" />
                <circle cx="128" cy="64" r="3" fill="#e2e1ee" />
                <circle cx="140" cy="76" r="3" fill="#4edea3" />
                <circle cx="116" cy="88" r="3" fill="#4cd7f6" />
                <circle cx="128" cy="88" r="3" fill="#e2e1ee" />
                <circle cx="64" cy="116" r="3" fill="#d0bcff" />
                <circle cx="76" cy="116" r="3" fill="#e2e1ee" />
                <circle cx="88" cy="116" r="3" fill="#4cd7f6" />
                <circle cx="64" cy="128" r="3" fill="#e2e1ee" />
                <circle cx="76" cy="140" r="3" fill="#4edea3" />
                <circle cx="108" cy="116" r="3" fill="#4cd7f6" />
                <circle cx="120" cy="128" r="3" fill="#d0bcff" />
                <circle cx="132" cy="140" r="3" fill="#e2e1ee" />
              </svg>

              <div className="flex items-center gap-1.5 mt-3 text-[#4cd7f6]">
                <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-ping" />
                <span className="text-[10px] font-mono font-bold">
                  P2P CHANNEL READY • 5 GHz
                </span>
              </div>
            </div>

            {/* Quick Peer Link Copier */}
            <div className="flex items-center justify-between w-full p-2 px-3 rounded-lg bg-[#11131b] border border-white/5">
              <span className="text-[10px] font-mono text-[#cbc3d7]/80 truncate mr-2">
                soundvault://p2p/bundle?id={activeShareBundle.id}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded bg-[#d0bcff] text-[#3c0091] text-[10px] font-mono font-bold uppercase shrink-0 hover:bg-white"
              >
                {copySuccess ? 'COPIED!' : 'Copy'}
              </button>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-lg bg-[#1d1f28] text-[#e2e1ee] text-xs font-semibold hover:bg-[#33343e]"
            >
              Done Sharing
            </button>
          </div>
        </div>
      )}

      {/* Create New Bundle Modal */}
      {isCreatingBundle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e16]/80 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setIsCreatingBundle(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#282a32] p-5 shadow-2xl flex flex-col gap-3.5 border border-white/10 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/5">
              <span className="text-base font-bold text-[#e2e1ee]">Bundle Packager</span>
              <button
                onClick={() => setIsCreatingBundle(false)}
                className="w-7 h-7 rounded-full bg-[#1d1f28] flex items-center justify-center text-[#e2e1ee]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase text-[#cbc3d7]">
                Bundle Name
              </label>
              <input
                type="text"
                value={newBundleTitle}
                onChange={(e) => setNewBundleTitle(e.target.value)}
                placeholder="e.g. Midnight Roadtrip Vault"
                className="w-full bg-[#11131b] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#e2e1ee] focus:outline-none focus:border-[#d0bcff]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase text-[#cbc3d7]">
                Select Tracks to Bundle ({selectedTrackIds.length} chosen)
              </label>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                {vaultTracks.map((t) => {
                  const isChecked = selectedTrackIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedTrackIds(selectedTrackIds.filter((id) => id !== t.id));
                        } else {
                          setSelectedTrackIds([...selectedTrackIds, t.id]);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border text-xs transition-colors ${
                        isChecked
                          ? 'bg-[#1d1f28] border-[#d0bcff]/40'
                          : 'bg-[#191b24] border-transparent opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            isChecked ? 'text-[#d0bcff]' : 'text-[#958ea0]'
                          }`}
                        >
                          {isChecked ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <span className="truncate text-[#e2e1ee] font-medium">{t.title}</span>
                      </div>
                      <span className="font-mono text-[10px] text-[#958ea0] shrink-0">
                        {t.format}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsCreatingBundle(false)}
                className="flex-1 py-2.5 rounded-lg bg-[#1d1f28] text-[#e2e1ee] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBundleSubmit}
                disabled={!newBundleTitle.trim()}
                className="flex-1 py-2.5 rounded-lg bg-[#d0bcff] text-[#3c0091] text-xs font-bold hover:bg-white disabled:opacity-50"
              >
                Create Bundle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
