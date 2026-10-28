import React from 'react';
import { Printer } from 'lucide-react';
import { sound } from '../services/soundService';

interface PhotoReviewProps {
  compositeUrl: string;
  onConfirm: () => void;
}

export const PhotoReview: React.FC<PhotoReviewProps> = ({ compositeUrl, onConfirm }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-6 sm:p-8 bg-[#18181B] text-white animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center space-y-1">
        <span className="text-xs font-mono text-[#E5A93C] uppercase tracking-widest block">
          Paso 3 de 4 • Vista Previa
        </span>
        <h2 className="text-3xl font-vintage font-bold text-[#FAF7F2]">
          Revisa tu Recuerdo Fotográfico
        </h2>
      </div>
      
      <div className="flex-1 min-h-0 relative flex justify-center items-center my-4 w-full max-w-2xl">
        <img 
          src={compositeUrl} 
          alt="Vista Previa de la Tira"
          className="h-full max-h-[60vh] w-auto object-contain shadow-2xl rounded-sm border-2 border-[#E5A93C]/40"
        />
      </div>

      <div className="w-full max-w-md pt-2">
        <button
          onClick={() => { sound.playTap(); onConfirm(); }}
          className="w-full py-4 rounded-2xl bg-[#E5A93C] hover:bg-[#F5B94E] active:scale-98 text-black font-extrabold text-xl font-vintage shadow-[0_5px_0_0_#A8731E] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3 border border-black/20"
        >
          <Printer className="w-6 h-6" />
          <span>IMPRIMIR MI TIRA FOTOGRÁFICA</span>
        </button>
      </div>
    </div>
  );
};
