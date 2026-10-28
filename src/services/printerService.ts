// Browser/system printer service for Linux kiosks and CUPS-backed printers.

import { getApiUrl } from './apiClient';

export interface PrinterStatus {
  isOnline: boolean;
  model: string;
  paperRemaining: number;
  paperCapacity: number;
  ribbonStatus: 'ok' | 'low' | 'empty' | 'unknown';
  state: 'idle' | 'printing' | 'error' | 'out_of_paper';
  errorMessage?: string;
}

export interface PrintJob {
  id: string;
  sessionId?: string;
  createdAt?: number;
  status: 'queued' | 'printing' | 'completed' | 'failed';
  progressPercent?: number;
  sublimationPass?: 'yellow' | 'magenta' | 'cyan' | 'overcoat' | 'eject';
  imageUrl?: string;
  timestamp?: number;
  error?: string;
}

export interface PrintResult {
  success: boolean;
  jobId?: string;
  error?: string;
  canDownloadDigital: boolean;
}

export interface IPrinterService {
  name: string;
  type: 'mock' | 'airprint' | 'bridge';
  getStatus(): Promise<PrinterStatus>;
  isAvailable(): Promise<boolean>;
  print(imageUrl: string, sessionId: string, onProgress?: (pass: string, percent: number) => void): Promise<PrintResult>;
  refillPaper(): Promise<void>;
}

// 1. Mock Printer Service (Accurate dye-sublimation 4-pass simulation like Canon Selphy CP1500)
export class MockPrinterService implements IPrinterService {
  public name = "Canon Selphy CP1500 (Simulación Kiosco)";
  public type = "mock" as const;
  private paperCount = 36;
  private maxPaper = 36;

  async getStatus(): Promise<PrinterStatus> {
    try {
      const res = await fetch(getApiUrl('/api/config'));
      if (res.ok) {
        const config = await res.json();
        this.paperCount = config.paperRemaining;
        this.maxPaper = config.paperCapacity;
      }
    } catch {}

    return {
      isOnline: true,
      model: "Canon Selphy CP1500 (Térmica Dye-Sub)",
      paperRemaining: this.paperCount,
      paperCapacity: this.maxPaper,
      ribbonStatus: this.paperCount > 5 ? 'ok' : this.paperCount > 0 ? 'low' : 'empty',
      state: this.paperCount <= 0 ? 'out_of_paper' : 'idle',
      errorMessage: this.paperCount <= 0 ? 'Bandeja de papel vacía (Recargar Selphy)' : undefined,
    };
  }

  async isAvailable(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isOnline && status.paperRemaining > 0;
  }

  async print(
    _imageUrl: string,
    sessionId: string,
    onProgress?: (pass: string, percent: number) => void
  ): Promise<PrintResult> {
    if (this.paperCount <= 0) {
      return {
        success: false,
        error: "No hay papel fotográfico en la bandeja inferior.",
        canDownloadDigital: true,
      };
    }

    try {
      // Trigger server job
      fetch(getApiUrl('/api/print/job'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});

      // Simulate 4-pass dye sublimation passes
      const passes = [
        { name: "Capa 1/4: Amarillo (Dye Yellow)", duration: 1500, percent: 25 },
        { name: "Capa 2/4: Magenta (Dye Magenta)", duration: 1500, percent: 50 },
        { name: "Capa 3/4: Cian (Dye Cyan)", duration: 1500, percent: 75 },
        { name: "Capa 4/4: Capa Protectora UV Brillante", duration: 1200, percent: 95 },
        { name: "Despachando fotografía al compartimento...", duration: 800, percent: 100 },
      ];

      for (const pass of passes) {
        onProgress?.(pass.name, pass.percent);
        await new Promise((r) => setTimeout(r, pass.duration));
      }

      this.paperCount = Math.max(0, this.paperCount - 1);

      return {
        success: true,
        jobId: `selphy_job_${Date.now()}`,
        canDownloadDigital: true,
      };
    } catch (err) {
      return {
        success: false,
        error: "Error de comunicación con la impresora.",
        canDownloadDigital: true,
      };
    }
  }

  async refillPaper(): Promise<void> {
    this.paperCount = this.maxPaper;
    try {
      await fetch(getApiUrl('/api/admin/refill-paper'), { method: 'POST' });
    } catch {}
  }
}

// 2. Browser / System Printer Service (Para PC / Impresoras USB locales / Papel A4 / Carta)
export class BrowserAirPrintService implements IPrinterService {
  public name = "Impresora del Sistema PC / USB (Papel A4 / Carta)";
  public type = "airprint" as const;

  async getStatus(): Promise<PrinterStatus> {
    return {
      isOnline: true,
      model: "Impresora del Sistema (USB / A4)",
      paperRemaining: 36,
      paperCapacity: 36,
      ribbonStatus: 'ok',
      state: 'idle',
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async print(imageUrl: string, _sessionId: string, onProgress?: (pass: string, percent: number) => void): Promise<PrintResult> {
    onProgress?.("Abriendo diálogo de impresión del sistema...", 50);

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';

    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @page { size: auto; margin: 10mm; }
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
              img { max-width: 100%; max-height: 90vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" onload="window.print();" />
          </body>
        </html>
      `);
      frameDoc.close();
    }

    await new Promise((r) => setTimeout(r, 2000));
    onProgress?.("Impresión enviada al sistema", 100);

    setTimeout(() => {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
    }, 5000);

    return {
      success: true,
      jobId: `system_print_${Date.now()}`,
      canDownloadDigital: true,
    };
  }

  async refillPaper(): Promise<void> {}
}

// 3. Mini-PC / Raspberry Pi CUPS Bridge
export class MiniPcBridgePrinterService implements IPrinterService {
  public name = "Servidor CUPS Mini-PC (DNP / Selphy USB)";
  public type = "bridge" as const;
  private bridgeUrl: string;

  constructor(bridgeUrl: string = "http://192.168.1.100:8080") {
    this.bridgeUrl = bridgeUrl;
  }

  async getStatus(): Promise<PrinterStatus> {
    try {
      const res = await fetch(`${this.bridgeUrl}/api/printer/status`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return {
      isOnline: false,
      model: "CUPS Bridge Server",
      paperRemaining: 0,
      paperCapacity: 36,
      ribbonStatus: 'empty',
      state: 'error',
      errorMessage: "No se pudo conectar con el servicio Mini-PC",
    };
  }

  async isAvailable(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isOnline;
  }

  async print(imageUrl: string, sessionId: string, onProgress?: (pass: string, percent: number) => void): Promise<PrintResult> {
    onProgress?.("Enviando comando de impresión a CUPS...", 40);
    try {
      const res = await fetch(`${this.bridgeUrl}/api/printer/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, sessionId }),
      });
      const data = await res.json();
      onProgress?.("Impresión finalizada", 100);
      return {
        success: data.success ?? true,
        jobId: data.jobId,
        canDownloadDigital: true,
      };
    } catch {
      return {
        success: false,
        error: "Error de red con el puente de impresión",
        canDownloadDigital: true,
      };
    }
  }

  async refillPaper(): Promise<void> {}
}


export class PrinterService {
  private activeProvider: IPrinterService;
  private mockProvider = new MockPrinterService();
  private airprintProvider = new BrowserAirPrintService();
  private bridgeProvider = new MiniPcBridgePrinterService();

  constructor() {
    this.activeProvider = this.airprintProvider;
  }

  public setProvider(type: 'mock' | 'airprint' | 'bridge') {
    if (type === 'airprint') this.activeProvider = this.airprintProvider;
    else if (type === 'bridge') this.activeProvider = this.bridgeProvider;
    else this.activeProvider = this.mockProvider;
  }

  public getProvider(): IPrinterService {
    return this.activeProvider;
  }

  public async getStatus(): Promise<PrinterStatus> {
    return this.activeProvider.getStatus();
  }

  public async print(imageUrl: string, sessionId: string, onProgress?: (pass: string, percent: number) => void): Promise<PrintResult> {
    this.saveToQueue({ id: sessionId, imageUrl, status: 'printing', timestamp: Date.now() });
    try {
      const result = await this.activeProvider.print(imageUrl, sessionId, onProgress);
      this.saveToQueue({ 
        id: sessionId, 
        imageUrl, 
        status: result.success ? 'completed' : 'failed', 
        timestamp: Date.now(),
        error: result.error 
      });
      return result;
    } catch (e: any) {
      this.saveToQueue({ 
        id: sessionId, 
        imageUrl, 
        status: 'failed', 
        timestamp: Date.now(),
        error: e.message 
      });
      return { success: false, error: e.message, canDownloadDigital: true };
    }
  }

  
  public getQueue(): PrintJob[] {
    try {
      const stored = localStorage.getItem('printer_queue');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  }

  public saveToQueue(job: PrintJob) {
    const queue = this.getQueue();
    const existingIndex = queue.findIndex(q => q.id === job.id);
    if (existingIndex >= 0) {
      queue[existingIndex] = job;
    } else {
      queue.push(job);
    }
    // Keep only last 50 jobs
    if (queue.length > 50) queue.shift();
    localStorage.setItem('printer_queue', JSON.stringify(queue));
  }

  public async retryJob(jobId: string): Promise<PrintResult> {
    const queue = this.getQueue();
    const job = queue.find(q => q.id === jobId);
    if (!job) return { success: false, error: 'Job no encontrado', canDownloadDigital: true };
    return this.print(job.imageUrl, job.id);
  }

  public async refillPaper(): Promise<void> {
    return this.activeProvider.refillPaper();
  }
}

export const printerService = new PrinterService();
