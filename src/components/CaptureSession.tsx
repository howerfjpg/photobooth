import React, { useState, useEffect, useRef } from 'react';
import { Camera, FlipHorizontal, ArrowRight } from 'lucide-react';
import { CapturedPhoto, KioskConfig } from '../types';
import { cameraService } from '../services/cameraService';
import { sound } from '../services/soundService';

interface CaptureSessionProps {
  config: KioskConfig;
  onSessionComplete: (capturedPhotos: CapturedPhoto[]) => void;
}

export const CaptureSession: React.FC<CaptureSessionProps> = ({
  config,
  onSessionComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isMirror, setIsMirror] = useState(true);
  const [statusMessage, setStatusMessage] = useState("¡Prepárate!");
  const [cameraReady, setCameraReady] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);

  // Initialize camera
  useEffect(() => {
    let isMounted = true;

    const startCam = async () => {
      if (!videoRef.current) return;
      const started = await cameraService.start(videoRef.current, config.selectedCameraDeviceId);
      if (isMounted) {
        setCameraReady(started);
        // Start automatic sequence after 1.5s for the first photo
        setTimeout(() => {
          if (isMounted) {
            triggerPhotoCaptureSequence(1);
          }
        }, 1500);
      }
    };

    startCam();

    return () => {
      isMounted = false;
      cameraService.stop();
    };
  }, [config.mockCamera]);

  // Main capture loop for each photo
  const triggerPhotoCaptureSequence = (photoNum: number) => {
    setWaitingForNext(false);
    setCurrentPhotoIndex(photoNum);
    setStatusMessage(`Prepárate para la Foto ${photoNum} de ${config.photoCount}...`);
    setCountdown(config.countdownSeconds || 3);

    let count = config.countdownSeconds || 3;
    sound.playCountdownTick(false);

    const interval = window.setInterval(async () => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sound.playCountdownTick(false);
      } else {
        clearInterval(interval);
        setCountdown(null);
        sound.playCountdownTick(true); // High final tick

        // Trigger flash & capture
        await performCapture(photoNum);
      }
    }, 1000);
  };

  const handleContinueNext = () => {
    sound.playTap();
    triggerPhotoCaptureSequence(currentPhotoIndex + 1);
  };

  const performCapture = async (photoNum: number) => {
    setIsFlashing(true);
    sound.playShutter();

    let dataUrl = "";
    if (videoRef.current) {
      dataUrl = await cameraService.capture(videoRef.current, isMirror);
    }

    const newPhoto: CapturedPhoto = {
      id: `photo_${photoNum}_${Date.now()}`,
      index: photoNum,
      dataUrl,
      timestamp: Date.now(),
    };

    const updatedList = [...capturedPhotos, newPhoto];
    setCapturedPhotos(updatedList);

    setTimeout(() => {
      setIsFlashing(false);

      if (photoNum < config.photoCount) {
        // Wait for manual input
        setStatusMessage(`¡Genial! Presiona Continuar para la siguiente.`);
        setWaitingForNext(true);
      } else {
        // Complete session
        setStatusMessage("¡Sesión terminada! Procesando fotos...");
        setTimeout(() => {
          onSessionComplete(updatedList);
        }, 1200);
      }
    }, 600);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 bg-transparent select-none overflow-hidden">
      
      {/* Background blackout outside viewfinder (Optional depending on design) 
          To allow camera to only show in the viewfinder, we could use a clip-path,
          but actually, rendering the camera fullscreen behind the UI looks great!
      */}

      {/* Fullscreen Camera Flash Overlay */}
      {isFlashing && (
        <div className="absolute inset-0 z-50 bg-white animate-flash pointer-events-none" />
      )}

      {/* Top Banner & Status Indicator */}
      <div className="w-full max-w-4xl flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E5A93C] text-black font-bold flex items-center justify-center font-vintage text-lg shadow-md">
            {currentPhotoIndex}
          </div>
          <div>
            <span className="text-xs font-mono text-[#E5A93C] uppercase tracking-widest block">
              Sesión Fotográfica
            </span>
            <span className="text-lg font-bold font-vintage text-white">
              Foto {currentPhotoIndex} de {config.photoCount}
            </span>
          </div>
        </div>

        {/* Viewfinder Controls */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-mirror-camera"
            onClick={() => {
              sound.playTap();
              setIsMirror(!isMirror);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#242429] hover:bg-[#323238] text-xs font-semibold text-gray-300 flex items-center gap-1.5 border border-white/10"
          >
            <FlipHorizontal className="w-4 h-4 text-[#E5A93C]" />
            <span className="hidden sm:inline">Espejo: {isMirror ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Viewfinder Box */}
      <div className="relative w-full max-w-[65vh] sm:max-w-[75vh] aspect-square flex-1 my-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-transparent border-2 sm:border-4 border-[#E5A93C] shadow-2xl flex flex-col items-center justify-center">
        
        {/* Browser camera preview */}
        <video
          ref={videoRef}
          id="cameraPreview"
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${isMirror ? 'scale-x-[-1]' : ''}`}
        />

        {/* Viewfinder Overlay Guides */}
        <div className="absolute inset-0 pointer-events-none border-2 border-white/20 m-6 rounded-2xl flex flex-col justify-between p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-white/70 bg-black/40 px-2 py-0.5 rounded">
              HD • 300 DPI
            </span>
            <div className="flex items-center gap-1.5 bg-red-600/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white uppercase tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>REC</span>
            </div>
          </div>

          {/* Golden Center Target */}
          {countdown === null && !waitingForNext && (
            <div className="self-center flex flex-col items-center">
              <div className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#E5A93C] rounded-full" />
              </div>
            </div>
          )}

          <div className="text-center">
            <span className="text-sm font-vintage font-bold text-white/90 bg-black/60 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              {statusMessage}
            </span>
          </div>
        </div>

        {/* Giant Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
            <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-[#E5A93C] border-8 border-white text-black font-extrabold text-8xl sm:text-9xl font-vintage flex items-center justify-center shadow-2xl animate-pulse">
              {countdown}
            </div>
            <p className="mt-4 text-2xl font-bold font-vintage text-white tracking-wider uppercase drop-shadow-md">
              ¡Sonríe a la cámara!
            </p>
          </div>
        )}

        {/* Manual Continue Button Overlay */}
        {waitingForNext && (
          <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
             <button
              onClick={handleContinueNext}
              className="py-5 px-10 rounded-2xl bg-[#E5A93C] hover:bg-[#F5B94E] active:scale-95 text-black font-extrabold text-2xl sm:text-3xl font-vintage shadow-[0_8px_0_0_#A8731E] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-3 border-2 border-black"
            >
              <span>CONTINUAR</span>
              <ArrowRight className="w-8 h-8" />
            </button>
            <p className="mt-4 text-lg font-medium text-white tracking-wide">
              Presiona para la foto {currentPhotoIndex + 1}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Filmstrip Thumbnails */}
      <div className="w-full max-w-4xl flex items-center justify-center gap-3 py-1">
        {Array.from({ length: config.photoCount }).map((_, idx) => {
          const photo = capturedPhotos.find((p) => p.index === idx + 1);
          const isCurrent = currentPhotoIndex === idx + 1;

          return (
            <div
              key={idx}
              className={`relative w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden border-2 transition-all flex items-center justify-center ${
                photo
                  ? 'border-[#10B981] bg-black shadow-md'
                  : isCurrent
                  ? 'border-[#E5A93C] bg-[#242429] animate-pulse'
                  : 'border-white/20 bg-[#1E1E24]'
              }`}
            >
              {photo ? (
                <img
                  src={photo.dataUrl}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-500 text-xs">
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span className="font-mono text-[10px]">Foto {idx + 1}</span>
                </div>
              )}

              <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[10px] font-bold text-white">
                #{idx + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

