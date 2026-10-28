import React, { useState, useEffect } from 'react';
import { Printer, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { KioskConfig, PhotoboothSession } from '../types';
import { printerService } from '../services/printerService';
import { sound } from '../services/soundService';

interface PrintProcessingProps {
  config: KioskConfig;
  session: PhotoboothSession;
  compositeUrl: string;
  onPrintComplete: () => void;
}

export const PrintProcessing: React.FC<PrintProcessingProps> = ({
  config,
  session,
  compositeUrl,
  onPrintComplete,
}) => {
  const [printPassName, setPrintPassName] = useState("Preparando impresora...");
  const [progressPercent, setProgressPercent] = useState(10);
  const [isCompleted, setIsCompleted] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const executePrint = async () => {
      sound.playPrintMotor(6);

      try {
        const result = await printerService.print(
          compositeUrl,
          session.id,
          (passName, percent) => {
            if (isMounted) {
              setPrintPassName(passName);
              setProgressPercent(percent);
            }
          }
        );

        if (isMounted) {
          if (result.success) {
            setIsCompleted(true);
            sound.playSuccess();
            
            // Celebratory confetti
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#E5A93C', '#F59E0B', '#10B981', '#FAF7F2'],
              });
            } catch {}

            // Auto advance after 2.5 seconds
            setTimeout(() => {
              if (isMounted) {
                onPrintComplete();
              }
            }, 2500);
          } else {
            setPrintError(result.error || "No se pudo completar la impresión física.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setPrintError("Error al comunicarse con la impresora.");
        }
      }
    };

    executePrint();

    return () => {
      isMounted = false;
    };
  }, [compositeUrl, session.id]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 sm:p-10 bg-[#18181B] text-white select-none overflow-hidden">
      
      {/* Top Banner */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10">
        <span className="text-xs font-mono text-[#E5A93C] uppercase tracking-widest">
          Paso 3 de 4 • Impresión
        </span>
        <span className="text-xs text-gray-400 font-mono">
          Canon Selphy CP1500 (Térmica)
        </span>
      </div>

      {/* Center Animated Physical Booth & Ejection Slot Graphic */}
      <div className="w-full max-w-lg bg-[#222228] border-2 border-[#E5A93C] rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl space-y-6 my-auto z-10">
        
        {printError ? (
          // Error State with fallback to digital download
          <div className="py-6 flex flex-col items-center space-y-4 animate-in fade-in">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-4 border-amber-500 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold font-vintage text-[#FAF7F2]">
              No pudimos imprimir tu foto
            </h2>
            <p className="text-sm text-gray-300 max-w-sm">
              {printError}
            </p>
            <p className="text-xs text-[#E5A93C] font-semibold bg-[#E5A93C]/10 px-3 py-1.5 rounded-full border border-[#E5A93C]/30">
              ¡Tu foto está segura y puedes descargarla mediante QR digital!
            </p>
            <button
              id="print-fallback-continue-button"
              onClick={() => {
                sound.playTap();
                onPrintComplete();
              }}
              className="w-full py-4 rounded-xl bg-[#E5A93C] text-black font-bold font-vintage text-lg shadow-lg hover:bg-[#F5B94E] transition-all flex items-center justify-center gap-2"
            >
              <span>Continuar a Descarga Digital</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : isCompleted ? (
          // Print Completed State
          <div className="py-6 flex flex-col items-center space-y-4 animate-in zoom-in-95">
            <div className="w-24 h-24 rounded-full bg-[#10B981]/20 border-4 border-[#10B981] flex items-center justify-center text-[#10B981] animate-bounce">
              <CheckCircle2 className="w-14 h-14" />
            </div>
            <h2 className="text-4xl font-bold font-vintage text-[#FAF7F2]">
              ¡Impresión Lista!
            </h2>
            <p className="text-base text-gray-300">
              Retira tu tira fotográfica de la bandeja inferior de la máquina.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#E5A93C] font-mono">
              <Sparkles className="w-4 h-4" />
              <span>Generando código QR de descarga...</span>
            </div>
          </div>
        ) : (
          // Active Printing State with Physical Slot Simulation
          <>
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#E5A93C] uppercase tracking-widest font-mono">
                Imprimiendo Fotografía...
              </span>
              <h2 className="text-3xl font-bold font-vintage text-[#FAF7F2]">
                Procesando en Kiosco
              </h2>
            </div>

            {/* Visual Physical Machine Yellow Dispenser Simulation */}
            <div className="relative w-64 h-48 bg-[#E5A93C] rounded-2xl border-4 border-black shadow-xl flex flex-col items-center justify-between p-3 overflow-hidden">
              
              {/* Top Booth Vent slots */}
              <div className="flex gap-2">
                <div className="w-12 h-1.5 bg-black/40 rounded-full" />
                <div className="w-12 h-1.5 bg-black/40 rounded-full" />
                <div className="w-12 h-1.5 bg-black/40 rounded-full" />
              </div>

              {/* Center status message */}
              <div className="bg-black/80 px-3 py-1 rounded text-[11px] font-mono text-white flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E5A93C]" />
                <span className="truncate max-w-[170px]">{printPassName}</span>
              </div>

              {/* Lower Output Slot (Matching the yellow tray in reference photo) */}
              <div className="w-full relative flex flex-col items-center">
                <div className="w-44 h-3 bg-black rounded-md shadow-inner relative z-10" />
                
                {/* Emerging photo strip animation */}
                <div
                  className="w-32 bg-white rounded-b-md shadow-2xl transition-all duration-700 overflow-hidden border border-black/20"
                  style={{
                    height: `${Math.max(10, progressPercent * 0.9)}px`,
                  }}
                >
                  <img
                    src={compositeUrl}
                    alt="Foto emergiendo"
                    className="w-full object-cover opacity-90"
                  />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>{printPassName}</span>
                <span className="text-[#E5A93C] font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-[#18181B] rounded-full overflow-hidden border border-white/10 p-0.5">
                <div
                  className="h-full bg-[#E5A93C] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="text-center text-xs text-gray-500 font-mono z-10">
        Disfruta tu recuerdo de {config.eventName}
      </div>
    </div>
  );
};
