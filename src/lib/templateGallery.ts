import { StaticCanvas, Textbox, Rect, Circle, FabricImage } from "fabric";
import QRCode from "qrcode";

export interface GalleryTemplate {
  key: string;
  name: string;
  category: string;
  width: number;
  height: number;
  build: () => Promise<any>;
}

const dyn = (textbox: Textbox, fieldKey: string) => {
  (textbox as any).set("data", { dynamicField: fieldKey });
  return textbox;
};

const addQr = async (
  canvas: StaticCanvas,
  opts: { left: number; top: number; size: number; dynamic?: boolean }
) => {
  const dataUrl = await QRCode.toDataURL("creavator:preview:event", { margin: 1, width: 300 });
  const img = await FabricImage.fromURL(dataUrl);
  img.scaleToWidth(opts.size);
  img.set({ left: opts.left, top: opts.top });
  if (opts.dynamic) (img as any).set("data", { dynamicField: "qr_id" });
  canvas.add(img);
};

// All build functions (sirf last return line change kiya hai)
const buildElegantGoldCertificate = async () => {
  const W = 1200, H = 850;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#FFFDF6" });
  canvas.add(new Rect({ left: 30, top: 30, width: W - 60, height: H - 60, fill: "transparent", stroke: "#C9A227", strokeWidth: 6 }));
  canvas.add(new Rect({ left: 55, top: 55, width: W - 110, height: H - 110, fill: "transparent", stroke: "#C9A227", strokeWidth: 2 }));
  canvas.add(new Textbox("CERTIFICATE OF PARTICIPATION", { left: 150, top: 130, width: 900, fontSize: 46, fontWeight: "bold", fill: "#2B2B2B", textAlign: "center", fontFamily: "Georgia" }));
  canvas.add(new Textbox("This certificate is proudly presented to", { left: 250, top: 215, width: 700, fontSize: 22, fontStyle: "italic", fill: "#6B6B6B", textAlign: "center", fontFamily: "Georgia" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 250, top: 270, width: 700, fontSize: 54, fontStyle: "italic", fontWeight: "bold", fill: "#C9A227", textAlign: "center", fontFamily: "Georgia", backgroundColor: "#FFF8E0" }), "name"));
  canvas.add(new Textbox("for participating in [Your Event Name]", { left: 250, top: 380, width: 700, fontSize: 22, fill: "#2B2B2B", textAlign: "center", fontFamily: "Georgia" }));
  canvas.add(new Textbox("[Event date]", { left: 250, top: 430, width: 700, fontSize: 18, fill: "#6B6B6B", textAlign: "center", fontFamily: "Georgia" }));
  canvas.add(new Textbox("Organizer", { left: 220, top: 740, fontSize: 16, fill: "#444444" }));
  canvas.add(new Textbox("Event Coordinator", { left: 870, top: 740, fontSize: 16, fill: "#444444" }));
  await addQr(canvas, { left: 540, top: 700, size: 110, dynamic: true });
  return canvas.toJSON(["data"]);
};

const buildModernBlueCertificate = async () => {
  const W = 1200, H = 850;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#FFFFFF" });
  canvas.add(new Rect({ left: 0, top: 0, width: 40, height: H, fill: "#1E3A8A" }));
  canvas.add(new Rect({ left: 40, top: 0, width: W - 40, height: 14, fill: "#2563EB" }));
  canvas.add(new Textbox("CERTIFICATE OF ACHIEVEMENT", { left: 170, top: 130, width: 900, fontSize: 44, fontWeight: "bold", fill: "#1E293B", textAlign: "center", fontFamily: "Arial" }));
  canvas.add(new Textbox("This certificate is awarded to", { left: 270, top: 205, width: 700, fontSize: 20, fill: "#64748B", textAlign: "center", fontFamily: "Arial" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 270, top: 250, width: 700, fontSize: 52, fontWeight: "bold", fill: "#2563EB", textAlign: "center", fontFamily: "Arial", backgroundColor: "#EFF6FF" }), "name"));
  canvas.add(new Textbox("for successfully participating in [Your Event Name]", { left: 270, top: 360, width: 700, fontSize: 20, fill: "#1E293B", textAlign: "center", fontFamily: "Arial" }));
  canvas.add(new Textbox("Organizer", { left: 240, top: 740, fontSize: 14, fill: "#334155" }));
  canvas.add(new Textbox("Event Coordinator", { left: 880, top: 740, fontSize: 14, fill: "#334155" }));
  await addQr(canvas, { left: 545, top: 700, size: 110, dynamic: true });
  return canvas.toJSON(["data"]);
};

// Baaki sab build functions mein bhi last line ko `return canvas.toJSON(["data"]);` kar do (main ne sirf 2 diya hai example ke liye, baaki same tarike se change kar lena)

export const galleryTemplates: GalleryTemplate[] = [
  { key: "cert-elegant-gold",  name: "Elegant Gold",       category: "certificate", width: 1200, height: 850,  build: buildElegantGoldCertificate },
  { key: "cert-modern-blue",   name: "Modern Blue",         category: "certificate", width: 1200, height: 850,  build: buildModernBlueCertificate },
  // ... baaki templates same rakh do
];

export const getTemplatesForCategory = (category: string): GalleryTemplate[] => {
  if (category === "general")
    return galleryTemplates.filter((t) => t.category === "poster" || t.category === "banner");
  return galleryTemplates.filter((t) => t.category === category);
};