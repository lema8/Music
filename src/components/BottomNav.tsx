import React from 'react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'vault', label: 'Vault', icon: 'folder_special' },
    { id: 'import', label: '+ Import', icon: 'add_circle' },
    { id: 'player', label: 'Player', icon: 'play_circle' },
    { id: 'bundles', label: 'Bundles', icon: 'share' },
    { id: 'settings', label: 'Settings', icon: 'tune' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-[#11131b]/90 backdrop-blur-xl border-t border-white/5">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-all relative ${
                isActive ? 'text-[#d0bcff]' : 'text-[#cbc3d7]/60 hover:text-[#e2e1ee]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[23px] transition-transform ${
                  isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(208,188,255,0.5)]' : ''
                }`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-[11px] font-mono tracking-wide ${
                  isActive ? 'font-bold text-[#d0bcff]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-5 h-1 rounded-full bg-[#d0bcff] shadow-[0_0_6px_rgba(208,188,255,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
