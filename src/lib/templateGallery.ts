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

// QR placeholder — during bulk generate, designerHelpers replaces this with
// real per-participant QR encoding "creavator:participantId:eventId"
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

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

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
  return (canvas as any).toJSON(["data"]);
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
  return (canvas as any).toJSON(["data"]);
};

// ─────────────────────────────────────────────────────────────────────────────
// ID CARD TEMPLATES  (1011 × 638 — standard CR80 landscape)
// Each QR encodes "creavator:participantId:eventId" for attendance verification
// ─────────────────────────────────────────────────────────────────────────────

// 1 ── Classic Blue Badge
const buildClassicBlueIdCard = async () => {
  const W = 1011, H = 638;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#FFFFFF" });
  canvas.add(new Rect({ left: 0, top: 0, width: W, height: 140, fill: "#1E3A8A" }));
  canvas.add(new Textbox("EVENT NAME", { left: 40, top: 32, width: 500, fontSize: 30, fontWeight: "bold", fill: "#FFFFFF", fontFamily: "Arial" }));
  canvas.add(new Textbox("Participant Pass", { left: 40, top: 82, width: 400, fontSize: 16, fill: "#DBEAFE", fontFamily: "Arial" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 40, top: 185, width: 610, fontSize: 38, fontWeight: "bold", fill: "#1E293B", fontFamily: "Arial" }), "name"));
  canvas.add(dyn(new Textbox("{{Organization}}", { left: 40, top: 248, width: 610, fontSize: 20, fill: "#475569", fontFamily: "Arial" }), "organization"));
  canvas.add(dyn(new Textbox("{{Category}}", { left: 40, top: 286, width: 400, fontSize: 18, fill: "#2563EB", fontFamily: "Arial" }), "category"));
  canvas.add(dyn(new Textbox("{{Email}}", { left: 40, top: 325, width: 610, fontSize: 15, fill: "#64748B", fontFamily: "Arial" }), "email"));
  await addQr(canvas, { left: 755, top: 165, size: 195, dynamic: true });
  canvas.add(new Rect({ left: 0, top: H - 55, width: W, height: 55, fill: "#1E3A8A" }));
  canvas.add(new Textbox("Scan QR at entry for attendance verification", { left: 40, top: H - 38, width: 600, fontSize: 13, fill: "#DBEAFE", fontFamily: "Arial" }));
  return (canvas as any).toJSON(["data"]);
};

// 2 ── Elegant Gold Badge
const buildElegantGoldIdCard = async () => {
  const W = 1011, H = 638;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#FFFDF6" });
  canvas.add(new Rect({ left: 0, top: 0, width: W, height: H, fill: "transparent", stroke: "#C9A227", strokeWidth: 8 }));
  canvas.add(new Rect({ left: 0, top: 0, width: W, height: 125, fill: "#C9A227" }));
  canvas.add(new Textbox("EVENT BADGE", { left: 40, top: 28, width: 600, fontSize: 34, fontWeight: "bold", fill: "#FFFDF6", fontFamily: "Georgia" }));
  canvas.add(new Textbox("Official Participant", { left: 40, top: 76, width: 400, fontSize: 16, fontStyle: "italic", fill: "#FFF8E0", fontFamily: "Georgia" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 40, top: 175, width: 610, fontSize: 40, fontWeight: "bold", fontStyle: "italic", fill: "#2B2B2B", fontFamily: "Georgia", backgroundColor: "#FFF8E0" }), "name"));
  canvas.add(dyn(new Textbox("{{Organization}}", { left: 40, top: 250, width: 610, fontSize: 20, fill: "#6B6B6B", fontFamily: "Georgia" }), "organization"));
  canvas.add(dyn(new Textbox("{{Category}}", { left: 40, top: 290, width: 400, fontSize: 18, fill: "#C9A227", fontFamily: "Georgia" }), "category"));
  canvas.add(dyn(new Textbox("{{Email}}", { left: 40, top: 330, width: 610, fontSize: 14, fill: "#888888", fontFamily: "Georgia" }), "email"));
  await addQr(canvas, { left: 760, top: 168, size: 188, dynamic: true });
  canvas.add(new Rect({ left: 0, top: H - 55, width: W, height: 55, fill: "#C9A227" }));
  canvas.add(new Textbox("Scan QR at entry for attendance verification", { left: 40, top: H - 38, width: 600, fontSize: 13, fill: "#FFFDF6", fontFamily: "Georgia" }));
  return (canvas as any).toJSON(["data"]);
};

// 3 ── Modern Dark Badge
const buildModernDarkIdCard = async () => {
  const W = 1011, H = 638;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#0F172A" });
  canvas.add(new Rect({ left: 0, top: 0, width: 10, height: H, fill: "#F9BB1E" }));
  canvas.add(new Rect({ left: 10, top: 0, width: W - 10, height: 105, fill: "#1E293B" }));
  canvas.add(new Textbox("CREAVATOR EVENT", { left: 40, top: 22, width: 550, fontSize: 28, fontWeight: "bold", fill: "#F9BB1E", fontFamily: "Arial" }));
  canvas.add(new Textbox("Official ID Card", { left: 40, top: 64, width: 300, fontSize: 15, fill: "#94A3B8", fontFamily: "Arial" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 40, top: 160, width: 580, fontSize: 40, fontWeight: "bold", fill: "#F1F5F9", fontFamily: "Arial" }), "name"));
  canvas.add(dyn(new Textbox("{{Organization}}", { left: 40, top: 225, width: 580, fontSize: 20, fill: "#94A3B8", fontFamily: "Arial" }), "organization"));
  canvas.add(dyn(new Textbox("{{Category}}", { left: 40, top: 262, width: 400, fontSize: 18, fill: "#F9BB1E", fontFamily: "Arial" }), "category"));
  canvas.add(dyn(new Textbox("{{Email}}", { left: 40, top: 300, width: 580, fontSize: 14, fill: "#64748B", fontFamily: "Arial" }), "email"));
  canvas.add(new Rect({ left: 748, top: 150, width: 220, height: 220, fill: "#FFFFFF", rx: 8, ry: 8 }));
  await addQr(canvas, { left: 758, top: 160, size: 200, dynamic: true });
  canvas.add(new Rect({ left: 10, top: H - 55, width: W - 10, height: 55, fill: "#1E293B" }));
  canvas.add(new Textbox("Scan QR at entry for attendance verification", { left: 40, top: H - 38, width: 600, fontSize: 13, fill: "#64748B", fontFamily: "Arial" }));
  return (canvas as any).toJSON(["data"]);
};

// 4 ── Nature Green Badge
const buildNatureGreenIdCard = async () => {
  const W = 1011, H = 638;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#F0FDF4" });
  canvas.add(new Rect({ left: 0, top: 0, width: 200, height: H, fill: "#065F46" }));
  canvas.add(new Circle({ left: 100, top: 0, radius: 80, fill: "#10B981", opacity: 0.25 }));
  canvas.add(new Circle({ left: 60, top: 460, radius: 110, fill: "#10B981", opacity: 0.18 }));
  canvas.add(new Textbox("EVENT", { left: 10, top: 82, width: 180, fontSize: 22, fontWeight: "bold", fill: "#FFFFFF", textAlign: "center", fontFamily: "Arial" }));
  canvas.add(new Textbox("BADGE", { left: 10, top: 112, width: 180, fontSize: 22, fontWeight: "bold", fill: "#6EE7B7", textAlign: "center", fontFamily: "Arial" }));
  canvas.add(new Rect({ left: 200, top: 0, width: W - 200, height: 8, fill: "#10B981" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 230, top: 78, width: 530, fontSize: 38, fontWeight: "bold", fill: "#064E3B", fontFamily: "Georgia" }), "name"));
  canvas.add(dyn(new Textbox("{{Organization}}", { left: 230, top: 148, width: 530, fontSize: 20, fill: "#047857", fontFamily: "Georgia" }), "organization"));
  canvas.add(dyn(new Textbox("{{Category}}", { left: 230, top: 188, width: 400, fontSize: 18, fill: "#065F46", fontFamily: "Georgia" }), "category"));
  canvas.add(dyn(new Textbox("{{Email}}", { left: 230, top: 228, width: 530, fontSize: 14, fill: "#6B7280", fontFamily: "Georgia" }), "email"));
  await addQr(canvas, { left: 760, top: 265, size: 165, dynamic: true });
  canvas.add(new Rect({ left: 200, top: H - 55, width: W - 200, height: 55, fill: "#065F46" }));
  canvas.add(new Textbox("Scan QR at entry for attendance verification", { left: 230, top: H - 38, width: 550, fontSize: 13, fill: "#6EE7B7", fontFamily: "Arial" }));
  return (canvas as any).toJSON(["data"]);
};

// 5 ── Royal Purple Badge
const buildRoyalPurpleIdCard = async () => {
  const W = 1011, H = 638;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#FAF5FF" });
  canvas.add(new Rect({ left: 0, top: 0, width: W, height: 132, fill: "#6D28D9" }));
  canvas.add(new Rect({ left: 0, top: 132, width: W, height: 6, fill: "#A78BFA" }));
  canvas.add(new Textbox("PARTICIPANT ID CARD", { left: 40, top: 32, width: 600, fontSize: 28, fontWeight: "bold", fill: "#FFFFFF", fontFamily: "Arial" }));
  canvas.add(new Textbox("Official Access Pass", { left: 40, top: 78, width: 400, fontSize: 16, fill: "#C4B5FD", fontFamily: "Arial" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 40, top: 192, width: 620, fontSize: 38, fontWeight: "bold", fill: "#4C1D95", fontFamily: "Arial", backgroundColor: "#EDE9FE" }), "name"));
  canvas.add(dyn(new Textbox("{{Organization}}", { left: 40, top: 258, width: 620, fontSize: 20, fill: "#5B21B6", fontFamily: "Arial" }), "organization"));
  canvas.add(dyn(new Textbox("{{Category}}", { left: 40, top: 296, width: 400, fontSize: 18, fill: "#7C3AED", fontFamily: "Arial" }), "category"));
  canvas.add(dyn(new Textbox("{{Email}}", { left: 40, top: 335, width: 620, fontSize: 14, fill: "#7C3AED", fontFamily: "Arial" }), "email"));
  canvas.add(new Rect({ left: 747, top: 188, width: 224, height: 224, fill: "#EDE9FE", rx: 12, ry: 12, stroke: "#A78BFA", strokeWidth: 3 }));
  await addQr(canvas, { left: 757, top: 198, size: 204, dynamic: true });
  canvas.add(new Rect({ left: 0, top: H - 55, width: W, height: 55, fill: "#6D28D9" }));
  canvas.add(new Textbox("Scan QR at entry for attendance verification", { left: 40, top: H - 38, width: 600, fontSize: 13, fill: "#C4B5FD", fontFamily: "Arial" }));
  return (canvas as any).toJSON(["data"]);
};

// 6 ── Crimson Red Badge
const buildCrimsonRedIdCard = async () => {
  const W = 1011, H = 638;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#FFFBFB" });
  canvas.add(new Rect({ left: 0, top: 0, width: W, height: H, fill: "transparent", stroke: "#991B1B", strokeWidth: 6 }));
  canvas.add(new Rect({ left: 0, top: 0, width: W, height: 118, fill: "#991B1B" }));
  canvas.add(new Rect({ left: 0, top: 118, width: W, height: 5, fill: "#EF4444" }));
  canvas.add(new Textbox("EVENT PASS", { left: 40, top: 28, width: 600, fontSize: 32, fontWeight: "bold", fill: "#FFFFFF", fontFamily: "Georgia" }));
  canvas.add(new Textbox("Official Participant Badge", { left: 40, top: 74, width: 400, fontSize: 15, fontStyle: "italic", fill: "#FECACA", fontFamily: "Georgia" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 40, top: 178, width: 620, fontSize: 40, fontWeight: "bold", fill: "#7F1D1D", fontFamily: "Georgia" }), "name"));
  canvas.add(dyn(new Textbox("{{Organization}}", { left: 40, top: 248, width: 620, fontSize: 20, fill: "#991B1B", fontFamily: "Georgia" }), "organization"));
  canvas.add(dyn(new Textbox("{{Category}}", { left: 40, top: 288, width: 400, fontSize: 18, fill: "#B91C1C", fontFamily: "Georgia" }), "category"));
  canvas.add(dyn(new Textbox("{{Email}}", { left: 40, top: 328, width: 620, fontSize: 14, fill: "#9CA3AF", fontFamily: "Georgia" }), "email"));
  canvas.add(new Rect({ left: 750, top: 165, width: 210, height: 210, fill: "#FEF2F2", rx: 6, ry: 6, stroke: "#FECACA", strokeWidth: 2 }));
  await addQr(canvas, { left: 758, top: 173, size: 193, dynamic: true });
  canvas.add(new Rect({ left: 0, top: H - 55, width: W, height: 55, fill: "#991B1B" }));
  canvas.add(new Textbox("Scan QR at entry for attendance verification", { left: 40, top: H - 38, width: 600, fontSize: 13, fill: "#FECACA", fontFamily: "Arial" }));
  return (canvas as any).toJSON(["data"]);
};

// 7 ── Teal Wave Badge
const buildTealWaveIdCard = async () => {
  const W = 1011, H = 638;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#F0FDFA" });
  canvas.add(new Rect({ left: 0, top: 0, width: W, height: 118, fill: "#0F766E" }));
  canvas.add(new Rect({ left: 0, top: 118, width: W, height: 5, fill: "#14B8A6" }));
  canvas.add(new Rect({ left: 0, top: 123, width: 8, height: H - 123, fill: "#14B8A6" }));
  canvas.add(new Textbox("PARTICIPANT BADGE", { left: 40, top: 28, width: 600, fontSize: 28, fontWeight: "bold", fill: "#FFFFFF", fontFamily: "Arial" }));
  canvas.add(new Textbox("Official Access Card", { left: 40, top: 74, width: 350, fontSize: 15, fill: "#CCFBF1", fontFamily: "Arial" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 40, top: 180, width: 620, fontSize: 38, fontWeight: "bold", fill: "#134E4A", fontFamily: "Arial" }), "name"));
  canvas.add(dyn(new Textbox("{{Organization}}", { left: 40, top: 248, width: 620, fontSize: 20, fill: "#0F766E", fontFamily: "Arial" }), "organization"));
  canvas.add(dyn(new Textbox("{{Category}}", { left: 40, top: 286, width: 400, fontSize: 18, fill: "#14B8A6", fontFamily: "Arial" }), "category"));
  canvas.add(dyn(new Textbox("{{Email}}", { left: 40, top: 325, width: 620, fontSize: 14, fill: "#6B7280", fontFamily: "Arial" }), "email"));
  canvas.add(new Rect({ left: 750, top: 158, width: 210, height: 210, fill: "#CCFBF1", rx: 8, ry: 8 }));
  await addQr(canvas, { left: 758, top: 166, size: 193, dynamic: true });
  canvas.add(new Rect({ left: 0, top: H - 55, width: W, height: 55, fill: "#0F766E" }));
  canvas.add(new Textbox("Scan QR at entry for attendance verification", { left: 40, top: H - 38, width: 600, fontSize: 13, fill: "#CCFBF1", fontFamily: "Arial" }));
  return (canvas as any).toJSON(["data"]);
};

// 8 ── Rose Gold Badge
const buildRoseGoldIdCard = async () => {
  const W = 1011, H = 638;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#FFF1F2" });
  canvas.add(new Rect({ left: 0, top: 0, width: W, height: H, fill: "transparent", stroke: "#E11D48", strokeWidth: 5 }));
  canvas.add(new Rect({ left: 0, top: 0, width: W, height: 118, fill: "#E11D48" }));
  canvas.add(new Circle({ left: W - 80, top: -40, radius: 120, fill: "#FB7185", opacity: 0.3 }));
  canvas.add(new Textbox("PARTICIPANT CARD", { left: 40, top: 25, width: 620, fontSize: 28, fontWeight: "bold", fill: "#FFFFFF", fontFamily: "Georgia" }));
  canvas.add(new Textbox("Official Event Badge", { left: 40, top: 70, width: 380, fontSize: 15, fontStyle: "italic", fill: "#FECDD3", fontFamily: "Georgia" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 40, top: 178, width: 620, fontSize: 40, fontWeight: "bold", fontStyle: "italic", fill: "#881337", fontFamily: "Georgia" }), "name"));
  canvas.add(dyn(new Textbox("{{Organization}}", { left: 40, top: 248, width: 620, fontSize: 20, fill: "#BE123C", fontFamily: "Georgia" }), "organization"));
  canvas.add(dyn(new Textbox("{{Category}}", { left: 40, top: 286, width: 400, fontSize: 18, fill: "#E11D48", fontFamily: "Georgia" }), "category"));
  canvas.add(dyn(new Textbox("{{Email}}", { left: 40, top: 326, width: 620, fontSize: 14, fill: "#9CA3AF", fontFamily: "Georgia" }), "email"));
  canvas.add(new Rect({ left: 752, top: 162, width: 210, height: 210, fill: "#FFF1F2", rx: 8, ry: 8, stroke: "#FDA4AF", strokeWidth: 2 }));
  await addQr(canvas, { left: 760, top: 170, size: 193, dynamic: true });
  canvas.add(new Rect({ left: 0, top: H - 55, width: W, height: 55, fill: "#E11D48" }));
  canvas.add(new Textbox("Scan QR at entry for attendance verification", { left: 40, top: H - 38, width: 600, fontSize: 13, fill: "#FECDD3", fontFamily: "Arial" }));
  return (canvas as any).toJSON(["data"]);
};

// 9 ── Minimalist White Badge
const buildMinimalistWhiteIdCard = async () => {
  const W = 1011, H = 638;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#FFFFFF" });
  canvas.add(new Rect({ left: 0, top: 0, width: W, height: H, fill: "transparent", stroke: "#111827", strokeWidth: 4 }));
  canvas.add(new Rect({ left: 20, top: 20, width: W - 40, height: 3, fill: "#111827" }));
  canvas.add(new Rect({ left: 20, top: H - 23, width: W - 40, height: 3, fill: "#111827" }));
  canvas.add(new Textbox("I D   C A R D", { left: 40, top: 50, width: 600, fontSize: 18, fill: "#111827", fontFamily: "Arial", letterSpacing: 8 }));
  canvas.add(new Rect({ left: 40, top: 80, width: 200, height: 2, fill: "#E5E7EB" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 40, top: 150, width: 620, fontSize: 44, fontStyle: "italic", fill: "#111827", fontFamily: "Georgia" }), "name"));
  canvas.add(dyn(new Textbox("{{Organization}}", { left: 40, top: 228, width: 620, fontSize: 20, fill: "#6B7280", fontFamily: "Arial" }), "organization"));
  canvas.add(dyn(new Textbox("{{Category}}", { left: 40, top: 265, width: 400, fontSize: 17, fill: "#374151", fontFamily: "Arial" }), "category"));
  canvas.add(dyn(new Textbox("{{Email}}", { left: 40, top: 302, width: 620, fontSize: 14, fill: "#9CA3AF", fontFamily: "Arial" }), "email"));
  canvas.add(new Rect({ left: 752, top: 140, width: 214, height: 214, fill: "#F9FAFB", rx: 4, ry: 4, stroke: "#E5E7EB", strokeWidth: 1 }));
  await addQr(canvas, { left: 760, top: 148, size: 197, dynamic: true });
  canvas.add(new Textbox("Scan QR at entry for attendance verification", { left: 40, top: H - 48, width: 650, fontSize: 12, fill: "#9CA3AF", fontFamily: "Arial" }));
  return (canvas as any).toJSON(["data"]);
};

// 10 ── Navy & Orange Badge
const buildNavyOrangeIdCard = async () => {
  const W = 1011, H = 638;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#0F172A" });
  canvas.add(new Rect({ left: 0, top: 0, width: W, height: H, fill: "transparent", stroke: "#F97316", strokeWidth: 5 }));
  canvas.add(new Rect({ left: 0, top: 0, width: 220, height: H, fill: "#1E293B" }));
  canvas.add(new Rect({ left: 220, top: 0, width: 5, height: H, fill: "#F97316" }));
  canvas.add(new Circle({ left: 60, top: -30, radius: 100, fill: "#F97316", opacity: 0.12 }));
  canvas.add(new Circle({ left: 100, top: 540, radius: 120, fill: "#F97316", opacity: 0.10 }));
  canvas.add(new Textbox("EVENT", { left: 10, top: 80, width: 200, fontSize: 22, fontWeight: "bold", fill: "#F97316", textAlign: "center", fontFamily: "Arial" }));
  canvas.add(new Textbox("ID CARD", { left: 10, top: 110, width: 200, fontSize: 22, fontWeight: "bold", fill: "#FFFFFF", textAlign: "center", fontFamily: "Arial" }));
  canvas.add(dyn(new Textbox("{{Name}}", { left: 250, top: 60, width: 620, fontSize: 38, fontWeight: "bold", fill: "#F1F5F9", fontFamily: "Arial" }), "name"));
  canvas.add(dyn(new Textbox("{{Organization}}", { left: 250, top: 130, width: 620, fontSize: 20, fill: "#94A3B8", fontFamily: "Arial" }), "organization"));
  canvas.add(dyn(new Textbox("{{Category}}", { left: 250, top: 168, width: 400, fontSize: 18, fill: "#F97316", fontFamily: "Arial" }), "category"));
  canvas.add(dyn(new Textbox("{{Email}}", { left: 250, top: 206, width: 620, fontSize: 14, fill: "#64748B", fontFamily: "Arial" }), "email"));
  canvas.add(new Rect({ left: 635, top: 270, width: 335, height: 280, fill: "transparent" }));
  canvas.add(new Rect({ left: 648, top: 282, width: 310, height: 215, fill: "#1E293B", rx: 8, ry: 8 }));
  await addQr(canvas, { left: 656, top: 290, size: 295, dynamic: true });
  canvas.add(new Textbox("Scan QR at entry for attendance verification", { left: 250, top: H - 48, width: 600, fontSize: 12, fill: "#475569", fontFamily: "Arial" }));
  return (canvas as any).toJSON(["data"]);
};

// ─────────────────────────────────────────────────────────────────────────────
// POSTER & BANNER
// ─────────────────────────────────────────────────────────────────────────────

const buildSimplePoster = async () => {
  const W = 900, H = 1200;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#0F172A" });
  canvas.add(new Textbox("YOUR EVENT NAME", { left: 60, top: 420, width: 780, fontSize: 60, fontWeight: "bold", fill: "#F9BB1E", textAlign: "center", fontFamily: "Arial" }));
  canvas.add(new Textbox("Tagline goes here", { left: 60, top: 520, width: 780, fontSize: 28, fill: "#E2E8F0", textAlign: "center", fontFamily: "Arial" }));
  canvas.add(new Textbox("Date · Venue", { left: 60, top: 1080, width: 780, fontSize: 22, fill: "#94A3B8", textAlign: "center", fontFamily: "Arial" }));
  return (canvas as any).toJSON(["data"]);
};

const buildSimpleBanner = async () => {
  const W = 1200, H = 400;
  const canvas = new StaticCanvas(document.createElement("canvas"), { width: W, height: H, backgroundColor: "#F9BB1E" });
  canvas.add(new Textbox("YOUR EVENT NAME", { left: 60, top: 130, width: 1080, fontSize: 56, fontWeight: "bold", fill: "#1E293B", textAlign: "center", fontFamily: "Arial" }));
  canvas.add(new Textbox("Date · Venue · Time", { left: 60, top: 230, width: 1080, fontSize: 24, fill: "#1E293B", textAlign: "center", fontFamily: "Arial" }));
  return (canvas as any).toJSON(["data"]);
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const galleryTemplates: GalleryTemplate[] = [
  // Certificates
  { key: "cert-elegant-gold",  name: "Elegant Gold",       category: "certificate", width: 1200, height: 850,  build: buildElegantGoldCertificate },
  { key: "cert-modern-blue",   name: "Modern Blue",         category: "certificate", width: 1200, height: 850,  build: buildModernBlueCertificate },
  // ID Cards — 10 templates
  { key: "idcard-classic-blue",    name: "Classic Blue",        category: "id_card", width: 1011, height: 638, build: buildClassicBlueIdCard },
  { key: "idcard-elegant-gold",    name: "Elegant Gold",        category: "id_card", width: 1011, height: 638, build: buildElegantGoldIdCard },
  { key: "idcard-modern-dark",     name: "Modern Dark",         category: "id_card", width: 1011, height: 638, build: buildModernDarkIdCard },
  { key: "idcard-nature-green",    name: "Nature Green",        category: "id_card", width: 1011, height: 638, build: buildNatureGreenIdCard },
  { key: "idcard-royal-purple",    name: "Royal Purple",        category: "id_card", width: 1011, height: 638, build: buildRoyalPurpleIdCard },
  { key: "idcard-crimson-red",     name: "Crimson Red",         category: "id_card", width: 1011, height: 638, build: buildCrimsonRedIdCard },
  { key: "idcard-teal-wave",       name: "Teal Wave",           category: "id_card", width: 1011, height: 638, build: buildTealWaveIdCard },
  { key: "idcard-rose-gold",       name: "Rose Gold",           category: "id_card", width: 1011, height: 638, build: buildRoseGoldIdCard },
  { key: "idcard-minimalist",      name: "Minimalist White",    category: "id_card", width: 1011, height: 638, build: buildMinimalistWhiteIdCard },
  { key: "idcard-navy-orange",     name: "Navy & Orange",       category: "id_card", width: 1011, height: 638, build: buildNavyOrangeIdCard },
  // Poster & Banner
  { key: "poster-simple",      name: "Dark Poster",         category: "poster",      width: 900,  height: 1200, build: buildSimplePoster },
  { key: "banner-simple",      name: "Bold Banner",         category: "banner",      width: 1200, height: 400,  build: buildSimpleBanner },
];

export const getTemplatesForCategory = (category: string): GalleryTemplate[] => {
  if (category === "general")
    return galleryTemplates.filter((t) => t.category === "poster" || t.category === "banner");
  return galleryTemplates.filter((t) => t.category === category);
};