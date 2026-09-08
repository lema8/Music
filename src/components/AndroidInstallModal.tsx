import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHaptic } from '../utils/haptics';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (!isOpen) return null;

  const handlePromptInstall = async () => {
    triggerHaptic('medium');
    const res = await install();
    if (res) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0c0e16]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#282a32] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Android Robot Icon */}
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#381e72] to-[#a078ff] flex items-center justify-center text-[#d0bcff] shadow-md border border-white/10">
              <span className="material-symbols-outlined text-[28px]">android</span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-[#e2e1ee]">Install Android Application</h3>
              <span className="text-[11px] font-mono text-[#4edea3] uppercase font-semibold">
                Standalone APK / WebAPK
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-[#33343e] flex items-center justify-center text-[#cbc3d7] hover:text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Benefits list */}
        <div className="flex flex-col gap-2 bg-[#191b24] p-3.5 rounded-2xl border border-white/5">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#4edea3] text-[18px] mt-0.5 shrink-0">
              check_circle
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#e2e1ee]">Full Screen Native Experience</span>
              <span className="text-[11px] text-[#cbc3d7]/70">
                Removes all browser URL bars, tabs, and web UI. Opens directly from your home screen and app drawer.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[18px] mt-0.5 shrink-0">
              notifications_active
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#e2e1ee]">Android Lockscreen & Status Player</span>
              <span className="text-[11px] text-[#cbc3d7]/70">
                Control music, scrub, skip tracks, and view custom album art directly on your Android lock screen and pull-down shade.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#d0bcff] text-[18px] mt-0.5 shrink-0">
              airplane_ticket
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#e2e1ee]">100% Offline with Zero Data Usage</span>
              <span className="text-[11px] text-[#cbc3d7]/70">
                Works on Airplane mode, subways, and remote areas without cellular connection.
              </span>
            </div>
          </div>
        </div>

        {/* Android Version Instructions */}
        <div className="flex flex-col gap-2 bg-[#191b24] p-3 rounded-2xl border border-white/5 text-xs text-[#cbc3d7]">
          <span className="text-[10px] font-mono uppercase text-[#4cd7f6] font-bold tracking-wider">
            Compatibility: Android 10 (Huawei/EMUI) up to Modern Android 14/15/16/17
          </span>
          <div className="flex flex-col gap-1.5 pt-0.5 text-[11px] leading-relaxed">
            <p>
              <strong>Method 1 (One-Tap):</strong> Tap the <strong>"Install SoundVault Now"</strong> button below if your browser displays the prompt.
            </p>
            <p>
              <strong>Method 2 (Browser Menu):</strong> In Chrome, Samsung Internet, or Huawei Browser:
              <br />
              1. Tap the <strong>three dots (⋮)</strong> menu icon at the top or bottom right.
              <br />
              2. Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
              <br />
              3. Tap <strong>Install</strong>. Android will package SoundVault as a standalone native app icon!
            </p>
          </div>
        </div>

        {/* Action Button */}
        {isInstallable ? (
          <button
            onClick={handlePromptInstall}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] text-[#280d5f] font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">download_for_offline</span>
            <span>Install SoundVault Now</span>
          </button>
        ) : isInstalled ? (
          <div className="text-center py-2 text-xs font-mono text-[#4edea3] flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>SoundVault is already running in Standalone Mode!</span>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-[#33343e] text-[#e2e1ee] font-semibold text-xs hover:bg-[#373942]"
          >
            Got It, I'll Add via Browser Menu
          </button>
        )}
      </div>
    </div>
  );
};
