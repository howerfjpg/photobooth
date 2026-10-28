import { useState, useEffect } from 'react';
import { PhotoboothSession, MachineState, CapturedPhoto, TemplateLayoutId, PaperThemeId, PhotoFilterId } from '../types';

export type MachineAction =
  | { type: 'START_PHOTOS' }
  | { type: 'PHOTO_CAPTURED'; photo: CapturedPhoto }
  | { type: 'TRIGGER_FLASH' }
  | { type: 'ALL_PHOTOS_CAPTURED' }
  | { type: 'START_PROCESSING' }
  | { type: 'PROCESSING_DONE'; compositeUrl: string }
  | { type: 'START_PRINT' }
  | { type: 'PRINT_SUCCESS' }
  | { type: 'PRINT_FAILED'; error?: string }
  | { type: 'PROCEED_TO_DOWNLOAD' }
  | { type: 'FINISH_SESSION' }
  | { type: 'RESET' };

const INITIAL_SESSION: PhotoboothSession = {
  id: '',
  token: '',
  createdAt: 0,
  eventName: '',
  photos: [],
  compositeUrl: null,
  printStatus: 'idle',
  currentState: 'IDLE',
  templateId: 'classic-strip',
};

const LS_KEY = 'pb_machine_state';

export function usePhotoboothMachine() {
  const [session, setSession] = useState<PhotoboothSession>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PhotoboothSession;
        // Recovery logic: if stuck in an active state but we rebooted, 
        // maybe we should allow continuing, but for some like capture it might be broken.
        // For now, let's just load it.
        return parsed;
      }
    } catch (e) {}
    return { ...INITIAL_SESSION };
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(session));
  }, [session]);

  const dispatch = (action: MachineAction) => {
    setSession(prev => {
      const next = { ...prev };
      switch (action.type) {
        case 'START_PHOTOS':
          if (prev.currentState !== 'IDLE' && prev.currentState !== 'FINISHED') return prev;
          next.currentState = 'PHOTO_1_COUNTDOWN';
          break;
          
        
        case 'TRIGGER_FLASH':
          if (prev.currentState === 'PHOTO_1_COUNTDOWN') next.currentState = 'PHOTO_1_CAPTURE';
          else if (prev.currentState === 'PHOTO_2_COUNTDOWN') next.currentState = 'PHOTO_2_CAPTURE';
          else if (prev.currentState === 'PHOTO_3_COUNTDOWN') next.currentState = 'PHOTO_3_CAPTURE';
          break;

        case 'PHOTO_CAPTURED':
          if (prev.currentState === 'PHOTO_1_CAPTURE' || prev.currentState === 'PHOTO_1_COUNTDOWN') {
            next.photos = [action.photo];
            next.currentState = 'PHOTO_2_COUNTDOWN';
          } else if (prev.currentState === 'PHOTO_2_CAPTURE' || prev.currentState === 'PHOTO_2_COUNTDOWN') {
            next.photos = [...prev.photos, action.photo];
            next.currentState = 'PHOTO_3_COUNTDOWN';
          } else if (prev.currentState === 'PHOTO_3_CAPTURE' || prev.currentState === 'PHOTO_3_COUNTDOWN') {
            next.photos = [...prev.photos, action.photo];
            next.currentState = 'PROCESSING_PHOTOS';
          }
          break;
          
        case 'ALL_PHOTOS_CAPTURED':
          next.currentState = 'PROCESSING_PHOTOS';
          break;
          
        case 'START_PROCESSING':
          next.currentState = 'PROCESSING_PHOTOS';
          break;
          
        case 'PROCESSING_DONE':
          if (prev.currentState !== 'PROCESSING_PHOTOS') return prev;
          next.compositeUrl = action.compositeUrl;
          next.currentState = 'PREVIEW';
          break;
          
        case 'START_PRINT':
          if (prev.currentState !== 'PREVIEW' && prev.printStatus === 'idle') return prev;
          next.printStatus = 'printing';
          next.currentState = 'PRINTING';
          break;
          
        case 'PRINT_SUCCESS':
          if (prev.currentState !== 'PRINTING') return prev;
          next.printStatus = 'success';
          next.currentState = 'PRINT_SUCCESS';
          break;
          
        case 'PRINT_FAILED':
          if (prev.currentState !== 'PRINTING') return prev;
          next.printStatus = 'failed';
          next.printError = action.error;
          next.currentState = 'PRINT_FAILED';
          break;
          
        case 'PROCEED_TO_DOWNLOAD':
          next.currentState = 'DIGITAL_DOWNLOAD';
          break;
          
        case 'FINISH_SESSION':
          next.currentState = 'FINISHED';
          break;
          
        case 'RESET':
          return { ...INITIAL_SESSION };
      }
      return next;
    });
  };

  return { session, dispatch, setSession };
}
