import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { getApiUrl } from './services/apiClient';
import { KioskStep, KioskConfig, PhotoboothSession, CapturedPhoto, PhotoFilterId, TemplateLayoutId } from './types';
import { AttractScreen } from './components/AttractScreen';
import { HowItWorksModal } from './components/HowItWorksModal';
import { CaptureSession } from './components/CaptureSession';
import { PrintProcessing } from './components/PrintProcessing';
import { DigitalDeliveryScreen } from './components/DigitalDeliveryScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { GuestGalleryView } from './components/GuestGalleryView';
import { PhotoReview } from './components/PhotoReview';
import { ThemeSelectionScreen } from './components/ThemeSelectionScreen';
import { sound } from './services/soundService';
import { PhotoComposer } from './services/photoComposer';

import { INACAP_COPIAPO_CAREERS } from './data/inacapCopiapoCareers';

export default function App() {
  const [step, setStep] = useState<KioskStep>('attract');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Kiosk Configuration State
  const [config, setConfig] = useState<KioskConfig>({
    eventName: "Inacapifoto 🔴",
    eventDate: "2026",
    eventSubtitle: "¡Gracias por participar!",
    photoCount: 3,
    countdownSeconds: 3,
    autoResetSeconds: 45,
    primaryColor: "#E5A93C",
    accentColor: "#1E1E24",
    templateId: "classic-strip",
    paperTheme: "classic",
    themeCareerText: "",
    inacapCareers: INACAP_COPIAPO_CAREERS,
    themeEmojis: "⚽🏆🎉",
    logoUrl: "",
    paperRemaining: 36,
    paperCapacity: 36,
    cameraModel: "Webcam USB HD",
  });

  // Current Active Session
  const [activeSession, setActiveSession] = useState<PhotoboothSession | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [compositeUrl, setCompositeUrl] = useState<string>('');

  // Load config & handle URL hash for guest gallery link on smartphones
  useEffect(() => {
    // Check if opened with #gallery=<token>
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#gallery=')) {
        const token = hash.replace('#gallery=', '');
        setGuestToken(token);
      } else {
        setGuestToken(null);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);

    // Fetch initial config from backend
    fetch(getApiUrl('/api/config'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.eventName) {
          setConfig(data);
          setIsOffline(false);
        }
      })
      .catch(() => {
        // Continuar operando offline con la configuración local sin bloquear el kiosco
        setIsOffline(false);
      });

    // Health check interval
    const healthInterval = setInterval(() => {
      fetch(getApiUrl('/api/health'))
        .then(res => {
          if (res.ok) setIsOffline(false);
        })
        .catch(() => {
          // Continuar operando de forma autónoma
        });
    }, 15000);

    return () => {
      window.removeEventListener('hashchange', checkHash);
      clearInterval(healthInterval);
    };
  }, []);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
  };

  // Start new photobooth session from Attract Screen
  const handleStartSession = async () => {
    try {
      const res = await fetch(getApiUrl('/api/sessions/create'), { method: 'POST' });
      const data = await res.json();
      if (data.session) {
        setActiveSession({
          ...data.session,
          photos: [],
        });
      }
    } catch {
      // Fallback local session if server not reachable
      const fallbackSession: PhotoboothSession = {
        id: `ses_${Date.now()}`,
        token: `token_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: Date.now(),
        eventName: config.eventName,
        photos: [],
        compositeUrl: null,
        printStatus: 'none',
        templateId: config.templateId,
        currentState: 'IDLE',
      };
      setActiveSession(fallbackSession);
    }

    setStep('theme_selection');
  };

  const handleThemeSelected = (theme: any, career?: string, emojis?: string) => {
    setActiveSession(prev => prev ? {
      ...prev,
      paperTheme: theme,
      themeCareerText: career,
      themeEmojis: emojis,
    } : null);
    setStep('capturing');
  };

  // Camera Photos Captured -> Generate strip and advance to processing
  const handlePhotosCaptured = async (photos: CapturedPhoto[]) => {
    setCapturedPhotos(photos);
    setStep('processing'); 

    try {
      // Merge session overrides into a temporary config for rendering
      const renderConfig = activeSession ? {
        ...config,
        paperTheme: activeSession.paperTheme || config.paperTheme,
        themeCareerText: activeSession.themeCareerText || config.themeCareerText,
        themeEmojis: activeSession.themeEmojis || config.themeEmojis,
      } : config;

      const finalComposite = await PhotoComposer.compose(
        photos.map(p => p.dataUrl),
        renderConfig,
        'normal', 
        'classic-strip'
      );
      
      setCompositeUrl(finalComposite);
      
      setActiveSession(prev => prev ? {
        ...prev,
        photos,
        compositeUrl: finalComposite,
        printStatus: 'none',
      } : null);
      
      setStep('review');
    } catch (err) {
      console.error("Failed to auto-compose photos:", err);
      // Fallback in case of error
      setStep('attract');
    }
  };

  // Retake Photos -> Return to Capture loop
  const handleRetake = () => {
    setCapturedPhotos([]);
    setCompositeUrl('');
    setActiveSession(prev => prev ? { ...prev, photos: [], compositeUrl: null } : null);
    setStep('capturing');
  };

  // Review Confirmed -> Start Print process & save to session
  const handleReviewConfirmed = async (
    finalComposite: string,
    selectedFilter: PhotoFilterId,
    selectedTemplate: TemplateLayoutId
  ) => {
    setCompositeUrl(finalComposite);
    
    // Save to server
    if (activeSession) {
      fetch(getApiUrl(`/api/sessions/${activeSession.id}/photos`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: capturedPhotos.map((p) => p.dataUrl),
          compositeUrl: finalComposite,
          filterApplied: selectedFilter,
          templateId: selectedTemplate,
        }),
      }).catch(() => {});
    }

    setStep('printing');
  };

  // Print completed -> Advance to Digital Delivery QR Screen
  const handlePrintFinished = () => {
    // Update local paper count
    setConfig((prev) => ({
      ...prev,
      paperRemaining: Math.max(0, prev.paperRemaining - 1),
    }));
    setStep('digital_qr');
  };

  // Reset Kiosk to Attract Screen for next guest
  const handleResetKiosk = () => {
    setActiveSession(null);
    setCapturedPhotos([]);
    setCompositeUrl('');
    setStep('attract');
    // Clear hash if any
    if (window.location.hash.startsWith('#gallery=')) {
      window.location.hash = '';
    }
  };

  // Save updated config from Admin Panel
  const handleSaveConfig = async (updatedConfig: Partial<KioskConfig>) => {
    const merged = { ...config, ...updatedConfig };
    setConfig(merged);
    try {
      await fetch(getApiUrl('/api/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
    } catch {}
  };

  // If viewing via guest smartphone link
  if (guestToken) {
    return (
      <GuestGalleryView
        token={guestToken}
        fallbackSession={activeSession}
        onBackToKiosk={() => {
          window.location.hash = '';
          setGuestToken(null);
        }}
      />
    );
  }



  const isCapture = step === 'capturing';

  return (
    <div className={`relative w-full h-screen flex flex-col ${isCapture ? 'bg-transparent' : 'bg-[#18181B]'} text-[#FAF7F2] select-none overflow-hidden font-sans`}>
      
      {/* Admin Panel Button */}
      <button 
        className="absolute top-4 right-4 z-50 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white/50 hover:text-white backdrop-blur-sm transition-all"
        onClick={() => {
          sound.playTap();
          setShowAdmin(true);
        }}
        title="Admin Dashboard"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Main Kiosk Step Container */}
      <main className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
        
        {step === 'attract' && (
          <AttractScreen
            config={config}
            onStart={handleStartSession}
            onOpenHowItWorks={() => setShowHowItWorks(true)}
          />
        )}

        {step === 'theme_selection' && (
          <ThemeSelectionScreen
            config={config}
            onSelect={handleThemeSelected}
            onCancel={handleResetKiosk}
          />
        )}

        {step === 'capturing' && (
          <CaptureSession
            config={config}
            onSessionComplete={handlePhotosCaptured}
          />
        )}

        {step === 'review' && compositeUrl && (
          <PhotoReview
            compositeUrl={compositeUrl}
            onConfirm={() => setStep('printing')}
          />
        )}

        {step === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-white bg-black">
            <div className="w-16 h-16 border-4 border-[#E5A93C] border-t-transparent rounded-full animate-spin mb-8" />
            <h2 className="text-4xl font-vintage font-bold text-[#E5A93C] mb-4">Procesando...</h2>
            <p className="text-xl text-gray-400">Creando tu recuerdo fotográfico</p>
          </div>
        )}

        {step === 'printing' && activeSession && (
          <PrintProcessing
            config={config}
            session={activeSession}
            compositeUrl={compositeUrl}
            onPrintComplete={handlePrintFinished}
          />
        )}

        {step === 'digital_qr' && activeSession && (
          <DigitalDeliveryScreen
            config={config}
            session={activeSession}
            compositeUrl={compositeUrl}
            photos={capturedPhotos}
            onReset={handleResetKiosk}
            onOpenGalleryView={(token) => {
              window.location.hash = `#gallery=${token}`;
            }}
          />
        )}

      </main>

      {/* "How It Works" Guest Modal */}
      {showHowItWorks && (
        <HowItWorksModal onClose={() => setShowHowItWorks(false)} />
      )}

      {/* Protected Admin Console */}
      {showAdmin && (
        <AdminDashboard
          config={config}
          onSaveConfig={handleSaveConfig}
          onClose={() => {
            setShowAdmin(false);
          }}
        />
      )}

    </div>
  );
}
