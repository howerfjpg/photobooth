export type KioskStep = 
  | 'attract'      // Pantalla de bienvenida ("¡Sonríe!")
  | 'how_it_works' // Modal explicativo
  | 'theme_selection' // Elegir tema del papel
  | 'countdown'    // Prepárate... 3, 2, 1
  | 'capturing'    // Flash y captura de foto N de 3
  | 'review'       // Revisión de las 3 fotos con opción de retake
  | 'composing'    // Generación de diseño / plantilla photobooth
  | 'printing'     // Impresión (animación y despacho)
  | 'digital_qr'   // Escanea QR para descargar fotos
  | 'admin';       // Panel de control protegido

export type PhotoFilterId = 
  | 'normal'
  | 'vintage-warm'
  | 'bw-classic'
  | 'sepia-film'
  | 'noir'
  | 'golden-hour'
  | 'grain-90s';

export interface PhotoFilter {
  id: PhotoFilterId;
  name: string;
  cssFilter: string;
  previewColor: string;
  canvasFilter?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export type TemplateLayoutId = 'classic-strip' | 'double-strip' | 'polaroid-quad' | 'postcard-4x6';

export interface TemplateConfig {
  id: TemplateLayoutId;
  name: string;
  description: string;
  aspectRatio: string; // '2:6' (strip) or '4:6' (postcard)
  photosPerStrip: number;
  width: number;  // standard high-res pixels e.g. 1200 x 1800 (4x6 @ 300dpi is 1200x1800)
  height: number;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  showLogo: boolean;
  showDate: boolean;
  showEventName: boolean;
  showFooterSubtitle: boolean;
}

export type PaperThemeId = 'classic' | 'femenino' | 'futbol' | 'inacap' | 'emojis';

export interface KioskConfig {
  eventName: string;
  eventDate: string;
  eventSubtitle: string;
  photoCount: number;
  countdownSeconds: number;
  autoResetSeconds: number;
  primaryColor: string;
  accentColor: string;
  templateId: TemplateLayoutId;
  paperTheme: PaperThemeId;
  themeCareerText?: string;
  themeEmojis?: string;
  inacapCareers?: string[];
  logoUrl: string;
  paperRemaining: number;
  paperCapacity: number;
  cameraModel: string;
  selectedCameraDeviceId?: string; // ID de la cámara seleccionada (ej: frontal, trasera, USB)
  publicServerUrl?: string; // IP local o dominio para QR (ej: http://192.168.1.100:5173 o https://mi-dominio.com)
  enableDigitalQr?: boolean; // Activar/desactivar entrega digital con QR
}

export interface CapturedPhoto {
  id: string;
  index: number;
  dataUrl: string;
  timestamp: number;
}


export type MachineState =
  | 'IDLE'
  | 'PHOTO_1_COUNTDOWN'
  | 'PHOTO_1_CAPTURE'
  | 'PHOTO_2_COUNTDOWN'
  | 'PHOTO_2_CAPTURE'
  | 'PHOTO_3_COUNTDOWN'
  | 'PHOTO_3_CAPTURE'
  | 'PROCESSING_PHOTOS'
  | 'PREVIEW'
  | 'PRINTING'
  | 'PRINT_SUCCESS'
  | 'PRINT_FAILED'
  | 'DIGITAL_DOWNLOAD'
  | 'FINISHED'
  | 'ERROR';

export interface PhotoboothSession {
  id: string;
  token: string;
  createdAt: number;
  eventName: string;
  photos: CapturedPhoto[];
  compositeUrl: string | null;
  printStatus: 'none' | 'idle' | 'queued' | 'printing' | 'completed' | 'success' | 'failed';
  downloadToken?: string;
  currentState: MachineState;
  printError?: string;
  templateId: TemplateLayoutId;
  paperTheme?: PaperThemeId;
  themeCareerText?: string;
  themeEmojis?: string;
  filterApplied?: PhotoFilterId;
}

export interface HardwareStatus {
  cameraReady: boolean;
  cameraName: string;
  printerReady: boolean;
  printerName: string;
  paperCount: number;
  networkOnline: boolean;
  fps?: number;
}
