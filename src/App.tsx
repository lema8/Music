import React, { useState, useEffect, useRef, useCallback } from 'react';
import { registerAndroidBackButton, minimizeAndroidApp } from './utils/nativeBridge';
import { ActiveTab, Track, SoundBundle, AppSettings, EQPreset } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MiniPlayer } from './components/MiniPlayer';
import { VaultView } from './components/VaultView';
import { ImportView } from './components/ImportView';
import { PlayerView } from './components/PlayerView';
import { BundlesView } from './components/BundlesView';
import { SettingsView } from './components/SettingsView';
import { TrackContextMenu } from './components/TrackContextMenu';
import { AndroidSystemBar } from './components/AndroidSystemBar';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { audioEngine } from './utils/audioEngine';
import { loadVaultTracks, saveVaultTrack, deleteVaultTrack } from './utils/vaultStorage';
import { loadBundles, saveBundles } from './utils/bundleStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('vault');
  const [previousTab, setPreviousTab] = useState<ActiveTab>('vault');

  // Vault tracks & sound bundles
  const [tracks, setTracks] = useState<Track[]>([]);
  const [bundles, setBundles] = useState<SoundBundle[]>([]);

  // Player state synced with audioEngine
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(288);
  const [volume, setVolume] = useState<number>(0.75);
  const [eqPreset, setEqPreset] = useState<EQPreset>('Studio Warmth');

  // Context Menu Modal state
  const [contextMenuTrack, setContextMenuTrack] = useState<Track | null>(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  // Android Standalone Install Modal
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Global Settings state
  const [settings, setSettings] = useState<AppSettings>({
    smartSanitizer: true,
    defaultBitrateLossless: true,
    autoEmbedID3: true,
    bitPerfectPlayback: true,
    gaplessCrossfadeSec: 3.5,
    replayGain: false,
    wifiOnlyIngest: true,
    localP2PSharing: true,
  });

  // Profile status modal
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Load initial data from local IndexedDB
  useEffect(() => {
    async function init() {
      const loadedTracks = await loadVaultTracks();
      setTracks(loadedTracks);
      const loadedBundles = loadBundles();
      setBundles(loadedBundles);

      // Default active track to the first track in Vault
      if (loadedTracks.length > 0) {
        const initial = loadedTracks[0];
        setCurrentTrack(initial);
        audioEngine.setTrack(initial, false);
      }
    }
    init();
  }, []);

  // Subscribe to Audio Engine events
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe(() => {
      const state = audioEngine.getState();
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime);
      setDuration(state.duration || 288);
      setVolume(state.volume);
      setEqPreset(state.eqPreset);
    });
    return () => unsubscribe();
  }, []);

  // Handle Tab Switch
  const handleTabChange = (tab: ActiveTab) => {
    if (activeTab !== 'player') {
      setPreviousTab(activeTab);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select track from list and play
  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    audioEngine.setTrack(track, true);
  };

  // Next Track
  const handleNextTrack = useCallback(() => {
    if (!tracks.length) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIndex];
    setCurrentTrack(nextTrack);
    audioEngine.setTrack(nextTrack, true);
  }, [tracks, currentTrack]);

  // Previous Track
  const handlePrevTrack = useCallback(() => {
    if (!tracks.length) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const prevTrack = tracks[prevIndex];
    setCurrentTrack(prevTrack);
    audioEngine.setTrack(prevTrack, true);
  }, [tracks, currentTrack]);

  // Shuffle Vault
  const handleShuffleAll = () => {
    if (!tracks.length) return;
    const randomIndex = Math.floor(Math.random() * tracks.length);
    const randomTrack = tracks[randomIndex];
    setCurrentTrack(randomTrack);
    audioEngine.setTrack(randomTrack, true);
  };

  // Toggle favorite
  const handleToggleFavorite = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const updated = { ...t, isFavorite: !t.isFavorite };
          saveVaultTrack(updated);
          if (currentTrack?.id === trackId) {
            setCurrentTrack(updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  // Add newly imported track to vault
  const handleAddTrackToVault = (newTrack: Track) => {
    setTracks((prev) => [newTrack, ...prev]);
    saveVaultTrack(newTrack);
    setCurrentTrack(newTrack);
    audioEngine.setTrack(newTrack, true);
  };

  // Update track metadata or cover art from context menu / player
  const handleUpdateTrack = (updated: Track) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    saveVaultTrack(updated);
    if (currentTrack?.id === updated.id) {
      setCurrentTrack(updated);
      audioEngine.updateTrackMetadata(updated);
    }
  };

  // Delete track from vault
  const handleDeleteTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    deleteVaultTrack(trackId);
    if (currentTrack?.id === trackId) {
      const remaining = tracks.filter((t) => t.id !== trackId);
      if (remaining.length > 0) {
        setCurrentTrack(remaining[0]);
        audioEngine.setTrack(remaining[0], isPlaying);
      } else {
        setCurrentTrack(null);
        audioEngine.pause();
      }
    }
  };

  // Save new bundle
  const handleSaveBundle = (newBundle: SoundBundle) => {
    const updated = [newBundle, ...bundles];
    setBundles(updated);
    saveBundles(updated);
  };

  // Purge cache
  const handlePurgeCache = () => {
    localStorage.removeItem('soundvault_cache_index');
  };

  // Android hardware back button: close any open overlay → collapse the
  // fullscreen player → send the app to the background (native shell only).
  const uiStateRef = useRef({ overlay: false, tab: activeTab, prev: previousTab });
  uiStateRef.current = {
    overlay: isContextMenuOpen || isInstallModalOpen || showProfileModal,
    tab: activeTab,
    prev: previousTab,
  };

  useEffect(() => {
    registerAndroidBackButton(() => {
      const s = uiStateRef.current;
      if (s.overlay) {
        setIsContextMenuOpen(false);
        setIsInstallModalOpen(false);
        setShowProfileModal(false);
      } else if (s.tab === 'player') {
        setActiveTab(s.prev !== 'player' ? s.prev : 'vault');
      } else {
        minimizeAndroidApp();
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#11131b] text-[#e2e1ee] flex flex-col relative antialiased selection:bg-[#a078ff]/30 selection:text-[#d0bcff]">
      {/* Android System Status Bar with Time, Battery, and Native Install CTA */}
      <AndroidSystemBar onOpenInstallModal={() => setIsInstallModalOpen(true)} />

      {/* SoundVault Top Header */}
      <Header onProfileClick={() => setShowProfileModal(true)} />

      {/* Main Content Area */}
      <main className="flex-1 pt-16 pb-20 w-full overflow-x-hidden">
        {activeTab === 'vault' && (
          <VaultView
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onSelectTrack={handleSelectTrack}
            onOpenContextMenu={(track) => {
              setContextMenuTrack(track);
              setIsContextMenuOpen(true);
            }}
            onShuffleAll={handleShuffleAll}
            onGoToImport={() => handleTabChange('import')}
          />
        )}

        {activeTab === 'import' && (
          <ImportView
            onAddTrackToVault={handleAddTrackToVault}
            recentTracks={tracks}
          />
        )}

        {activeTab === 'player' && currentTrack && (
          <PlayerView
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            eqPreset={eqPreset}
            onTogglePlay={() => audioEngine.togglePlay()}
            onPrevTrack={handlePrevTrack}
            onNextTrack={handleNextTrack}
            onSeek={(secs) => audioEngine.seek(secs)}
            onVolumeChange={(v) => audioEngine.setVolume(v)}
            onEQChange={(eq) => audioEngine.setEQ(eq)}
            onToggleFavorite={handleToggleFavorite}
            onOpenContextMenu={(track) => {
              setContextMenuTrack(track);
              setIsContextMenuOpen(true);
            }}
            onMinimize={() => handleTabChange(previousTab || 'vault')}
            onUpdateTrack={handleUpdateTrack}
          />
        )}

        {activeTab === 'bundles' && (
          <BundlesView
            bundles={bundles}
            vaultTracks={tracks}
            onSaveBundle={handleSaveBundle}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            tracks={tracks}
            onPurgeCache={handlePurgeCache}
          />
        )}
      </main>

      {/* Persistent Mini Player Bar (shown on all views except full player) */}
      {activeTab !== 'player' && (
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={() => audioEngine.togglePlay()}
          onNextTrack={handleNextTrack}
          onOpenPlayer={() => handleTabChange('player')}
        />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Track Context Menu Drawer */}
      <TrackContextMenu
        track={contextMenuTrack}
        isOpen={isContextMenuOpen}
        onClose={() => setIsContextMenuOpen(false)}
        onDelete={handleDeleteTrack}
        onUpdateTrack={handleUpdateTrack}
        onAddToBundle={(track) => {
          handleTabChange('bundles');
        }}
      />

      {/* Android Native Install Guide Modal */}
      <AndroidInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* User Profile & Offline Status Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 bg-[#0c0e16]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#282a32] p-5 shadow-2xl flex flex-col gap-4 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#d0bcff] text-[#3c0091] flex items-center justify-center font-bold text-base">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#e2e1ee]">Audiophile Sanctuary</span>
                  <span className="text-[10px] font-mono text-[#4edea3] uppercase font-semibold">
                    Offline Host • Bit-Exact
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full bg-[#33343e] flex items-center justify-center text-[#e2e1ee]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#958ea0]">HOST ID:</span>
                <span className="text-[#4cd7f6]">SV-NODE-7729</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#958ea0]">ENGINE MODE:</span>
                <span className="text-[#4edea3]">Direct Hardware ALSA/ASIO</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#958ea0]">OFFLINE VAULT:</span>
                <span className="text-[#d0bcff]">{tracks.length} Master Tracks</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#958ea0]">TELEMETRY:</span>
                <span className="text-[#4edea3]">0% Zero Tracking</span>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#d0bcff] text-[#3c0091] text-xs font-bold hover:bg-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
