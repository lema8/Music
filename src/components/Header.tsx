import React from 'react';
import { Radio } from 'lucide-react';

interface HeaderProps {
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onProfileClick }) => {
  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-[#11131b]/80 backdrop-blur-xl border-b border-white/5">
      <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          {/* SoundVault Futuristic Emblem Icon */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#a078ff] to-[#4cd7f6] p-[1.5px] shadow-[0_0_12px_rgba(208,188,255,0.3)]">
            <div className="w-full h-full bg-[#11131b] rounded-[6.5px] flex items-center justify-center">
              <Radio className="w-4 h-4 text-[#d0bcff]" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight text-[#e2e1ee] font-sans">
            SoundVault
          </span>
        </div>

        {/* Offline Ready Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#282a32] border border-[#4edea3]/20 shadow-[0_0_10px_rgba(78,222,163,0.15)]">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.8)] animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#4edea3] font-mono">
            Offline Ready
          </span>
        </div>

        {/* Profile / Status Button */}
        <button
          onClick={onProfileClick}
          aria-label="User profile"
          className="w-8 h-8 rounded-full bg-[#d0bcff] text-[#3c0091] flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-transform font-bold text-xs shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
        </button>
      </div>
    </header>
  );
};
