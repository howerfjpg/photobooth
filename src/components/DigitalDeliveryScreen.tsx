import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, Sparkles, Smartphone, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';
import { CapturedPhoto, KioskConfig, PhotoboothSession } from '../types';
import { sound } from '../services/soundService';

interface DigitalDeliveryScreenProps {
  config: KioskConfig;
  session: PhotoboothSession;
  compositeUrl: string;
  photos: CapturedPhoto[];
  onReset: () => void;
  onOpenGalleryView: (token: string) => void;
}

export const DigitalDeliveryScreen: React.FC<DigitalDeliveryScreenProps> = ({
  config,
  session,
  compositeUrl,
  photos,
  onReset,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(config.autoResetSeconds || 45);
  const [publicUrl, setPublicUrl] = useState<string>('');

  const enableQr = config.enableDigitalQr !== false;

  useEffect(() => {
    let isMounted = true;

    const configuredUrl = config.publicServerUrl?.trim() || '';
    const isValidPublicUrl = configuredUrl &&
      !configuredUrl.includes('localhost') &&
      !configuredUrl.includes('127.0.0.1');

    if (isValidPublicUrl) {
      setPublicUrl(configuredUrl.replace(/\/+$/, ''));
    }

    if (isMounted && !isValidPublicUrl) {
      console.warn('[QR] No hay publicServerUrl configurado. El QR no funcionará desde fuera de la red local.');
    }

    if (!isValidPublicUrl) {
      return;
    }

    const qrTarget = `${publicUrl}/#gallery=${session.token}`;

    QRCode.toDataURL(qrTarget, {
      width: 400,
      margin: 2,
      color: {
        dark: '#18181B',
        light: '#FFFFFF',
      },
    }).then((url) => {
      if (isMounted) setQrDataUrl(url);
    });

    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [session.token, config.publicServerUrl]);

  useEffect(() => {
    if (secondsRemaining === 0) {
      onReset();
    }
  }, [secondsRemaining, onReset]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-8 bg-[#18181B] text-white select-none overflow-y-auto">
      
      <div className="w-full max-w-5xl flex items-center justify-between z-10 pb-2 border-b border-white/10">
        <div>
          <span className="text-xs font-mono text-[#E5A93C] uppercase tracking-widest block">
            Paso 4 de 4 • Entrega Digital
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-vintage text-[#FAF7F2]">
            ¡Tus fotos están listas!
          </h2>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#242429] border border-white/10 text-xs font-mono">
          <span className="text-gray-400">Reinicio en:</span>
          <span className="font-bold text-[#E5A93C]">{secondsRemaining}s</span>
        </div>
      </div>

      {(!publicUrl || !enableQr) && (
        <div className="w-full max-w-5xl bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3 text-sm text-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            {publicUrl
              ? 'El QR apunta a una URL local. Configura PUBLIC_URL para acceso desde internet.'
              : 'Falta configurar la URL pública del servidor. Ve al Panel Admin y define "IP de Red o Dominio Público para QR".'}
          </span>
        </div>
      )}

      <div className="w-full max-w-5xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-6">
        
        <div className={`flex flex-col items-center justify-center space-y-3 ${enableQr && publicUrl ? 'lg:col-span-6' : 'lg:col-span-12 max-w-md mx-auto'}`}>
          <div className="p-4 bg-[#242429] rounded-2xl border-2 border-[#E5A93C]/40 shadow-2xl flex flex-col items-center space-y-3 w-full">
            <div className="flex items-center justify-between w-full text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1.5 text-[#E5A93C] font-semibold">
                <Sparkles className="w-4 h-4" />
                Tira Photobooth Impresa
              </span>
              <span>300 DPI</span>
            </div>

            <div className="max-h-[50vh] flex items-center justify-center bg-black/40 p-3 rounded-xl w-full">
              <img
                src={compositeUrl}
                alt="Recuerdo Final"
                className="max-h-[44vh] object-contain rounded shadow-xl"
              />
            </div>
          </div>
        </div>

        {enableQr && publicUrl && (
          <div className="lg:col-span-6 bg-[#222228] border-2 border-[#E5A93C] rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl space-y-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5A93C]/15 text-[#E5A93C] text-xs font-semibold">
                <Smartphone className="w-4 h-4" />
                <span>Escanea con tu Celular</span>
              </div>
              <h3 className="text-2xl font-bold font-vintage text-[#FAF7F2]">
                Descarga Digital en tu Teléfono
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Apunta la cámara de tu smartphone al código QR para obtener tu copia digital y fotos originales.
              </p>
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-[#E5A93C]">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR de Descarga Digital"
                  className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Generando QR...</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-gray-500 font-mono">
              Enlace digital de descarga
            </p>
          </div>
        )}

      </div>

      <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/10 z-10">
        <div className="flex max-w-xl items-start gap-3 text-sm leading-relaxed text-gray-300 sm:text-base">
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#10B981]" />
          <span>Gracias por usar el servicio. Si lo desea, puede dejar una donación voluntaria en la caja.</span>
        </div>

        <button
          id="finish-session-now-button"
          onClick={() => {
            sound.playTap();
            onReset();
          }}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E5A93C] hover:bg-[#F5B94E] active:scale-98 text-black font-extrabold text-lg font-vintage shadow-[0_4px_0_0_#A8731E] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 border border-black/20"
        >
          <RotateCcw className="w-5 h-5" />
          <span>FINALIZAR Y SIGUIENTE CLIENTE</span>
        </button>
      </div>

    </div>
  );
};
