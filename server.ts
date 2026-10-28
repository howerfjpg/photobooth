import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { INACAP_COPIAPO_CAREERS } from "./src/data/inacapCopiapoCareers";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function getLanIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch {}
  return "localhost";
}

interface SessionData {
  id: string;
  token: string;
  createdAt: number;
  eventName: string;
  photos: string[]; // public URLs
  compositeUrl: string | null;
  printStatus: "none" | "queued" | "printing" | "completed" | "error";
  printError?: string;
  templateId: string;
  filterApplied?: string;
}

interface KioskConfig {
  eventName: string;
  eventDate: string;
  eventSubtitle: string;
  photoCount: number;
  countdownSeconds: number;
  autoResetSeconds: number;
  primaryColor: string;
  accentColor: string;
  templateId: string;
  logoUrl: string;
  paperRemaining: number;
  paperCapacity: number;
  cameraModel: string;
  publicServerUrl?: string;
  enableDigitalQr?: boolean;
  inacapCareers?: string[];
}

const sessions: Map<string, SessionData> = new Map();
const sessionTokens: Map<string, string> = new Map();

let kioskConfig: KioskConfig = {
  eventName: "Inacapifotos",
  eventDate: "2026",
  eventSubtitle: "¡Gracias por elegirnos!",
  photoCount: 3,
  countdownSeconds: 5,
  autoResetSeconds: 60,
  primaryColor: "#E5A93C",
  accentColor: "#1E1E24",
  templateId: "classic-strip",
  logoUrl: "",
  paperRemaining: 36,
  paperCapacity: 36,
  cameraModel: "Webcam USB HD",
  publicServerUrl: "",
  enableDigitalQr: true,
  inacapCareers: INACAP_COPIAPO_CAREERS,
};

const sampleId = "demo-session-101";
const sampleToken = "demo-abc-123";
sessions.set(sampleId, {
  id: sampleId,
  token: sampleToken,
  createdAt: Date.now() - 1000 * 60 * 15,
  eventName: kioskConfig.eventName,
  photos: [],
  compositeUrl: null,
  printStatus: "completed",
  templateId: "classic-strip",
  filterApplied: "vintage-warm",
});
sessionTokens.set(sampleToken, sampleId);

function saveBase64ToDisk(dataUrl: string, fileName: string): string {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const buffer = Buffer.from(base64, "base64");
  const filePath = path.join(UPLOADS_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  return fileName;
}

function fileUrl(req: express.Request, fileName: string): string {
  const host = req.headers.host || "localhost:3000";
  const proto = req.secure ? "https" : "http";
  return `${proto}://${host}/uploads/${fileName}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Serve uploaded files publicly
  app.use("/uploads", express.static(UPLOADS_DIR));

  // --- API Endpoints ---

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      sessionsCount: sessions.size,
    });
  });

  app.get("/api/config", (_req, res) => {
    const lanIp = getLanIp();
    const envPublicUrl = process.env.PUBLIC_URL || process.env.VITE_PUBLIC_URL || process.env.APP_URL;
    let effectiveUrl = kioskConfig.publicServerUrl?.trim() || envPublicUrl || "";

    if (
      !effectiveUrl ||
      effectiveUrl.includes("MY_APP_URL") ||
      effectiveUrl.includes("localhost") ||
      effectiveUrl.includes("127.0.0.1")
    ) {
      if (lanIp && lanIp !== "localhost") {
        effectiveUrl = `http://${lanIp}:${PORT}`;
      }
    }

    res.json({
      ...kioskConfig,
      publicServerUrl: effectiveUrl,
      lanIp: lanIp,
    });
  });

  app.post("/api/config", (req, res) => {
    try {
      const updates = req.body;
      kioskConfig = { ...kioskConfig, ...updates };
      res.json({ success: true, config: kioskConfig });
    } catch (error) {
      res.status(400).json({ error: "Failed to update configuration" });
    }
  });

  app.post("/api/sessions/create", (req, res) => {
    try {
      const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const token = `guest_${Math.random().toString(36).substring(2, 9)}`;

      const newSession: SessionData = {
        id: sessionId,
        token: token,
        createdAt: Date.now(),
        eventName: kioskConfig.eventName,
        photos: [],
        compositeUrl: null,
        printStatus: "none",
        templateId: kioskConfig.templateId,
      };

      sessions.set(sessionId, newSession);
      sessionTokens.set(token, sessionId);

      res.json({
        success: true,
        session: newSession,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:id", (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
  });

  app.get("/api/admin/sessions", (_req, res) => {
    const list = Array.from(sessions.values()).sort((a, b) => b.createdAt - a.createdAt);
    res.json({
      total: list.length,
      printedCount: list.filter((s) => s.printStatus === "completed").length,
      sessions: list,
    });
  });

  // Save captured photos to session (guarda en disco local, 100% gratis)
  app.post("/api/sessions/:id/photos", (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    const { photos, compositeUrl, filterApplied } = req.body;

    const publicPhotos: string[] = [];
    if (photos && Array.isArray(photos)) {
      for (let i = 0; i < photos.length; i++) {
        const fileName = `photo_${session.id}_${i + 1}.jpg`;
        saveBase64ToDisk(photos[i], fileName);
        publicPhotos.push(`/uploads/${fileName}`);
      }
      session.photos = publicPhotos;
    }
    if (compositeUrl) {
      const fileName = `composite_${session.id}.jpg`;
      saveBase64ToDisk(compositeUrl, fileName);
      session.compositeUrl = `/uploads/${fileName}`;
    }
    if (filterApplied) {
      session.filterApplied = filterApplied;
    }
    sessions.set(session.id, session);
    res.json({ success: true, session });
  });

  app.post("/api/print/job", (req, res) => {
    const { sessionId } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (kioskConfig.paperRemaining <= 0) {
      session.printStatus = "error";
      session.printError = "Papel agotado en bandeja";
      sessions.set(session.id, session);
      return res.status(400).json({
        success: false,
        error: "Papel agotado",
        canDownloadDigital: true,
      });
    }

    session.printStatus = "printing";
    kioskConfig.paperRemaining = Math.max(0, kioskConfig.paperRemaining - 1);

    setTimeout(() => {
      session.printStatus = "completed";
      sessions.set(session.id, session);
    }, 3000);

    res.json({
      success: true,
      jobId: `job_${Date.now()}`,
      estimatedTimeSec: 8,
      paperRemaining: kioskConfig.paperRemaining,
    });
  });

  // Public digital download endpoint for guest QR code
  app.get("/api/download/:token", (req, res) => {
    const sessionId = sessionTokens.get(req.params.token);
    if (!sessionId) {
      return res.status(404).json({ error: "Enlace expirado o inválido" });
    }
    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    // Convert relative /uploads/ URLs to absolute URLs so the phone can download from another device
    const base = `${req.protocol}://${req.get("host")}`;
    const absolutePhotos = (session.photos || []).map((p) =>
      p.startsWith("http") ? p : `${base}${p}`
    );
    const absoluteComposite = session.compositeUrl
      ? session.compositeUrl.startsWith("http")
        ? session.compositeUrl
        : `${base}${session.compositeUrl}`
      : null;

    res.json({
      eventName: session.eventName,
      date: new Date(session.createdAt).toLocaleDateString(),
      photos: absolutePhotos,
      compositeUrl: absoluteComposite,
      expiresInMinutes: 60,
    });
  });

  app.post("/api/admin/refill-paper", (_req, res) => {
    kioskConfig.paperRemaining = kioskConfig.paperCapacity;
    res.json({ success: true, paperRemaining: kioskConfig.paperRemaining });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Photobooth Kiosk Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
