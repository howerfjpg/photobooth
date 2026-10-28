import React, { useState } from 'react';
import { Palette, Check, ArrowRight, X } from 'lucide-react';
import { KioskConfig, PaperThemeId } from '../types';
import { sound } from '../services/soundService';

interface ThemeSelectionScreenProps {
  config: KioskConfig;
  onSelect: (theme: PaperThemeId, career?: string, emojis?: string) => void;
  onCancel: () => void;
}

const AVAILABLE_EMOJIS = ['⚽', '🏆', '🎉', '❤️', '⭐', '🎂', '🥂', '🎓', '💍', '🍕', '🎸', '🎮'];

export const ThemeSelectionScreen: React.FC<ThemeSelectionScreenProps> = ({ config, onSelect, onCancel }) => {
  const [selectedTheme, setSelectedTheme] = useState<PaperThemeId>('classic');
  const [selectedCareer, setSelectedCareer] = useState<string>('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);

  const themes: { id: PaperThemeId; name: string; desc: string; color: string }[] = [
    { id: 'classic', name: 'Clásico 👑', desc: 'Diseño elegante', color: '#FAF7F2' },
    { id: 'femenino', name: 'Rosado Soft 🌸', desc: 'Tonos pastel', color: '#FCE4EC' },
    { id: 'futbol', name: 'Fútbol ⚽', desc: 'Verde cancha', color: '#E8F5E9' },
    { id: 'inacap', name: 'INACAP 🔴', desc: 'Institucional', color: '#CC0000' },
    { id: 'emojis', name: 'Emojis ✨', desc: 'Festivo', color: '#FFFDE7' }
  ];

  const handleContinue = () => {
    sound.playTap();
    const emojisToPass = selectedTheme === 'emojis' 
      ? (selectedEmojis.length > 0 ? selectedEmojis.join('') : config.themeEmojis)
      : undefined;
    onSelect(selectedTheme, selectedCareer, emojisToPass);
  };

  const toggleEmoji = (emoji: string) => {
    sound.playTap();
    setSelectedEmojis(prev => {
      if (prev.includes(emoji)) return prev.filter(e => e !== emoji);
      if (prev.length >= 3) return prev;
      return [...prev, emoji];
    });
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col p-4 sm:p-8 bg-[#18181B] text-white animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
        <div>
          <h2 className="text-xl sm:text-3xl font-vintage font-bold text-[#FAF7F2] flex items-center gap-2 sm:gap-3">
            <Palette className="w-6 h-6 sm:w-8 sm:h-8 text-[#E5A93C]" />
            Elige el diseño
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Selecciona la temática para tu impresión final</p>
        </div>
        <button
          onClick={() => { sound.playTap(); onCancel(); }}
          className="p-2 sm:p-4 rounded-full bg-[#2A2A34] hover:bg-[#343440] transition-colors"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4 sm:space-y-6">
        
        {/* Theme Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {themes.map(theme => (
            <div
              key={theme.id}
              onClick={() => { sound.playTap(); setSelectedTheme(theme.id); }}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                selectedTheme === theme.id
                  ? 'border-[#E5A93C] bg-[#2A2A34] shadow-lg scale-[1.02]'
                  : 'border-white/10 bg-[#22222A] hover:bg-[#282832]'
              }`}
            >
              {selectedTheme === theme.id && (
                <div className="absolute top-2 right-2 bg-[#E5A93C] rounded-full p-1">
                  <Check className="w-3 h-3 text-black" />
                </div>
              )}
              
              <div 
                className="w-10 h-10 rounded-full mb-3 border border-white/20 shadow-inner"
                style={{ backgroundColor: theme.color }}
              />
              <h3 className="font-bold text-base mb-1">{theme.name}</h3>
              <p className="text-xs text-gray-400">{theme.desc}</p>
            </div>
          ))}
        </div>

        {/* INACAP Career Selection */}
        {selectedTheme === 'inacap' && config.inacapCareers && config.inacapCareers.length > 0 && (
          <div className="p-5 bg-[#22222A] rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-[#E5A93C] mb-3 text-sm uppercase tracking-wider">Selecciona tu Carrera</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {config.inacapCareers.map(c => (
                <button
                  key={c}
                  onClick={() => { sound.playTap(); setSelectedCareer(c); }}
                  className={`p-3 text-left rounded-xl transition-all text-sm ${
                    selectedCareer === c
                      ? 'bg-[#E5A93C] text-black font-bold'
                      : 'bg-[#18181B] text-white hover:bg-[#343440]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* EMOJIS Selection */}
        {selectedTheme === 'emojis' && (
          <div className="p-5 bg-[#22222A] rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[#E5A93C] text-sm uppercase tracking-wider">Arma tu fondo</h3>
              <span className="text-xs text-gray-400 font-mono">{selectedEmojis.length}/3 Emojis</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_EMOJIS.map(emoji => {
                const isSelected = selectedEmojis.includes(emoji);
                const isDisabled = !isSelected && selectedEmojis.length >= 3;
                return (
                  <button
                    key={emoji}
                    onClick={() => toggleEmoji(emoji)}
                    disabled={isDisabled}
                    className={`w-12 h-12 text-2xl flex items-center justify-center rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-[#E5A93C] scale-110 shadow-lg border-2 border-transparent' 
                        : 'bg-[#18181B] border border-white/10 hover:bg-[#2A2A34] disabled:opacity-30 disabled:hover:bg-[#18181B]'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Footer - Fixed */}
      <div className="mt-4 pt-4 border-t border-white/10 flex justify-end flex-shrink-0">
        <button
          onClick={handleContinue}
          disabled={
            (selectedTheme === 'inacap' && !selectedCareer) ||
            (selectedTheme === 'emojis' && selectedEmojis.length === 0)
          }
          className="py-3 sm:py-4 px-6 sm:px-8 rounded-full bg-[#E5A93C] hover:bg-[#F5B94E] disabled:opacity-50 disabled:hover:bg-[#E5A93C] text-black font-bold flex items-center justify-center gap-3 transition-colors shadow-[0_4px_0_0_#A8731E] active:shadow-none active:translate-y-1"
        >
          <span>Continuar</span>
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

    </div>
  );
};
