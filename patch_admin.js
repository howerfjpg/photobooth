import fs from 'fs';
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Import Printer, PrintJob from printerService
if (!code.includes('import { printerService, PrintJob }')) {
  code = code.replace(/import { printerService } from '\.\.\/services\/printerService';/, "import { printerService, PrintJob } from '../services/printerService';");
}

// Add 'printer' to tabs
code = code.replace(/type AdminTab = 'general' | 'camera' | 'themes' | 'security';/, "type AdminTab = 'general' | 'camera' | 'themes' | 'security' | 'printer';");
code = code.replace(/\{ id: 'security', label: 'Seguridad', icon: Shield \},/, "{ id: 'printer', label: 'Impresora', icon: Printer },\n            { id: 'security', label: 'Seguridad', icon: Shield },");

// Import Printer icon if not exists
if (!code.includes('Printer')) {
  code = code.replace(/import { (.*) } from 'lucide-react';/, "import { $1, Printer, RefreshCw, PrinterOff, PrinterIcon } from 'lucide-react';");
}

// Add state for printer queue
code = code.replace(/const \[status, setStatus\] = useState<PrinterStatus \| null>\(null\);/, `const [status, setStatus] = useState<PrinterStatus | null>(null);
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);`);

// Update loadStatus to fetch queue
code = code.replace(/const s = await printerService.getStatus\(\);/, `const s = await printerService.getStatus();
      setPrintQueue(printerService.getQueue().reverse());`);

// Add retry function
const retryFn = `
  const handleRetryPrint = async (jobId: string) => {
    setIsRetrying(jobId);
    try {
      const res = await printerService.retryJob(jobId);
      if (res.success) alert('Impresión re-enviada con éxito');
      else alert('Error: ' + res.error);
      setPrintQueue(printerService.getQueue().reverse());
    } finally {
      setIsRetrying(null);
    }
  };
`;
code = code.replace(/const handleTestPrint = async \(\) => \{/, retryFn + '\n  const handleTestPrint = async () => {');

// Add printer tab content
const printerContent = `
        {activeTab === 'printer' && (
          <div className="bg-[#1F1F26] rounded-2xl border border-white/5 p-6 space-y-6 text-gray-300 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold font-vintage text-xl text-[#FAF7F2]">Estado y Cola de Impresión</h3>
                <p className="text-sm">Monitorea los trabajos y reintenta fotos fallidas.</p>
              </div>
              <button onClick={loadStatus} className="p-2 hover:bg-white/10 rounded-full">
                <RefreshCw className="w-5 h-5 text-[#E5A93C]" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#262632] rounded-xl border border-white/10 space-y-2">
                <p className="text-xs text-gray-400">Estado de Conexión</p>
                <div className="flex items-center gap-2">
                  <div className={\`w-3 h-3 rounded-full \${status?.isOnline ? 'bg-green-500' : 'bg-red-500'}\`} />
                  <span className="font-bold text-white">{status?.state === 'idle' ? 'Listo (Idle)' : status?.state}</span>
                </div>
              </div>
              <div className="p-4 bg-[#262632] rounded-xl border border-white/10 space-y-2">
                <p className="text-xs text-gray-400">Papel Restante</p>
                <p className="font-bold text-white text-lg">{status?.paperRemaining ?? 0} / {status?.paperCapacity ?? 36}</p>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <h4 className="font-bold text-[#FAF7F2]">Historial de Impresión</h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {printQueue.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No hay trabajos recientes</div>
                ) : (
                  printQueue.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-[#18181B] border border-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <img src={job.imageUrl} className="w-12 h-12 object-cover rounded bg-black" />
                        <div>
                          <p className="text-sm text-white font-mono">Job: {job.id.slice(-6)}</p>
                          <p className={\`text-xs \${job.status === 'completed' ? 'text-green-400' : job.status === 'failed' ? 'text-red-400' : 'text-amber-400'}\`}>
                            {job.status.toUpperCase()} {job.error && \`- \${job.error}\`}
                          </p>
                        </div>
                      </div>
                      {(job.status === 'failed' || job.status === 'completed') && (
                        <button 
                          disabled={isRetrying === job.id}
                          onClick={() => handleRetryPrint(job.id)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white flex items-center gap-2 disabled:opacity-50"
                        >
                          {isRetrying === job.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PrinterIcon className="w-4 h-4" />}
                          Re-imprimir
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
`;

code = code.replace(/\{activeTab === 'security' && \(/, printerContent + '\n        {activeTab === \'security\' && (');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
