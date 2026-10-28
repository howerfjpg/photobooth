// Photo Composer Engine: generates 300DPI print-ready photobooth strips and cards

import { KioskConfig, PhotoFilterId, TemplateLayoutId } from '../types';

export const PHOTO_FILTERS: { id: PhotoFilterId; name: string; cssFilter: string; previewColor: string }[] = [
  { id: 'normal', name: 'Original', cssFilter: 'none', previewColor: '#3B82F6' },
  { id: 'vintage-warm', name: 'Retro Cálido', cssFilter: 'sepia(0.2) saturate(1.25) contrast(1.1) brightness(1.05)', previewColor: '#E5A93C' },
  { id: 'bw-classic', name: 'B&W Clásico', cssFilter: 'grayscale(1) contrast(1.2) brightness(1.05)', previewColor: '#71717A' },
  { id: 'sepia-film', name: 'Sepia Vintage', cssFilter: 'sepia(0.65) contrast(1.15) brightness(0.95)', previewColor: '#B45309' },
  { id: 'noir', name: 'Cine Noir', cssFilter: 'grayscale(1) contrast(1.45) brightness(0.9)', previewColor: '#18181B' },
  { id: 'golden-hour', name: 'Golden Hour', cssFilter: 'sepia(0.3) saturate(1.4) hue-rotate(-10deg) brightness(1.1)', previewColor: '#F59E0B' },
  { id: 'grain-90s', name: 'Grano 90s', cssFilter: 'contrast(1.2) brightness(1.05) saturate(1.1)', previewColor: '#10B981' },
];

export class PhotoComposer {
  public static async compose(
    photoUrls: string[],
    config: KioskConfig,
    filterId: PhotoFilterId = 'vintage-warm',
    templateId: TemplateLayoutId = config.templateId
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not initialize canvas 2D");

    // Standard 2x6" photobooth strip dimensions @ 300 DPI (600 x 1800 pixels) - 5x15 cm
    canvas.width = 600;
    canvas.height = 1800;

    // Background color
    ctx.fillStyle = config.primaryColor === '#E5A93C' ? '#FAF7F2' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load all captured photo images
    const loadedImages = await Promise.all(
      photoUrls.map((url) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      })
    );

    // Apply Filter Matrix if selected
    const applyFilter = (sourceImg: HTMLImageElement): HTMLCanvasElement => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = sourceImg.naturalWidth || sourceImg.width || 800;
      pCanvas.height = sourceImg.naturalHeight || sourceImg.height || 600;
      const pCtx = pCanvas.getContext('2d')!;

      const filterDef = PHOTO_FILTERS.find((f) => f.id === filterId);
      if (filterDef && filterDef.cssFilter !== 'none') {
        pCtx.filter = filterDef.cssFilter;
      }
      pCtx.drawImage(sourceImg, 0, 0, pCanvas.width, pCanvas.height);
      return pCanvas;
    };

    const processedImages = loadedImages.map((img) => applyFilter(img));

    // Render template layout
    switch (templateId) {
      case 'double-strip':
        this.renderDoubleStrip(ctx, processedImages, config);
        break;
      case 'polaroid-quad':
        this.renderPolaroidQuad(ctx, processedImages, config);
        break;
      case 'postcard-4x6':
        this.renderPostcard(ctx, processedImages, config);
        break;
      case 'classic-strip':
      default:
        this.renderClassicSingleStrip(ctx, processedImages, config);
        break;
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  }

  // Layout 1: Classic 3-photo vertical strip (centered 2x6 strip on 4x6 paper or standalone)
  private static renderClassicSingleStrip(
    ctx: CanvasRenderingContext2D,
    images: HTMLCanvasElement[],
    config: KioskConfig
  ) {
    const W = 600;
    const H = 1800;
    
    const theme = config.paperTheme || 'classic';

    let outerColor = '#18181B';
    let innerColor = '#FAF7F2';
    let primaryText = '#18181B';
    let secondaryText = '#6B7280';
    let accentColor = '#E5A93C';
    let photoFrameColor = '#FFFFFF';
    
    if (theme === 'femenino') {
      outerColor = '#D81B60';
      innerColor = '#FCE4EC';
      primaryText = '#880E4F';
      secondaryText = '#AD1457';
      accentColor = '#EC407A';
    } else if (theme === 'futbol') {
      outerColor = '#1B5E20';
      innerColor = '#E8F5E9';
      primaryText = '#1B5E20';
      secondaryText = '#2E7D32';
      accentColor = '#4CAF50';
    } else if (theme === 'inacap') {
      outerColor = '#18181B';
      innerColor = '#CC0000'; // INACAP Red
      primaryText = '#FFFFFF';
      secondaryText = '#FEE2E2';
      accentColor = '#FFFFFF';
      photoFrameColor = '#FFFFFF';
    } else if (theme === 'emojis') {
      outerColor = '#F57F17';
      innerColor = '#FFFDE7';
      primaryText = '#3E2723';
      secondaryText = '#5D4037';
      accentColor = '#FBC02D';
    }

    // Outer Border
    ctx.fillStyle = outerColor;
    ctx.fillRect(0, 0, W, H);

    // Inner Card
    ctx.fillStyle = innerColor;
    ctx.fillRect(20, 20, W - 40, H - 40);

    // Background Patterns based on theme
    if (theme === 'futbol') {
      ctx.fillStyle = '#C8E6C9';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, 80 + Math.random() * 100, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme === 'femenino') {
      ctx.fillStyle = '#F8BBD0';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, 80 + Math.random() * 100, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme === 'emojis' && config.themeEmojis) {
      ctx.font = "60px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const emojisArray = Array.from(config.themeEmojis); 
      if (emojisArray.length > 0) {
        let index = 0;
        const cols = 5;
        const rows = 14;
        const colW = W / cols;
        const rowH = H / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = c * colW + colW / 2;
            const y = r * rowH + rowH / 2;
            
            // Draw emojis only in the background area of the photos
            // Header is top 150px, Footer is bottom 1600px+
            if (y > 150 && y < 1650) {
              const emoji = emojisArray[index % emojisArray.length];
              ctx.fillText(emoji, x, y);
              index++;
            }
          }
        }
      }
    }

    // Header Text
    const titleText = theme === 'inacap' ? 'INACAP' : '★ PHOTOBOOTH ★';
    const subtitleText = theme === 'inacap' ? 'SEDE COPIAPÓ' : 'RECUERDO INSTANTÁNEO';

    ctx.fillStyle = primaryText;
    ctx.textAlign = 'center';
    ctx.font = theme === 'inacap' ? "900 44px 'Arial', sans-serif" : "bold 32px 'Fraunces', Georgia, serif";
    ctx.fillText(titleText, W / 2, theme === 'inacap' ? 85 : 80);

    ctx.font = theme === 'inacap' ? "bold 16px 'Arial', sans-serif" : "16px 'Outfit', sans-serif";
    ctx.fillStyle = secondaryText;
    ctx.fillText(subtitleText, W / 2, 110);

    // Thin decorative line
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(120, 130);
    ctx.lineTo(W - 120, 130);
    ctx.stroke();

    // 3 Photos placed vertically (Slightly smaller to prevent overlap)
    const photoCount = Math.min(images.length, 3);
    const photoWidth = 460;
    const photoHeight = 460;
    const startY = 160;
    const gap = 40;
    const photoX = 70; // (600 - 460) / 2 = 70

    for (let i = 0; i < photoCount; i++) {
      const y = startY + i * (photoHeight + gap);
      const img = images[i];

      // Photo Shadow / Border Frame
      ctx.fillStyle = photoFrameColor;
      ctx.fillRect(photoX - 8, y - 8, photoWidth + 16, photoHeight + 16);

      // Draw photo with cover crop
      this.drawCroppedImage(ctx, img, photoX, y, photoWidth, photoHeight);

      // Inner Photo Border
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(photoX, y, photoWidth, photoHeight);
    }

    // Footer Event Details
    const footerStartY = 1660; 
    
    // Auto-generate current localized date
    const autoDate = new Date().toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (theme === 'inacap') {
      // INACAP Footer
      ctx.fillStyle = primaryText;
      ctx.font = "900 24px 'Arial', sans-serif";
      ctx.fillText((config.themeCareerText || "Ingeniería en Informática").toUpperCase(), W / 2, footerStartY + 25);
      
      ctx.fillStyle = accentColor;
      ctx.font = "bold 16px 'Arial', sans-serif";
      ctx.fillText(config.eventName || "Feria Vocacional", W / 2, footerStartY + 55);
      
      ctx.fillStyle = secondaryText;
      ctx.font = "14px 'Arial', sans-serif";
      ctx.fillText(autoDate, W / 2, footerStartY + 80);
    } else {
      // General Footer
      ctx.fillStyle = primaryText;
      ctx.font = "bold 32px 'Fraunces', Georgia, serif";
      ctx.fillText(config.eventName || "Inacapifoto 🔴", W / 2, footerStartY + 30);

      ctx.fillStyle = accentColor;
      ctx.font = "bold 18px 'Outfit', sans-serif";
      ctx.fillText(autoDate, W / 2, footerStartY + 65);

      ctx.fillStyle = secondaryText;
      ctx.font = "italic 16px 'Fraunces', serif";
      ctx.fillText(config.eventSubtitle || "¡Gracias por celebrar con nosotros!", W / 2, footerStartY + 95);
    }

    // Retro Corner Accents
    if (theme === 'classic' || theme === 'inacap') {
      this.drawCornerFlourish(ctx, 60, 60, false, false, accentColor);
      this.drawCornerFlourish(ctx, W - 60, 60, true, false, accentColor);
      this.drawCornerFlourish(ctx, 60, H - 60, false, true, accentColor);
      this.drawCornerFlourish(ctx, W - 60, H - 60, true, true, accentColor);
    }
  }

  // Layout 2: Double Strip (Standard photobooth cut layout - 2 identical strips side-by-side)
  private static renderDoubleStrip(
    ctx: CanvasRenderingContext2D,
    images: HTMLCanvasElement[],
    config: KioskConfig
  ) {
    const W = 1200;
    const H = 1800;
    const halfW = W / 2;

    // Background
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, W, H);

    // Middle Cut Line (dotted indicator)
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(halfW, 20);
    ctx.lineTo(halfW, H - 20);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Render single strip on both halves (left and right)
    [0, halfW].forEach((offsetX) => {
      // Header
      ctx.fillStyle = '#18181B';
      ctx.textAlign = 'center';
      ctx.font = "bold 32px 'Fraunces', serif";
      ctx.fillText("★ PHOTOBOOTH ★", offsetX + halfW / 2, 100);

      // Photos
      const photoWidth = 460;
      const photoHeight = 330;
      const startY = 150;
      const gap = 30;

      images.slice(0, 3).forEach((img, i) => {
        const y = startY + i * (photoHeight + gap);
        const x = offsetX + (halfW - photoWidth) / 2;

        // White border
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 8, y - 8, photoWidth + 16, photoHeight + 16);
        this.drawCroppedImage(ctx, img, x, y, photoWidth, photoHeight);
      });

      // Footer
      const footerY = 1350;
      ctx.fillStyle = '#18181B';
      ctx.font = "bold 34px 'Fraunces', serif";
      ctx.fillText(config.eventName, offsetX + halfW / 2, footerY);

      ctx.fillStyle = '#C68925';
      ctx.font = "bold 20px 'Outfit', sans-serif";
      ctx.fillText(config.eventDate, offsetX + halfW / 2, footerY + 45);

      ctx.fillStyle = '#6B7280';
      ctx.font = "italic 18px 'Fraunces', serif";
      ctx.fillText(config.eventSubtitle, offsetX + halfW / 2, footerY + 80);
    });
  }

  // Layout 3: Polaroid Quad / 4-card style
  private static renderPolaroidQuad(
    ctx: CanvasRenderingContext2D,
    images: HTMLCanvasElement[],
    config: KioskConfig
  ) {
    const W = 1200;
    const H = 1800;

    ctx.fillStyle = '#18181B';
    ctx.fillRect(0, 0, W, H);

    // 3-photo dynamic postcard grid
    const photoWidth = 520;
    const photoHeight = 440;

    const coords = [
      { x: 70, y: 120 },
      { x: 610, y: 120 },
      { x: 70, y: 620 },
    ];

    images.slice(0, 3).forEach((img, i) => {
      const c = coords[i];
      // Polaroid white card base
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(c.x, c.y, photoWidth, photoHeight + 60);

      this.drawCroppedImage(ctx, img, c.x + 20, c.y + 20, photoWidth - 40, photoHeight - 40);

      ctx.fillStyle = '#4B5563';
      ctx.font = "18px 'Special Elite', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(`#0${i + 1} • MEMORIES`, c.x + photoWidth / 2, c.y + photoHeight + 35);
    });

    // 4th spot: Vintage Event Card
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(610, 620, photoWidth, photoHeight + 60);
    ctx.strokeStyle = '#E5A93C';
    ctx.lineWidth = 4;
    ctx.strokeRect(630, 640, photoWidth - 40, photoHeight + 20);

    ctx.fillStyle = '#18181B';
    ctx.textAlign = 'center';
    ctx.font = "bold 38px 'Fraunces', serif";
    ctx.fillText(config.eventName, 610 + photoWidth / 2, 780);

    ctx.fillStyle = '#C68925';
    ctx.font = "24px 'Outfit', sans-serif";
    ctx.fillText(config.eventDate, 610 + photoWidth / 2, 840);

    // Big Bottom Vintage Stamp Banner
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(70, 1220, 1060, 480);

    ctx.fillStyle = '#18181B';
    ctx.font = "bold 64px 'Fraunces', serif";
    ctx.fillText("VINTAGE PHOTOBOOTH", W / 2, 1380);

    ctx.fillStyle = '#4B5563';
    ctx.font = "32px 'Outfit', sans-serif";
    ctx.fillText(config.eventSubtitle, W / 2, 1460);

    ctx.fillStyle = '#C68925';
    ctx.font = "24px monospace";
    ctx.fillText("KEEP THIS MEMORY FOREVER", W / 2, 1540);
  }

  // Layout 4: Postcard 4x6" horizontal collage
  private static renderPostcard(
    ctx: CanvasRenderingContext2D,
    images: HTMLCanvasElement[],
    config: KioskConfig
  ) {
    const W = 1200;
    const H = 1800;

    ctx.fillStyle = '#FDFBF7';
    ctx.fillRect(0, 0, W, H);

    // Top Header Banner
    ctx.fillStyle = '#E5A93C';
    ctx.fillRect(0, 0, W, 220);

    ctx.fillStyle = '#18181B';
    ctx.textAlign = 'center';
    ctx.font = "bold 60px 'Fraunces', serif";
    ctx.fillText(config.eventName, W / 2, 120);

    ctx.font = "bold 26px 'Outfit', sans-serif";
    ctx.fillText(config.eventDate, W / 2, 175);

    // Main 3 photos
    const pW = 1040;
    const pH = 400;
    const startY = 280;

    images.slice(0, 3).forEach((img, i) => {
      const y = startY + i * (pH + 35);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(80 - 10, y - 10, pW + 20, pH + 20);
      this.drawCroppedImage(ctx, img, 80, y, pW, pH);
    });

    // Footer
    ctx.fillStyle = '#4B5563';
    ctx.font = "italic 28px 'Fraunces', serif";
    ctx.textAlign = 'center';
    ctx.fillText(config.eventSubtitle, W / 2, 1680);
  }

  // Helper to draw image with object-fit: cover behavior on canvas
  private static drawCroppedImage(
    ctx: CanvasRenderingContext2D,
    img: HTMLCanvasElement | HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const imgW = img.width;
    const imgH = img.height;
    const imgRatio = imgW / imgH;
    const targetRatio = w / h;

    let srcX = 0;
    let srcY = 0;
    let srcW = imgW;
    let srcH = imgH;

    if (imgRatio > targetRatio) {
      srcW = imgH * targetRatio;
      srcX = (imgW - srcW) / 2;
    } else {
      srcH = imgW / targetRatio;
      srcY = (imgH - srcH) / 2;
    }

    ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, w, h);
  }

  private static drawCornerFlourish(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    flipX: boolean = false,
    flipY: boolean = false,
    color: string = '#E5A93C'
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(0, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
    ctx.restore();
  }
}
