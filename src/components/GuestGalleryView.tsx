import React, { useState, useEffect } from 'react';
import { Download, Share2, Sparkles, ArrowLeft, Check, Image as ImageIcon, Heart } from 'lucide-react';
import { getApiUrl } from '../services/apiClient';
import { sound } from '../services/soundService';

import { PhotoboothSession } from '../types';

interface GuestGalleryViewProps {
  token: string;
  fallbackSession?: PhotoboothSession | null;
  onBackToKiosk: () => void;
}

interface GalleryData {
  eventName: string;
  date: string;
  photos: string[];
  compositeUrl: string | null;
  expiresInMinutes: number;
}

export const GuestGalleryView: React.FC<GuestGalleryViewProps> = ({ token, fallbackSession, onBackToKiosk }) => {
  const [data, setData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Check if fallback session data is available
    if (fallbackSession && (fallbackSession.token === token || fallbackSession.id === token || token.startsWith('guest_') || token.startsWith('token_'))) {
      if (fallbackSession.compositeUrl || (fallbackSession.photos && fallbackSession.photos.length > 0)) {
        setData({
          eventName: fallbackSession.eventName || 'Photobooth',
          date: new Date(fallbackSession.createdAt || Date.now()).toLocaleDateString(),
          photos: fallbackSession.photos ? fallbackSession.photos.map(p => typeof p === 'string' ? p : p.dataUrl) : [],
          compositeUrl: fallbackSession.compositeUrl,
          expiresInMinutes: 60,
        });
        setLoading(false);
        return;
      }
    }

    const fetchGallery = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/download/${token}`));
        if (!res.ok) {
          throw new Error("No pudimos encontrar tus fotos o el enlace ha expirado.");
        }
        const json = await res.json();
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (fallbackSession && (fallbackSession.compositeUrl || fallbackSession.photos?.length)) {
            setData({
              eventName: fallbackSession.eventName || 'Photobooth',
              date: new Date(fallbackSession.createdAt || Date.now()).toLocaleDateString(),
              photos: fallbackSession.photos ? fallbackSession.photos.map(p => typeof p === 'string' ? p : p.dataUrl) : [],
              compositeUrl: fallbackSession.compositeUrl,
              expiresInMinutes: 60,
            });
            setLoading(false);
          } else {
            setError(err instanceof Error ? err.message : "Error al cargar la galería");
            setLoading(false);
          }
        }
      }
    };

    fetchGallery();
    return () => {
      isMounted = false;
    };
  }, [token, fallbackSession]);

  const handleShare = async () => {
    sound.playTap();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mis fotos de ${data?.eventName || 'Photobooth'}`,
          text: `¡Mira mis fotos en el Photobooth de ${data?.eventName}!`,
          url: window.location.href,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    sound.playTap();
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-[#18181B] text-white flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-10 h-10 border-4 border-[#E5A93C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-300">Cargando tus fotos del evento...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-full bg-[#18181B] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-vintage">Enlace no disponible</h2>
        <p className="text-sm text-gray-400 max-w-sm">{error || "El enlace ha caducado"}</p>
        <button
          onClick={onBackToKiosk}
          className="px-6 py-3 rounded-xl bg-[#E5A93C] text-black font-bold text-sm"
        >
          Volver al Kiosco
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-[#18181B] text-white flex flex-col items-center py-6 px-4 overflow-y-auto">
      
      {/* Mobile Top Header */}
      <div className="w-full max-w-md flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <button
          onClick={onBackToKiosk}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold font-vintage text-[#FAF7F2] leading-tight">
            {data.eventName}
          </h1>
          <p className="text-[10px] text-[#E5A93C] font-mono">{data.date}</p>
        </div>

        <button
          onClick={handleShare}
          className="p-2 rounded-xl bg-[#282830] text-[#E5A93C] hover:bg-[#383842]"
          title="Compartir"
        >
          {shared ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Composite Strip Card */}
      {data.compositeUrl && (
        <div className="w-full max-w-md bg-[#242429] border-2 border-[#E5A93C] rounded-3xl p-4 flex flex-col items-center shadow-2xl space-y-4 mb-6">
          <div className="flex items-center justify-between w-full px-2">
            <span className="text-xs font-bold text-[#E5A93C] font-vintage flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Tira Photobooth Oficial
            </span>
            <span className="text-[10px] text-gray-400 font-mono">300 DPI</span>
          </div>

          <img
            src={data.compositeUrl}
            alt="Tira Photobooth"
            className="w-full rounded-xl shadow-lg object-contain max-h-[60vh]"
          />

          <button
            onClick={() => handleDownload(data.compositeUrl!, `photobooth-${data.eventName.toLowerCase()}-strip.jpg`)}
            className="w-full py-3.5 rounded-2xl bg-[#E5A93C] text-black font-extrabold font-vintage text-base shadow-lg flex items-center justify-center gap-2 hover:bg-[#F5B94E]"
          >
            <Download className="w-5 h-5" />
            <span>Guardar Tira en mi Teléfono</span>
          </button>
        </div>
      )}

      {/* Individual Photos Section */}
      {data.photos && data.photos.length > 0 && (
        <div className="w-full max-w-md space-y-4">
          <h2 className="text-sm font-bold text-gray-300 font-vintage uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#E5A93C]" />
            <span>Fotografías Individuales ({data.photos.length})</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.photos.map((photoUrl, idx) => (
              <div
                key={idx}
                className="bg-[#242429] rounded-2xl p-3 border border-white/10 flex flex-col space-y-2"
              >
                <img
                  src={photoUrl}
                  alt={`Foto ${idx + 1}`}
                  className="w-full aspect-[4/3] object-cover rounded-xl shadow"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-gray-300">Foto #{idx + 1}</span>
                  <button
                    onClick={() => handleDownload(photoUrl, `foto-${idx + 1}-${data.eventName.toLowerCase()}.jpg`)}
                    className="p-1.5 rounded-lg bg-[#32323C] text-[#E5A93C] hover:bg-[#E5A93C] hover:text-black transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 font-mono mt-8 pb-4 flex items-center justify-center gap-1">
        <span>¡Gracias por celebrar en {data.eventName}!</span>
        <Heart className="w-3.5 h-3.5 text-[#E5A93C]" />
      </div>
    </div>
  );
};
