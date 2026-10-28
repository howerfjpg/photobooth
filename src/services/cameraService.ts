// Browser camera service for Linux kiosks and USB webcams.

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  kind: string;
}

export interface ICameraProvider {
  name: string;
  type: 'browser' | 'mock' | 'bridge';
  isAvailable(): Promise<boolean>;
  start(videoElement: HTMLVideoElement, deviceId?: string): Promise<boolean>;
  stop(): void;
  capture(videoElement: HTMLVideoElement, mirror?: boolean): Promise<string>;
  getDevices(): Promise<CameraDeviceInfo[]>;
}

// 1. Browser webcam access
export class BrowserCameraProvider implements ICameraProvider {
  public name = "Cámara Web / USB";
  public type = "browser" as const;
  private currentStream: MediaStream | null = null;

  async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
  }

  async getDevices(): Promise<CameraDeviceInfo[]> {
    if (!await this.isAvailable()) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(d => d.kind === 'videoinput')
        .map((d, idx) => ({
          deviceId: d.deviceId,
          label: d.label || `Cámara ${idx + 1}`,
          kind: d.kind
        }));
    } catch {
      return [];
    }
  }

  async start(videoElement: HTMLVideoElement, deviceId?: string): Promise<boolean> {
    this.stop();
    try {
      videoElement.style.opacity = "1";

      let constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId ? {
          deviceId: { ideal: deviceId },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        } : {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        }
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback flexible video constraint for tablets
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      this.currentStream = stream;
      videoElement.srcObject = stream;
      try {
        await videoElement.play();
      } catch (e) {
        console.warn("Video play aborted or failed:", e);
      }
      return true;
    } catch (err) {
      console.warn("Failed to start browser camera, fallback to mock may be needed:", err);
      return false;
    }
  }

  stop() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(t => t.stop());
      this.currentStream = null;
    }
  }

  async capture(videoElement: HTMLVideoElement, mirror: boolean = true): Promise<string> {
    const canvas = document.createElement('canvas');
    const videoWidth = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;
    
    // Create a square canvas
    const size = Math.min(videoWidth, height);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas 2d context");

    if (mirror) {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    // Draw the center of the video feed
    const sx = (videoWidth - size) / 2;
    const sy = (height - size) / 2;
    ctx.drawImage(videoElement, sx, sy, size, size, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.95);
  }
}

// 2. Mock Camera Generator (Generates party photo scenes when no physical camera is plugged in)
export class MockCameraService implements ICameraProvider {
  public name = "Cámara Simulada (Demo / Mock)";
  public type = "mock" as const;
  private animInterval: number | null = null;
  private mockIndex: number = 0;

  private mockScenes = [
    { title: "¡Grupo Sonriendo!", bg: "#3B2F2F", emoji: "🥳 📸 ✌️", filter: "warm" },
    { title: "¡Pose Divertida!", bg: "#2E3A2F", emoji: "🕶️ 💃 🕺", filter: "vintage" },
    { title: "¡Momento Fiesta!", bg: "#2D2A3E", emoji: "🎉 🥂 👑", filter: "party" },
    { title: "¡Selfie Retro!", bg: "#3D2B1F", emoji: "🤠 🤩 ✨", filter: "retro" }
  ];

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getDevices(): Promise<CameraDeviceInfo[]> {
    return [{ deviceId: 'mock-camera-1', label: 'Cámara Simulada para Eventos (HD)', kind: 'videoinput' }];
  }

  async start(videoElement: HTMLVideoElement): Promise<boolean> {
    this.stop();
    
    // Create animated canvas stream for mock video preview
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 960;
    const ctx = canvas.getContext('2d')!;

    let frame = 0;
    const draw = () => {
      frame++;
      const scene = this.mockScenes[this.mockIndex % this.mockScenes.length];
      
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, scene.bg);
      grad.addColorStop(1, "#18181B");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Warm retro spotlights
      ctx.fillStyle = "rgba(229, 169, 60, 0.15)";
      ctx.beginPath();
      ctx.arc(640 + Math.sin(frame * 0.05) * 40, 400 + Math.cos(frame * 0.04) * 20, 300, 0, Math.PI * 2);
      ctx.fill();

      // Fun retro camera frame & viewfinder
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 4;
      ctx.strokeRect(100, 100, canvas.width - 200, canvas.height - 200);

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(640 - 30, 480);
      ctx.lineTo(640 + 30, 480);
      ctx.moveTo(640, 480 - 30);
      ctx.lineTo(640, 480 + 30);
      ctx.stroke();

      // Simulated guest avatars & celebration
      ctx.font = "80px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(scene.emoji, 640, 450 + Math.sin(frame * 0.08) * 10);

      ctx.fillStyle = "#E5A93C";
      ctx.font = "bold 36px 'Outfit', sans-serif";
      ctx.fillText("VISTA PREVIA DE CÁMARA (SIMULADA)", 640, 560);
      
      ctx.fillStyle = "#FAF7F2";
      ctx.font = "24px sans-serif";
      ctx.fillText(scene.title, 640, 610);

      ctx.font = "18px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText(`REC • 1080p 60FPS • MOCK_ACTIVE #${frame % 1000}`, 640, 800);
    };

    // @ts-ignore
    const stream = canvas.captureStream ? canvas.captureStream(30) : null;
    if (stream) {
      videoElement.srcObject = stream;
      videoElement.play().catch(e => console.warn("Mock video play aborted:", e));
    }

    this.animInterval = window.setInterval(draw, 1000 / 30);
    return true;
  }

  stop() {
    if (this.animInterval) {
      clearInterval(this.animInterval);
      this.animInterval = null;
    }
  }

  async capture(): Promise<string> {
    const scene = this.mockScenes[this.mockIndex % this.mockScenes.length];
    this.mockIndex++;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d')!;

    // Photorealistic warm retro studio backdrop
    const grad = ctx.createRadialGradient(600, 600, 100, 600, 600, 800);
    grad.addColorStop(0, "#5A3D28");
    grad.addColorStop(0.5, "#382315");
    grad.addColorStop(1, "#18181B");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Warm ambient vintage lighting
    ctx.fillStyle = "rgba(255, 220, 150, 0.18)";
    ctx.beginPath();
    ctx.arc(600, 600, 400, 0, Math.PI * 2);
    ctx.fill();

    // Silhouettes & party subject illustrations
    ctx.font = "200px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(scene.emoji, 600, 600);

    ctx.fillStyle = "#FAF7F2";
    ctx.font = "bold 54px 'Fraunces', serif";
    ctx.fillText(scene.title, 600, 750);

    ctx.fillStyle = "#E5A93C";
    ctx.font = "28px 'Outfit', sans-serif";
    ctx.fillText(`Recuerdo de Evento #${this.mockIndex}`, 600, 640);

    // Subtle grain texture
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    for (let x = 0; x < canvas.width; x += 6) {
      for (let y = 0; y < canvas.height; y += 6) {
        if (Math.random() > 0.5) {
          ctx.fillRect(x, y, 3, 3);
        }
      }
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  }
}

// 3. Mini-PC / Raspberry Pi Bridge Camera (Tethered Canon DSLR / gPhoto2)
export class BridgeCameraProvider implements ICameraProvider {
  public name = "Cámara Réflex / Bridge Mini-PC (gPhoto2)";
  public type = "bridge" as const;
  private bridgeUrl: string;

  constructor(bridgeUrl: string = "http://192.168.1.100:8080") {
    this.bridgeUrl = bridgeUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.bridgeUrl}/api/camera/status`, { signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getDevices(): Promise<CameraDeviceInfo[]> {
    return [{ deviceId: 'bridge-dslr', label: 'Canon EOS / Nikon DSLR vía Mini-PC', kind: 'videoinput' }];
  }

  async start(videoElement: HTMLVideoElement): Promise<boolean> {
    videoElement.src = `${this.bridgeUrl}/stream/mjpeg`;
    try {
      await videoElement.play();
      return true;
    } catch (e) {
      console.warn("Bridge video play aborted:", e);
      return false;
    }
  }

  stop() {}

  async capture(): Promise<string> {
    const res = await fetch(`${this.bridgeUrl}/api/camera/capture`, { method: 'POST' });
    const data = await res.json();
    return data.imageUrl;
  }
}

export class CameraService {
  private activeProvider: ICameraProvider;
  private browserProvider = new BrowserCameraProvider();
  private mockProvider = new MockCameraService();
  private bridgeProvider = new BridgeCameraProvider();

  constructor() {
    this.activeProvider = this.browserProvider;
  }

  public setProvider(type: 'browser' | 'mock' | 'bridge') {
    this.activeProvider.stop();
    if (type === 'mock') this.activeProvider = this.mockProvider;
    else if (type === 'bridge') this.activeProvider = this.bridgeProvider;
    else this.activeProvider = this.browserProvider;
  }

  public getProvider(): ICameraProvider {
    return this.activeProvider;
  }

  public async start(videoElement: HTMLVideoElement, deviceId?: string, forceMock: boolean = false): Promise<boolean> {
    if (forceMock) {
      this.activeProvider = this.mockProvider;
      return this.activeProvider.start(videoElement);
    }

    const available = await this.activeProvider.isAvailable();
    if (!available) {
      console.warn("Camera not available, falling back to mock provider");
      this.activeProvider = this.mockProvider;
      return this.activeProvider.start(videoElement);
    }

    const started = await this.activeProvider.start(videoElement, deviceId);
    if (!started) {
      console.warn("Could not start browser camera, fallback to mock");
      this.activeProvider = this.mockProvider;
      return this.activeProvider.start(videoElement);
    }
    return true;
  }

  public stop() {
    this.activeProvider.stop();
  }

  public async capture(videoElement: HTMLVideoElement, mirror: boolean = true): Promise<string> {
    return this.activeProvider.capture(videoElement, mirror);
  }

  public async getDevices(): Promise<CameraDeviceInfo[]> {
    return this.activeProvider.getDevices();
  }
}

export const cameraService = new CameraService();
