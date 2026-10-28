import React from 'react';
import { Sparkles, HelpCircle, ArrowRight, Camera, Printer } from 'lucide-react';
import { KioskConfig } from '../types';
import { sound } from '../services/soundService';

interface AttractScreenProps {
  config: KioskConfig;
  onStart: () => void;
  onOpenHowItWorks: () => void;
}

export const AttractScreen: React.FC<AttractScreenProps> = ({
  config,
  onStart,
  onOpenHowItWorks,
}) => {
  const handleStart = () => {
    sound.playTap();
    onStart();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-3 sm:p-6 lg:p-8 overflow-y-auto bg-[#18181B]">
      {/* Background Subtle Wood & Vintage Texture */}
      <div className="absolute inset-0 opacity-15 pointer-events-none vintage-grain" />

      {/* Decorative Radial Warm Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#E5A93C]/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Retro LED Lamp Simulation */}
      <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 py-1 sm:py-2 px-4 sm:px-6 rounded-full bg-[#242429] border border-[#3E3E48] shadow-lg mb-2">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 booth-led-glow animate-pulse" />
        <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-[#E5A93C] uppercase">
          Kiosco Activo • Listo para Disparar
        </span>
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 booth-led-glow animate-pulse" />
      </div>

      {/* Main Hero Card */}
      <div className="relative z-10 w-full max-w-4xl flex-1 flex flex-row items-center justify-between gap-4 sm:gap-8 my-auto py-2">
        
        {/* Left Column: Big Welcoming Sign */}
        <div className="flex-1 text-left flex flex-col items-start justify-center space-y-2 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#E5A93C]/10 border border-[#E5A93C]/30 text-[#E5A93C] text-xs sm:text-sm font-semibold">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{config.eventName || "Photobooth Vintage"}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-[#FAF7F2] font-vintage leading-none">
            ¡Sonríe!
          </h1>

          <p className="text-sm sm:text-xl lg:text-2xl text-[#D1D5DB] font-sans font-light max-w-lg">
            Llévate una imagen espectacular a tu bolsillo.
          </p>

          {/* Value Proposition Pills */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-md pt-1 sm:pt-2">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-[#242429] border border-white/5">
              <div className="p-1.5 sm:p-2 rounded-lg bg-[#E5A93C]/20 text-[#E5A93C]">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Captura</p>
                <p className="text-xs sm:text-sm font-bold text-white">{config.photoCount} Fotografías</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-[#242429] border border-white/5">
              <div className="p-1.5 sm:p-2 rounded-lg bg-[#E5A93C]/20 text-[#E5A93C]">
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Entrega</p>
                <p className="text-xs sm:text-sm font-bold text-white">Impresión + QR</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Photo Strip Preview */}
        <div className="flex flex-col items-center justify-center relative shrink-0">
          
          {/* Animated Retro Photo Strip Preview */}
          <div className="w-32 sm:w-48 lg:w-56 bg-[#FAF7F2] text-black p-2 sm:p-3.5 rounded-lg shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-300 border-2 sm:border-4 border-black/80 flex flex-col items-center gap-1 sm:gap-2">
            <div className="text-center font-vintage font-bold text-[10px] sm:text-sm tracking-wider border-b border-black/20 pb-0.5 w-full text-black">
              ★ PHOTOBOOTH ★
            </div>
            
            <div className="w-full aspect-[4/3] bg-amber-900/30 rounded border border-black/20 overflow-hidden flex items-center justify-center text-lg sm:text-2xl shadow-inner">
              🥳 ✨
            </div>
            <div className="w-full aspect-[4/3] bg-amber-900/40 rounded border border-black/20 overflow-hidden flex items-center justify-center text-lg sm:text-2xl shadow-inner">
              💃 🕺
            </div>
            <div className="w-full aspect-[4/3] bg-amber-900/50 rounded border border-black/20 overflow-hidden flex items-center justify-center text-lg sm:text-2xl shadow-inner">
              📸 ✌️
            </div>

            <div className="text-center w-full pt-0.5">
              <p className="font-vintage font-bold text-[10px] sm:text-xs text-black leading-tight">
                {config.eventName}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Action Section */}
      <div className="relative z-10 w-full max-w-xl flex flex-row items-center justify-center gap-3 pt-2">
        <button
          id="kiosk-start-button"
          onClick={handleStart}
          className="flex-1 py-3 sm:py-4 lg:py-5 px-6 sm:px-8 rounded-2xl bg-[#E5A93C] hover:bg-[#F5B94E] active:scale-95 text-black font-extrabold text-lg sm:text-2xl lg:text-3xl font-vintage shadow-[0_4px_0_0_#A8731E] sm:shadow-[0_8px_0_0_#A8731E] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-2 sm:gap-3 border-2 border-black group"
        >
          <span>COMENZAR</span>
          <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          id="kiosk-how-it-works-button"
          onClick={() => {
            sound.playTap();
            onOpenHowItWorks();
          }}
          className="py-3 sm:py-4 px-4 sm:px-6 rounded-2xl bg-[#242429] hover:bg-[#323238] active:scale-95 text-[#D1D5DB] hover:text-white font-medium text-xs sm:text-sm border border-white/10 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#E5A93C]" />
          <span className="hidden sm:inline">¿Cómo funciona?</span>
        </button>
      </div>

      {/* Footer Subtext */}
      <p className="relative z-10 text-[10px] sm:text-xs text-gray-500 font-mono mt-1 text-center">
        {config.eventSubtitle || "Disfruta el evento y llévate tu foto impresa al instante"}
      </p>
    </div>
  );
};
