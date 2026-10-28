import React, { useState } from 'react';
import { Camera, Printer, Wifi, Volume2, VolumeX, Maximize2, Minimize2, ShieldAlert } from 'lucide-react';
import { KioskConfig } from '../types';
import { sound } from '../services/soundService';

interface KioskHeaderProps {
  config: KioskConfig;
  onOpenAdmin: () => void;
  isKioskFullscreen: boolean;
  onToggleFullscreen: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const KioskHeader: React.FC<KioskHeaderProps> = ({
  config,
  onOpenAdmin,
  isKioskFullscreen,
  onToggleFullscreen,
  soundEnabled,
  onToggleSound,
}) => {
  const [adminTapCount, setAdminTapCount] = useState(0);

  const handleTitleTap = () => {
    sound.playTap();
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    if (newCount >= 3) {
      setAdminTapCount(0);
      onOpenAdmin();
    }
  };

  return (
    <header className="w-full bg-[#18181B] border-b border-[#2E2E34] px-4 py-2 flex items-center justify-between text-xs z-30 select-none">
      {/* Event Badge / Admin Tap Trigger */}
      <div 
        id="kiosk-brand-trigger"
        onClick={handleTitleTap}
        className="flex items-center gap-2 cursor-pointer group active:scale-95 transition-transform"
        title="Toca 3 veces para abrir el panel de administración"
      >
        <div className="w-7 h-7 rounded-lg bg-[#E5A93C] text-black font-bold flex items-center justify-center font-vintage text-sm shadow-md">
          PB
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[#FAF7F2] tracking-wider uppercase text-[11px] group-hover:text-[#E5A93C] transition-colors">
            {config.eventName || "Photobooth Kiosk"}
          </span>
          <span className="text-[10px] text-[#9CA3AF] flex items-center gap-1 font-mono">
            {config.eventDate || "Evento Activo"}
          </span>
        </div>
      </div>

      {/* Hardware Status Indicators */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Camera indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#242429] text-[#FAF7F2]/80 border border-white/5">
          <Camera className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="hidden md:inline text-[10px] text-gray-300">
            {config.mockCamera ? 'Cámara Mock' : 'Cámara HD'}
          </span>
        </div>

        {/* Printer & Paper indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#242429] text-[#FAF7F2]/80 border border-white/5">
          <Printer className={`w-3.5 h-3.5 ${config.paperRemaining > 5 ? 'text-[#10B981]' : config.paperRemaining > 0 ? 'text-[#E5A93C]' : 'text-red-400'}`} />
          <span className="text-[10px] text-gray-300">
            {config.paperRemaining} fotos
          </span>
        </div>

        {/* Network indicator */}
        <div className="flex items-center gap-1 px-1.5 py-1 rounded bg-[#242429] text-[#10B981]">
          <Wifi className="w-3.5 h-3.5" />
        </div>

        {/* Sound toggle */}
        <button
          id="kiosk-sound-toggle"
          onClick={() => {
            sound.playTap();
            onToggleSound();
          }}
          className="p-1.5 rounded-lg bg-[#242429] hover:bg-[#323238] text-gray-300 hover:text-white transition-colors"
          title={soundEnabled ? "Silenciar audio" : "Activar audio"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-[#E5A93C]" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
        </button>

        {/* Fullscreen toggle */}
        <button
          id="kiosk-fullscreen-toggle"
          onClick={() => {
            sound.playTap();
            onToggleFullscreen();
          }}
          className="p-1.5 rounded-lg bg-[#242429] hover:bg-[#323238] text-gray-300 hover:text-white transition-colors"
          title="Pantalla completa (Modo Kiosco)"
        >
          {isKioskFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Explicit Admin Button */}
        <button
          id="kiosk-admin-button"
          onClick={() => {
            sound.playTap();
            onOpenAdmin();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#242429] hover:bg-[#E5A93C] hover:text-black text-gray-300 font-semibold text-[11px] transition-colors border border-white/10"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Admin</span>
        </button>
      </div>
    </header>
  );
};
