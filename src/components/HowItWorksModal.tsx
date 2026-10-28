import React from 'react';
import { X, QrCode, Camera, Printer, Smartphone } from 'lucide-react';
import { sound } from '../services/soundService';

interface HowItWorksModalProps {
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ onClose }) => {
  const steps = [
    {
      num: "1",
      icon: QrCode,
      title: "Paga con tu App",
      desc: "Escanea el código QR en pantalla con tu aplicación bancaria o billetera digital favorita.",
    },
    {
      num: "2",
      icon: Camera,
      title: "Posa para 3 Fotos",
      desc: "Sigue la cuenta regresiva en pantalla (3.. 2.. 1.. Flash!) y haz tus mejores poses con amigos.",
    },
    {
      num: "3",
      icon: Printer,
      title: "Impresión Inmediata",
      desc: "Tu tira de fotos se imprimirá automáticamente en papel fotográfico de alta calidad en segundos.",
    },
    {
      num: "4",
      icon: Smartphone,
      title: "Descarga Digital",
      desc: "Escanea el código QR final con tu teléfono para guardar las fotos originales en tu galería.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#1E1E24] border-2 border-[#E5A93C] rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col space-y-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold text-[#E5A93C] uppercase tracking-widest font-mono">
              Instrucciones
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-vintage text-[#FAF7F2]">
              ¿Cómo funciona el Photobooth?
            </h2>
          </div>

          <button
            id="close-how-it-works"
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-2.5 rounded-full bg-[#2E2E36] hover:bg-[#E5A93C] hover:text-black transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="p-4 rounded-2xl bg-[#282830] border border-white/5 flex gap-3.5 items-start">
                <div className="w-10 h-10 rounded-xl bg-[#E5A93C] text-black font-bold flex items-center justify-center font-vintage text-lg shrink-0">
                  {step.num}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[#E5A93C] font-semibold text-sm">
                    <Icon className="w-4 h-4" />
                    <span>{step.title}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          id="understood-how-it-works"
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          className="w-full py-4 rounded-2xl bg-[#E5A93C] hover:bg-[#F5B94E] active:scale-98 text-black font-bold font-vintage text-lg shadow-lg transition-all"
        >
          ¡Entendido, vamos a comenzar!
        </button>
      </div>
    </div>
  );
};
