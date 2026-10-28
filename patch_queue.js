import fs from 'fs';
let code = fs.readFileSync('src/services/printerService.ts', 'utf8');

// Add PrintJob interface at the top if not exists
if (!code.includes('export interface PrintJob')) {
  code = code.replace('export interface PrintResult', `export interface PrintJob {
  id: string;
  imageUrl: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  timestamp: number;
  error?: string;
}

export interface PrintResult`);
}

// Add getQueue and retryJob to PrinterService
if (!code.includes('public getQueue(')) {
  const queueMethods = `
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
`;
  code = code.replace('public async refillPaper()', queueMethods + '\n  public async refillPaper()');
}

// Update the print method to use saveToQueue
code = code.replace('public async print(imageUrl: string, sessionId: string, onProgress?: (pass: string, percent: number) => void): Promise<PrintResult> {', `public async print(imageUrl: string, sessionId: string, onProgress?: (pass: string, percent: number) => void): Promise<PrintResult> {
    this.saveToQueue({ id: sessionId, imageUrl, status: 'printing', timestamp: Date.now() });`);

// We also need to update the status based on the result. But since activeProvider.print is returned, we need to intercept it.
const oldPrint = `    return this.activeProvider.print(imageUrl, sessionId, onProgress);`;
const newPrint = `    try {
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
    }`;
code = code.replace(oldPrint, newPrint);

fs.writeFileSync('src/services/printerService.ts', code);
