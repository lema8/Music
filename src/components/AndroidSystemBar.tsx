import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { isNativeApp } from '../utils/nativeBridge';
import { triggerHaptic } from '../utils/haptics';

interface AndroidSystemBarProps {
  onOpenInstallModal: () => void;
}

export const AndroidSystemBar: React.FC<AndroidSystemBarProps> = ({ onOpenInstallModal }) => {
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const native = isNativeApp();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const minsStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      setCurrentTimeStr(`${hours}:${minsStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (isInstallable) {
      const success = await install();
      if (!success) {
        onOpenInstallModal();
      }
    } else {
      onOpenInstallModal();
    }
  };

  // Inside the native Android app the install CTA is meaningless — show badge.
  const showBadge = native || isInstalled;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#11131b]/95 backdrop-blur-md border-b border-white/5 px-4 pt-1.5 pb-1 flex items-center justify-between text-xs text-[#cbc3d7] select-none">
      {/* Left: Android System Time */}
      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#e2e1ee]">
        <span>{currentTimeStr || '9:41'}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] shadow-[0_0_6px_rgba(78,222,163,0.8)]" />
      </div>

      {/* Center: In-App Android Native Badge / Install CTA */}
      <div className="flex items-center gap-1">
        {showBadge ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#282a32] text-[10px] font-mono text-[#4edea3] border border-[#4edea3]/20">
            <span className="material-symbols-outlined text-[13px]">android</span>
            <span className="font-semibold uppercase tracking-wider">
              {native ? 'Android App' : 'Android Standalone'}
            </span>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#a078ff]/30 to-[#4cd7f6]/20 text-[10px] font-mono text-[#d0bcff] hover:text-white border border-[#d0bcff]/30 active:scale-95 transition-transform"
            title="Install as native Android application"
          >
            <span className="material-symbols-outlined text-[13px]">install_mobile</span>
            <span className="font-semibold uppercase tracking-wider">Install App</span>
          </button>
        )}
      </div>

      {/* Right: Android Status Icons (5G, Wi-Fi, Battery) */}
      <div className="flex items-center gap-2 text-[#958ea0]">
        <div className="flex items-center gap-0.5" title="VoLTE 5G Bit-Perfect">
          <span className="text-[9px] font-mono font-bold text-[#4cd7f6]">5G</span>
          <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
        </div>
        <span className="material-symbols-outlined text-[14px] text-[#4edea3]">wifi</span>
        <div className="flex items-center gap-0.5">
          <span className="text-[9px] font-mono font-semibold text-[#e2e1ee]">98%</span>
          <span className="material-symbols-outlined text-[15px] text-[#4edea3]">battery_full</span>
        </div>
      </div>
    </header>
  );
};
