import React, { useState, useRef } from 'react';
import { AppSettings, Track } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  tracks: Track[];
  onPurgeCache: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  tracks,
  onPurgeCache,
}) => {
  const [purgeFeedback, setPurgeFeedback] = useState(false);
  const [exportFeedback, setExportFeedback] = useState(false);

  const crossfadeRef = useRef<HTMLDivElement>(null);

  // Toggle helper
  const handleToggle = (key: keyof AppSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  // Crossfade slider pointer handler
  const handleCrossfadePointer = (clientX: number) => {
    if (!crossfadeRef.current) return;
    const rect = crossfadeRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const seconds = Math.round(ratio * 12 * 10) / 10; // 0 to 12s with 0.1s precision
    onUpdateSettings({
      ...settings,
      gaplessCrossfadeSec: seconds,
    });
  };

  const handlePurge = () => {
    onPurgeCache();
    setPurgeFeedback(true);
    setTimeout(() => {
      setPurgeFeedback(false);
    }, 2000);
  };

  const handleExportVault = () => {
    setExportFeedback(true);

    const vaultArchive = {
      spec: 'SOUNDVAULT_FULL_BACKUP_v2.4',
      exportDate: new Date().toISOString(),
      trackCount: tracks.length,
      tracks: tracks.map((t) => ({
        title: t.title,
        artist: t.artist,
        album: t.album,
        format: t.format,
        duration: t.duration,
      })),
      settings,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vaultArchive, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `soundvault_library_backup_${new Date().toISOString().split('T')[0]}.soundvault`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();

    setTimeout(() => {
      setExportFeedback(false);
    }, 2000);
  };

  const crossfadePercent = Math.min(100, Math.max(0, (settings.gaplessCrossfadeSec / 12) * 100));

  return (
    <div className="flex flex-col w-full px-4 gap-4 pt-2 pb-36 max-w-lg mx-auto select-none">
      {/* Header */}
      <section className="flex items-center justify-between mt-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] shadow-[0_0_8px_rgba(76,215,246,0.8)]" />
            <span className="text-[10px] font-mono uppercase text-[#4cd7f6] tracking-wider font-semibold">
              Hi-Res Engine Rig
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e2e1ee]">
            Audio & Offline Hub
          </h1>
        </div>

        <div className="w-10 h-10 rounded-xl bg-[#282a32] flex items-center justify-center text-[#d0bcff] shadow-sm border border-white/5">
          <span className="material-symbols-outlined text-[24px]">tune</span>
        </div>
      </section>

      {/* Offline Cache Storage Manager */}
      <section className="rounded-2xl bg-[#282a32] p-4 shadow-md flex flex-col gap-3.5 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#33343e] flex items-center justify-center text-[#4cd7f6]">
              <span className="material-symbols-outlined text-[20px]">hard_drive</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-[#e2e1ee]">Storage Vault</h2>
              <span className="text-xs text-[#cbc3d7]/70">Allocated local solid-state partition</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#4edea3] bg-[#003824] px-2.5 py-0.5 rounded-full border border-[#4edea3]/20">
            ENCRYPTED
          </span>
        </div>

        {/* Storage Meter */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#e2e1ee] font-medium">Used 18.4 GB of 64 GB reserved</span>
            <span className="text-[11px] font-mono text-[#d0bcff] font-bold">28.7%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#11131b] overflow-hidden flex relative p-0.5 border border-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#d0bcff] via-[#a078ff] to-[#4cd7f6] transition-all duration-500"
              style={{ width: '28.7%' }}
            />
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#d0bcff]" />
              <span className="text-[9px] font-mono uppercase text-[#cbc3d7]/70">
                FLAC Masters (14.2 GB)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
              <span className="text-[9px] font-mono uppercase text-[#cbc3d7]/70">
                Cache Index (4.2 GB)
              </span>
            </div>
          </div>
        </div>

        {/* Storage Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handlePurge}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#33343e] text-[#ffb4ab] hover:bg-[#373942] active:scale-[0.98] transition-all border border-white/5"
          >
            <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">
              {purgeFeedback ? 'check' : 'delete_sweep'}
            </span>
            <span className="text-xs font-semibold">
              {purgeFeedback ? 'Purged!' : 'Purge Cache'}
            </span>
          </button>

          <button
            onClick={handleExportVault}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1d1f28] text-[#e2e1ee] hover:bg-[#33343e] active:scale-[0.98] transition-all border border-white/5"
          >
            <span className="material-symbols-outlined text-[18px] text-[#4cd7f6]">
              {exportFeedback ? 'check_circle' : 'archive'}
            </span>
            <span className="text-xs font-semibold">
              {exportFeedback ? 'Exported!' : 'Export Vault'}
            </span>
          </button>
        </div>
      </section>

      {/* Ingest & Clean Rules */}
      <section className="rounded-2xl bg-[#282a32] p-4 shadow-md flex flex-col gap-3 border border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#33343e] flex items-center justify-center text-[#d0bcff]">
            <span className="material-symbols-outlined text-[20px]">auto_fix</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-[#e2e1ee]">Ingest & Clean Rules</h2>
            <span className="text-xs text-[#cbc3d7]/70">Sanitize metadata on file arrival</span>
          </div>
        </div>

        {/* Smart Filename Sanitizer Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1d1f28] border border-white/5">
          <div className="flex flex-col pr-2">
            <span className="text-xs font-semibold text-[#e2e1ee]">Smart Filename Sanitizer</span>
            <span className="text-[11px] text-[#cbc3d7]/70">
              Strips tags like [Official Video], track digits & ugly separators
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.smartSanitizer}
            onClick={() => handleToggle('smartSanitizer')}
            className={`w-11 h-6 rounded-full relative flex items-center p-0.5 transition-colors cursor-pointer shrink-0 ${
              settings.smartSanitizer ? 'bg-[#d0bcff]' : 'bg-[#33343e]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full shadow-sm transform transition-transform ${
                settings.smartSanitizer ? 'translate-x-5 bg-[#3c0091]' : 'translate-x-0 bg-[#958ea0]'
              }`}
            />
          </button>
        </div>

        {/* Default Ingest Bitrate */}
        <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-[#1d1f28] border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#e2e1ee]">Default Ingest Bitrate</span>
            <span className="text-[10px] font-mono text-[#4edea3] font-bold">BIT-EXACT</span>
          </div>
          <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-[#11131b] border border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#4edea3]">
                check_circle
              </span>
              <span className="text-[11px] font-mono text-[#e2e1ee] font-semibold">
                Original Uncompressed (Lossless Pass-through)
              </span>
            </div>
            <span className="material-symbols-outlined text-[17px] text-[#958ea0]">lock</span>
          </div>
        </div>

        {/* Auto-embed ID3 & Artwork Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1d1f28] border border-white/5">
          <div className="flex flex-col pr-2">
            <span className="text-xs font-semibold text-[#e2e1ee]">Auto-Embed ID3 & Artwork</span>
            <span className="text-[11px] text-[#cbc3d7]/70">
              Bake studio canvas and Vorbis tags directly into containers
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.autoEmbedID3}
            onClick={() => handleToggle('autoEmbedID3')}
            className={`w-11 h-6 rounded-full relative flex items-center p-0.5 transition-colors cursor-pointer shrink-0 ${
              settings.autoEmbedID3 ? 'bg-[#d0bcff]' : 'bg-[#33343e]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full shadow-sm transform transition-transform ${
                settings.autoEmbedID3 ? 'translate-x-5 bg-[#3c0091]' : 'translate-x-0 bg-[#958ea0]'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Acoustic Audio Engine */}
      <section className="rounded-2xl bg-[#282a32] p-4 shadow-md flex flex-col gap-3 border border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#33343e] flex items-center justify-center text-[#4cd7f6]">
            <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-[#e2e1ee]">Acoustic Audio Engine</h2>
            <span className="text-xs text-[#cbc3d7]/70">Hardware DSP and output configuration</span>
          </div>
        </div>

        {/* Bit-Perfect Playback Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1d1f28] border border-white/5">
          <div className="flex flex-col pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#e2e1ee]">Bit-Perfect Playback</span>
              <span className="text-[9px] font-mono text-[#4cd7f6] bg-[#33343e] px-1.5 py-0.5 rounded font-bold">
                DAC
              </span>
            </div>
            <span className="text-[11px] text-[#cbc3d7]/70">
              Bypass OS audio resampler with exclusive device lock
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.bitPerfectPlayback}
            onClick={() => handleToggle('bitPerfectPlayback')}
            className={`w-11 h-6 rounded-full relative flex items-center p-0.5 transition-colors cursor-pointer shrink-0 ${
              settings.bitPerfectPlayback ? 'bg-[#d0bcff]' : 'bg-[#33343e]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full shadow-sm transform transition-transform ${
                settings.bitPerfectPlayback ? 'translate-x-5 bg-[#3c0091]' : 'translate-x-0 bg-[#958ea0]'
              }`}
            />
          </button>
        </div>

        {/* Gapless & Crossfade Slider */}
        <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-[#1d1f28] border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#e2e1ee]">Gapless & Crossfade</span>
              <span className="text-[11px] text-[#cbc3d7]/70">Smooth studio cross-track blend</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#4cd7f6] bg-[#33343e] px-2 py-0.5 rounded border border-white/5">
              {settings.gaplessCrossfadeSec}s
            </span>
          </div>

          <div className="flex flex-col gap-1 pt-1">
            <div
              ref={crossfadeRef}
              onClick={(e) => handleCrossfadePointer(e.clientX)}
              className="relative flex items-center h-6 w-full cursor-pointer touch-none"
            >
              <div className="w-full h-1.5 rounded-full bg-[#11131b] overflow-hidden flex relative border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6]"
                  style={{ width: `${crossfadePercent}%` }}
                />
              </div>
              <div
                className="absolute w-5 h-5 rounded-full bg-white shadow-[0_0_10px_rgba(76,215,246,0.6)] transform -translate-x-1/2 flex items-center justify-center transition-transform hover:scale-110 active:scale-125 pointer-events-none"
                style={{ left: `${crossfadePercent}%` }}
              >
                <span className="w-2 h-2 rounded-full bg-[#d0bcff]" />
              </div>
            </div>

            <div className="flex justify-between items-center text-[#958ea0] text-[10px] font-mono">
              <span>0s (Gapless True)</span>
              <span>6s</span>
              <span>12s (Max)</span>
            </div>
          </div>
        </div>

        {/* ReplayGain Normalization Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1d1f28] border border-white/5">
          <div className="flex flex-col pr-2">
            <span className="text-xs font-semibold text-[#e2e1ee]">ReplayGain Normalization</span>
            <span className="text-[11px] text-[#cbc3d7]/70">
              LUFS EBU R128 loudness target without clipping
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.replayGain}
            onClick={() => handleToggle('replayGain')}
            className={`w-11 h-6 rounded-full relative flex items-center p-0.5 transition-colors cursor-pointer shrink-0 ${
              settings.replayGain ? 'bg-[#d0bcff]' : 'bg-[#33343e]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full shadow-sm transform transition-transform ${
                settings.replayGain ? 'translate-x-5 bg-[#3c0091]' : 'translate-x-0 bg-[#958ea0]'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Network & Mesh */}
      <section className="rounded-2xl bg-[#282a32] p-4 shadow-md flex flex-col gap-3 border border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#33343e] flex items-center justify-center text-[#4edea3]">
            <span className="material-symbols-outlined text-[20px]">hub</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-[#e2e1ee]">Network & Mesh</h2>
            <span className="text-xs text-[#cbc3d7]/70">P2P local sync and bandwidth throttle</span>
          </div>
        </div>

        {/* Wi-Fi Only Ingest */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1d1f28] border border-white/5">
          <div className="flex flex-col pr-2">
            <span className="text-xs font-semibold text-[#e2e1ee]">Wi-Fi Only Ingest</span>
            <span className="text-[11px] text-[#cbc3d7]/70">
              Prevent high-res lossless streaming on cellular feeds
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.wifiOnlyIngest}
            onClick={() => handleToggle('wifiOnlyIngest')}
            className={`w-11 h-6 rounded-full relative flex items-center p-0.5 transition-colors cursor-pointer shrink-0 ${
              settings.wifiOnlyIngest ? 'bg-[#d0bcff]' : 'bg-[#33343e]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full shadow-sm transform transition-transform ${
                settings.wifiOnlyIngest ? 'translate-x-5 bg-[#3c0091]' : 'translate-x-0 bg-[#958ea0]'
              }`}
            />
          </button>
        </div>

        {/* Peer-to-Peer Local Network Sharing */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1d1f28] border border-white/5">
          <div className="flex flex-col pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#e2e1ee]">Local P2P Node Sharing</span>
              <span className="w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_6px_rgba(78,222,163,0.7)]" />
            </div>
            <span className="text-[11px] text-[#cbc3d7]/70">
              Zero-config mDNS bundle discoverability with nearby vault hosts
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.localP2PSharing}
            onClick={() => handleToggle('localP2PSharing')}
            className={`w-11 h-6 rounded-full relative flex items-center p-0.5 transition-colors cursor-pointer shrink-0 ${
              settings.localP2PSharing ? 'bg-[#d0bcff]' : 'bg-[#33343e]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full shadow-sm transform transition-transform ${
                settings.localP2PSharing ? 'translate-x-5 bg-[#3c0091]' : 'translate-x-0 bg-[#958ea0]'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Hardware Metaphor Visual / Ambient Panel */}
      <div className="rounded-2xl bg-[#282a32] p-3.5 flex items-center justify-between gap-3 shadow-sm border border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#191b24] flex items-center justify-center text-[#d0bcff] shrink-0 border border-white/5">
            <span className="material-symbols-outlined text-[22px]">memory</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-[#e2e1ee] font-bold uppercase">
              Audio Buffer Pipeline
            </span>
            <span className="text-xs text-[#cbc3d7]/70">
              Double-buffered 192kHz/32-bit Float
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="w-1 h-3 rounded-full bg-[#4edea3] animate-pulse" />
          <span className="w-1 h-5 rounded-full bg-[#4edea3]" />
          <span className="w-1 h-2 rounded-full bg-[#4cd7f6]" />
          <span className="w-1 h-4 rounded-full bg-[#d0bcff]" />
          <span className="w-1 h-1.5 rounded-full bg-[#33343e]" />
        </div>
      </div>

      {/* About SoundVault Footer Card */}
      <footer className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#191b24] text-center gap-1 border border-white/5 mb-4">
        <div className="flex items-center gap-1.5 text-[#d0bcff]">
          <span className="material-symbols-outlined text-[20px]">verified_user</span>
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
            Self-Hosted Sanctum
          </span>
        </div>
        <p className="text-sm font-bold text-[#e2e1ee]">SoundVault v2.4.0</p>
        <p className="text-xs text-[#cbc3d7]/70">True Offline Audio Freedom • Zero Telemetry</p>
      </footer>
    </div>
  );
};
