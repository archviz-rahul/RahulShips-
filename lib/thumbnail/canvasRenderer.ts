import { ThumbnailState, TextLayer, FacePlaceholderConfig } from "@/types/thumbnail";

// Helper to load image
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error("Failed to load background: " + err));
    img.src = url;
  });
}

// Draw the neon cyber grid
function drawNeonGrid(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.15;
  
  // Outer glow for lines
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  const gridSize = 40;

  // Horizontal lines
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Vertical lines
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  ctx.restore();
}

// Draw a elegant vignette overlay
function drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  const radius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, radius * 0.4,
    width / 2, height / 2, radius
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.4)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.9)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// Draw vector face placeholders with glowing outlines
export function drawFacePlaceholder(
  ctx: CanvasRenderingContext2D,
  config: FacePlaceholderConfig,
  primaryColor: string,
  faceImgElement: HTMLImageElement | null = null
) {
  if (config.type === "none" && !faceImgElement) return;

  const { x, y, scale, glowColor, glowWidth } = config;

  if (faceImgElement) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Apply Flip horizontally if orientation is left
    if (config.orientation === "left") {
      ctx.scale(-1, 1);
    }

    // Apply glow effect if configured
    if (glowWidth > 0) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowWidth * 2;
    }

    const imgWidth = faceImgElement.width;
    const imgHeight = faceImgElement.height;
    const targetHeight = 400;
    const targetWidth = (imgWidth / imgHeight) * targetHeight;

    ctx.drawImage(
      faceImgElement,
      -targetWidth / 2,
      -targetHeight,
      targetWidth,
      targetHeight
    );
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Set neon outline shadow properties
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowWidth * 2;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = glowWidth;
  ctx.fillStyle = "rgba(10, 10, 11, 0.85)";

  // Draw silhouette / elements based on type
  if (config.type === "neutral" || config.type === "happy" || config.type === "surprised" || config.type === "pointing") {
    // Shoulder/Chest base
    ctx.beginPath();
    ctx.ellipse(0, 180, 120, 80, 0, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Neck
    ctx.beginPath();
    ctx.rect(-30, 70, 60, 40);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(0, 0, 75, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Add expression details
    ctx.shadowBlur = 0; // Disable shadow for internal lines to keep it sharp
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 4;

    // Stylish Glasses / Eyewear for all avatars for premium look
    ctx.beginPath();
    ctx.arc(-30, -10, 20, 0, Math.PI * 2);
    ctx.arc(30, -10, 20, 0, Math.PI * 2);
    ctx.moveTo(-10, -10);
    ctx.lineTo(10, -10);
    ctx.stroke();

    // Mouth expressions
    if (config.type === "happy") {
      // Big smile
      ctx.beginPath();
      // Draw a arc smile
      ctx.arc(0, 25, 20, 0, Math.PI, false);
      ctx.stroke();
    } else if (config.type === "surprised") {
      // Open amazed mouth
      ctx.beginPath();
      ctx.arc(0, 25, 12, 0, Math.PI * 2);
      ctx.stroke();
    } else if (config.type === "neutral") {
      // Direct confident line
      ctx.beginPath();
      ctx.moveTo(-15, 25);
      ctx.lineTo(15, 25);
      ctx.stroke();
    } else if (config.type === "pointing") {
      // Smile + Pointing arm
      ctx.beginPath();
      ctx.arc(0, 25, 15, 0, Math.PI, false);
      ctx.stroke();

      // Pointing arm overlay vector
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowWidth * 1.5;
      ctx.lineWidth = glowWidth;
      ctx.strokeStyle = glowColor;

      ctx.beginPath();
      // Draw hand pointing upwards from bottom-left towards the center/top
      ctx.moveTo(-120, 150);
      ctx.lineTo(-100, 100);
      ctx.lineTo(-70, 70); // hand point base
      // Pointing finger index
      ctx.lineTo(-45, 20);
      ctx.lineTo(-55, 15);
      ctx.lineTo(-70, 60);
      // Other folded fingers
      ctx.arc(-80, 70, 10, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Hair Accent Highlights
    ctx.beginPath();
    ctx.moveTo(-75, -20);
    ctx.bezierCurveTo(-100, -100, 100, -100, 75, -20);
    ctx.bezierCurveTo(40, -55, -40, -55, -75, -20);
    ctx.fillStyle = glowColor;
    ctx.fill();
  }

  ctx.restore();
}

// Master Canvas Rendering Pipeline
export async function renderThumbnail(
  canvas: HTMLCanvasElement,
  state: ThumbnailState,
  bgImgElement: HTMLImageElement | null,
  faceImgElement: HTMLImageElement | null = null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;


  const width = state.resolution === "1280x720" ? 1280 : 720;
  const height = state.resolution === "1280x720" ? 720 : 1280;

  canvas.width = width;
  canvas.height = height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // STEP 1: Draw Background Layer
  if (state.useGradientOnly || !state.backgroundImageUrl || !bgImgElement) {
    // Draw visual gradient preset
    const preset = state.gradientBackground;
    // Extract colors or use standard gradient draw
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (state.pillar === "Archviz + AI") {
      grad.addColorStop(0, "#1F1105");
      grad.addColorStop(1, "#0A0501");
    } else if (state.pillar === "Trading + Systems") {
      grad.addColorStop(0, "#020B02");
      grad.addColorStop(1, "#000100");
    } else if (state.pillar === "Vibe Coding") {
      grad.addColorStop(0, "#04091A");
      grad.addColorStop(1, "#020409");
    } else {
      grad.addColorStop(0, "#130124");
      grad.addColorStop(1, "#06000E");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Draw background image scaled to fill
    ctx.save();
    const hRatio = width / bgImgElement.width;
    const vRatio = height / bgImgElement.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShift_x = (width - bgImgElement.width * ratio) / 2;
    const centerShift_y = (height - bgImgElement.height * ratio) / 2;

    ctx.drawImage(
      bgImgElement,
      0, 0, bgImgElement.width, bgImgElement.height,
      centerShift_x, centerShift_y, bgImgElement.width * ratio, bgImgElement.height * ratio
    );
    ctx.restore();
  }

  // STEP 2: Color Overlay Fill
  if (state.overlayOpacity > 0) {
    ctx.save();
    ctx.fillStyle = state.overlayColor;
    ctx.globalAlpha = state.overlayOpacity;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // STEP 3: Grid overlay (Matrix/Cyber styles)
  if (state.neonGrid) {
    let gridColor = "#39FF14"; // Default
    if (state.pillar === "Vibe Coding") gridColor = "#00E5FF";
    else if (state.pillar === "Archviz + AI") gridColor = "#FFB800";
    else if (state.pillar === "Builder Journey") gridColor = "#FF6B35";
    drawNeonGrid(ctx, width, height, gridColor);
  }

  // STEP 4: Vignette Glow
  if (state.vignette) {
    drawVignette(ctx, width, height);
  }

  // STEP 5: Draw Face Placeholder
  drawFacePlaceholder(
    ctx,
    state.face,
    state.pillar === "Archviz + AI" ? "#FFB800" : state.pillar === "Trading + Systems" ? "#39FF14" : state.pillar === "Vibe Coding" ? "#00E5FF" : "#FF6B35",
    faceImgElement
  );

  // STEP 6: Draw Text Layers (Title + Subtitle)
  // Subtitle Drawing
  if (state.subtitle.text) {
    ctx.save();
    ctx.textBaseline = "top";
    ctx.font = `bold ${state.subtitle.fontSize}px ${state.subtitle.fontFamily}`;
    ctx.fillStyle = state.subtitle.color;

    if (state.subtitle.shadowBlur > 0) {
      ctx.shadowColor = state.subtitle.shadowColor;
      ctx.shadowBlur = state.subtitle.shadowBlur;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
    }

    // Dynamic horizontal centring if vertical mode
    let subtitleX = state.subtitle.x;
    let subtitleY = state.subtitle.y;

    if (state.resolution === "720x1280") {
      ctx.textAlign = "center";
      subtitleX = width / 2;
      subtitleY = height * 0.75;
    } else {
      ctx.textAlign = "left";
    }

    ctx.fillText(state.subtitle.text.toUpperCase(), subtitleX, subtitleY);
    ctx.restore();
  }

  // Title Drawing
  if (state.title.text) {
    ctx.save();
    ctx.textBaseline = "top";
    // Ensure huge impact styling
    ctx.font = `950 ${state.title.fontSize}px ${state.title.fontFamily}`;
    ctx.fillStyle = state.title.color;

    if (state.title.shadowBlur > 0) {
      ctx.shadowColor = state.title.shadowColor;
      ctx.shadowBlur = state.title.shadowBlur;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
    }

    let titleX = state.title.x;
    let titleY = state.title.y;

    if (state.resolution === "720x1280") {
      ctx.textAlign = "center";
      titleX = width / 2;
      titleY = height * 0.60;
    } else {
      ctx.textAlign = "left";
    }

    // Draw solid text backgrounds (extremely famous youtube clickbait structure!)
    const lines = state.title.text.split("\n");
    let currentY = titleY;

    for (const line of lines) {
      if (line.trim() === "") continue;
      
      const textWidth = ctx.measureText(line).width;
      const textHeight = state.title.fontSize * 1.1;

      // Draw custom highlighted bounding box if active accent
      if (state.pillar === "Archviz + AI") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        if (ctx.textAlign === "center") {
          ctx.fillRect(titleX - textWidth / 2 - 20, currentY - 5, textWidth + 40, textHeight);
        } else {
          ctx.fillRect(titleX - 15, currentY - 5, textWidth + 30, textHeight);
        }
        ctx.fillStyle = state.title.color;
      } else if (state.pillar === "Trading + Systems" || state.pillar === "Vibe Coding") {
        // glowing background line border
        ctx.strokeStyle = state.pillar === "Trading + Systems" ? "#39FF1430" : "#00E5FF30";
        ctx.strokeRect(ctx.textAlign === "center" ? titleX - textWidth / 2 - 10 : titleX - 10, currentY - 2, textWidth + 20, textHeight);
      }

      ctx.fillText(line, titleX, currentY);
      currentY += textHeight + 10;
    }

    ctx.restore();
  }
}
