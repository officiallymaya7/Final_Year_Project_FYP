import { Canvas, Rect, Circle, Textbox, FabricImage, Triangle } from "fabric";
import type { PackageBrandKit, DesignCategoryKey } from "./designPackages";

export interface CanvasDims { width: number; height: number }

export const CATEGORY_DIMS: Record<DesignCategoryKey, CanvasDims> = {
  certificate: { width: 1200, height: 850 },
  id_card: { width: 1011, height: 638 },
  poster: { width: 1200, height: 1697 },
  banner: { width: 1600, height: 500 },
  flyer: { width: 1200, height: 1697 },
  social_post: { width: 1080, height: 1080 },
  invitation: { width: 1000, height: 1400 },
  standee: { width: 800, height: 2000 },
  backdrop: { width: 1920, height: 1080 },
};

// ── Contrast helper: never let text disappear into its background ──────────
const getContrastColor = (hex: string): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#111111" : "#FFFFFF";
};

const nonInteractive = { selectable: false, evented: false, hoverCursor: "default" };

// ── Decorative pattern, confined to a given rectangular zone ───────────────
const drawPatternInZone = (
  canvas: Canvas,
  pattern: PackageBrandKit["pattern"],
  color: string,
  x: number, y: number, w: number, h: number
) => {
  if (pattern === "none") return;
  const add = (obj: any) => canvas.add(obj);

  if (pattern === "dots") {
    const gap = 34;
    for (let dy = y + gap / 2; dy < y + h; dy += gap) {
      for (let dx = x + gap / 2; dx < x + w; dx += gap) {
        add(new Circle({ left: dx, top: dy, radius: 2, fill: color, opacity: 0.35, ...nonInteractive }));
      }
    }
  } else if (pattern === "diagonal") {
    for (let i = x - h; i < x + w; i += 46) {
      add(new Rect({ left: i, top: y, width: 10, height: h * 1.6, fill: color, opacity: 0.14, angle: 22, ...nonInteractive }));
    }
  } else if (pattern === "geometric") {
    add(new Circle({ left: x + w - 140, top: y - 90, radius: 170, fill: color, opacity: 0.18, ...nonInteractive }));
    add(new Rect({ left: x - 60, top: y + h - 160, width: 180, height: 180, angle: 45, fill: color, opacity: 0.14, ...nonInteractive }));
    add(new Triangle({ left: x + w * 0.7, top: y + h - 60, width: 90, height: 90, fill: color, opacity: 0.16, angle: 15, ...nonInteractive }));
  } else if (pattern === "waves") {
    for (let i = 0; i < 4; i++) {
      add(new Circle({
        left: x - 80 + i * 50, top: y + h - 60 - i * 26, radius: 200, fill: "transparent",
        stroke: color, strokeWidth: 3, opacity: 0.25, ...nonInteractive,
      }));
    }
  }
};

// ── Dashed "add your photo" placeholder — visually signals an editable image slot ──
const addPhotoPlaceholder = (canvas: Canvas, x: number, y: number, w: number, h: number, accent: string) => {
  canvas.add(new Rect({
    left: x, top: y, width: w, height: h, fill: "#F3F4F6",
    stroke: accent, strokeWidth: 2, strokeDashArray: [10, 8], rx: 12, ry: 12, ...nonInteractive,
  }));
  canvas.add(new Circle({ left: x + w / 2 - 26, top: y + h / 2 - 40, radius: 26, fill: accent, opacity: 0.25, ...nonInteractive }));
  canvas.add(new Textbox("📷  Click 'Add Image' to insert a photo here", {
    left: x + 24, top: y + h / 2 + 12, width: w - 48, fontSize: Math.max(14, w * 0.022),
    fill: "#9CA3AF", textAlign: "center", fontFamily: "Arial", ...nonInteractive,
  }));
};

const label = (canvas: Canvas, text: string, x: number, y: number, w: number, size: number, color: string, font: string, bold = false, align: "left" | "center" = "left") => {
  canvas.add(new Textbox(text, {
    left: x, top: y, width: w, fontSize: size, fontFamily: font, fontWeight: bold ? "bold" : "normal",
    fill: color, textAlign: align,
  }));
};

/**
 * Renders a fully branded, layout-rich composition. Re-run on init AND every
 * brand-kit change (colors/fonts/logo/pattern) — this is the sync engine.
 */
export const renderBrandedLayout = async (
  canvas: Canvas,
  category: DesignCategoryKey,
  brand: PackageBrandKit,
  eventName: string,
  headline: string
) => {
  canvas.clear();
  const { width: w, height: h } = CATEGORY_DIMS[category];
  const headingFont = brand.font_heading;
  const bodyFont = brand.font_body;
  const onPrimary = getContrastColor(brand.primary_color);
  const onSecondary = getContrastColor(brand.secondary_color);
  canvas.backgroundColor = "#FFFFFF";

  const addLogo = async (x: number, y: number, size: number) => {
    if (!brand.logo_url) return;
    try {
      const img = await FabricImage.fromURL(brand.logo_url, { crossOrigin: "anonymous" });
      img.scaleToHeight(size);
      img.set({ left: x, top: y });
      canvas.add(img);
    } catch (_) { /* ignore broken logo url */ }
  };

  // ─────────────────────────────────────────────────────────────────────
  if (category === "banner") {
    // Left colored panel (logo + event name) | Right white area with big headline + photo slot
    const panelW = w * 0.34;
    canvas.add(new Rect({ left: 0, top: 0, width: panelW, height: h, fill: brand.primary_color, ...nonInteractive }));
    drawPatternInZone(canvas, brand.pattern, brand.accent_color, 0, 0, panelW, h);
    canvas.add(new Rect({ left: panelW - 8, top: 0, width: 8, height: h, fill: brand.accent_color, ...nonInteractive }));
    await addLogo(40, 40, 60);
    label(canvas, eventName || "Event Name", 40, h - 130, panelW - 80, 30, onPrimary, headingFont, true);
    label(canvas, "presents", 40, h - 92, panelW - 80, 16, onPrimary, bodyFont);

    addPhotoPlaceholder(canvas, panelW + 40, 40, w - panelW - 80, h - 80, brand.accent_color);
    label(canvas, headline, panelW + 60, 40, w - panelW - 120, 44, "#111111", headingFont, true);

  // ─────────────────────────────────────────────────────────────────────
  } else if (category === "poster" || category === "flyer" || category === "standee") {
    // Top: photo area | Bottom: colored info panel with headline, event name, accent bar
    const photoH = Math.round(h * 0.55);
    addPhotoPlaceholder(canvas, 0, 0, w, photoH, brand.accent_color);
    canvas.add(new Rect({ left: 0, top: photoH, width: w, height: h - photoH, fill: brand.primary_color, ...nonInteractive }));
    drawPatternInZone(canvas, brand.pattern, brand.accent_color, 0, photoH, w, h - photoH);
    canvas.add(new Rect({ left: 0, top: photoH, width: w, height: 10, fill: brand.accent_color, ...nonInteractive }));

    await addLogo(40, photoH + 30, 56);
    label(canvas, eventName || "Event Name", 40, photoH + 100, w - 80, Math.round(w * 0.032), onPrimary, bodyFont);
    label(canvas, headline, 40, photoH + 140, w - 80, Math.round(w * 0.065), onPrimary, headingFont, true);
    canvas.add(new Rect({ left: 40, top: h - 60, width: 120, height: 6, fill: brand.accent_color, ...nonInteractive }));

  // ─────────────────────────────────────────────────────────────────────
  } else if (category === "social_post") {
    // Centered card with badge, headline, accent underline, logo bottom
    canvas.add(new Rect({ left: 0, top: 0, width: w, height: h, fill: brand.primary_color, ...nonInteractive }));
    drawPatternInZone(canvas, brand.pattern, brand.accent_color, 0, 0, w, h);
    canvas.add(new Rect({ left: w * 0.08, top: h * 0.08, width: w * 0.84, height: h * 0.84, fill: "transparent", stroke: brand.accent_color, strokeWidth: 3, rx: 24, ry: 24, ...nonInteractive }));

    canvas.add(new Rect({ left: w * 0.5 - 90, top: h * 0.16, width: 180, height: 40, fill: brand.accent_color, rx: 20, ry: 20, ...nonInteractive }));
    label(canvas, (eventName || "EVENT").toUpperCase(), w * 0.5 - 90, h * 0.16 + 9, 180, 16, getContrastColor(brand.accent_color), bodyFont, true, "center");

    label(canvas, headline, w * 0.12, h * 0.38, w * 0.76, Math.round(w * 0.075), onPrimary, headingFont, true, "center");
    canvas.add(new Rect({ left: w * 0.5 - 50, top: h * 0.62, width: 100, height: 5, fill: brand.accent_color, ...nonInteractive }));
    await addLogo(w * 0.5 - 30, h * 0.86, 46);

  // ─────────────────────────────────────────────────────────────────────
  } else if (category === "invitation") {
    // Elegant bordered frame, centered ornamental layout
    canvas.add(new Rect({ left: 0, top: 0, width: w, height: h, fill: "#FFFDF8", ...nonInteractive }));
    drawPatternInZone(canvas, brand.pattern, brand.primary_color, 0, 0, w, h);
    canvas.add(new Rect({ left: 30, top: 30, width: w - 60, height: h - 60, fill: "transparent", stroke: brand.primary_color, strokeWidth: 3, ...nonInteractive }));
    canvas.add(new Rect({ left: 44, top: 44, width: w - 88, height: h - 88, fill: "transparent", stroke: brand.accent_color, strokeWidth: 1, ...nonInteractive }));

    await addLogo(w / 2 - 30, 90, 60);
    label(canvas, "YOU ARE CORDIALLY INVITED TO", w * 0.15, 190, w * 0.7, 18, brand.secondary_color, bodyFont, false, "center");
    label(canvas, eventName || "Event Name", w * 0.1, 230, w * 0.8, Math.round(w * 0.07), brand.primary_color, headingFont, true, "center");
    canvas.add(new Rect({ left: w / 2 - 60, top: 340, width: 120, height: 3, fill: brand.accent_color, ...nonInteractive }));
    label(canvas, headline, w * 0.15, 390, w * 0.7, 22, "#374151", bodyFont, false, "center");

    addPhotoPlaceholder(canvas, w * 0.2, h * 0.5, w * 0.6, h * 0.32, brand.accent_color);
    label(canvas, "Date · Time · Venue", w * 0.15, h - 110, w * 0.7, 18, brand.secondary_color, bodyFont, false, "center");

  // ─────────────────────────────────────────────────────────────────────
  } else if (category === "backdrop") {
    // Wide stage backdrop: repeated logo/pattern field + large central headline
    canvas.add(new Rect({ left: 0, top: 0, width: w, height: h, fill: brand.primary_color, ...nonInteractive }));
    drawPatternInZone(canvas, brand.pattern, brand.accent_color, 0, 0, w, h);
    canvas.add(new Rect({ left: w / 2 - 420, top: h / 2 - 130, width: 840, height: 260, fill: brand.secondary_color, opacity: 0.9, rx: 16, ry: 16, ...nonInteractive }));
    await addLogo(w / 2 - 40, h / 2 - 100, 60);
    label(canvas, eventName || "Event Name", w / 2 - 380, h / 2 - 20, 760, Math.round(w * 0.032), onSecondary, headingFont, true, "center");
    label(canvas, headline, w / 2 - 380, h / 2 + 40, 760, 20, onSecondary, bodyFont, false, "center");

  // ─────────────────────────────────────────────────────────────────────
  } else {
    // Fallback generic layout
    canvas.add(new Rect({ left: 0, top: 0, width: w, height: h, fill: brand.primary_color, ...nonInteractive }));
    drawPatternInZone(canvas, brand.pattern, brand.accent_color, 0, 0, w, h);
    label(canvas, headline, w * 0.1, h * 0.45, w * 0.8, Math.round(w * 0.06), onPrimary, headingFont, true, "center");
  }

  canvas.renderAll();
};