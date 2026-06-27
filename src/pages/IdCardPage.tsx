import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Loader2, CheckCircle2, Download, RefreshCw,
  Type, Square, Circle as CircleIcon, Image as ImageIcon, Trash2, Copy,
  ChevronsUp, ChevronsDown, Wand2, Lock,
} from "lucide-react";
import { Canvas, StaticCanvas, Textbox, Rect, Circle, FabricImage } from "fabric";
import QRCode from "qrcode";
import JSZip from "jszip";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  category?: string;
}

interface GenerateResult {
  participantId: string;
  participantName: string;
  fileUrl: string;
}

interface IdCardTemplate {
  key: string;
  name: string;
  accentColor: string;
  // build() is used for previews and editor — always uses placeholder data
  build: (sampleName?: string) => Promise<any>;
  // buildForParticipant() is used for generation — injects real participant data
  buildForParticipant: (p: Participant, qrPayload: string) => Promise<any>;
  width: number;
  height: number;
}

// ─── QR helpers ──────────────────────────────────────────────────────────────
const encodeQr = (participantId: string, eventId: string) =>
  JSON.stringify({ participantId, eventId });

const makeQrDataUrl = (payload: string): Promise<string> =>
  QRCode.toDataURL(payload, { margin: 1, width: 400, color: { dark: "#000000", light: "#ffffff" } });

// ─── Mark a Fabric object as a dynamic field ──────────────────────────────────
const dyn = (obj: any, fieldKey: string) => {
  obj.set("data", { dynamicField: fieldKey, locked: true });
  return obj;
};

// ─── Core template builder ────────────────────────────────────────────────────
// participantData: when provided, real values are used. When null, placeholders shown.
const W = 1011, H = 638;

interface ParticipantData {
  name: string;
  organization?: string;
  category?: string;
  email?: string;
  qrDataUrl: string;
}

const buildTemplateCanvas = async (
  bg: string,
  headerColor: string,
  accentColor: string,
  textColor: string,
  subColor: string,
  _footerColor: string,
  footerText: string,
  qrBg: string,
  headerTitle: string,
  headerSub: string,
  layoutStyle: "left-panel" | "top-bar" | "full-dark",
  data: ParticipantData,
  isPreview: boolean,
): Promise<any> => {
  const canvasEl = document.createElement("canvas");
  canvasEl.width = W;
  canvasEl.height = H;

  const sc = new StaticCanvas(canvasEl, { width: W, height: H, backgroundColor: bg });

  const nameText  = data.name;
  const orgText   = isPreview ? "{{Organization}}" : (data.organization ?? "");
  const catText   = isPreview ? "{{Category}}"     : (data.category     ?? "");
  const emailText = isPreview ? "{{Email}}"        : (data.email        ?? "");

  if (layoutStyle === "top-bar") {
    sc.add(new Rect({ left: 0, top: 0, width: W, height: 130, fill: headerColor }));
    sc.add(new Rect({ left: 0, top: 130, width: W, height: 6, fill: accentColor }));
    sc.add(new Textbox(headerTitle, { left: 36, top: 26, width: 620, fontSize: 26, fontWeight: "bold", fill: "#FFFFFF", fontFamily: "Arial" }));
    sc.add(new Textbox(headerSub,   { left: 36, top: 70, width: 450, fontSize: 14, fill: footerText, fontFamily: "Arial" }));
    sc.add(dyn(new Textbox(nameText,  { left: 36, top: 185, width: 640, fontSize: 40, fontWeight: "bold", fill: textColor, fontFamily: "Arial" }), "name"));
    sc.add(dyn(new Textbox(orgText,   { left: 36, top: 255, width: 640, fontSize: 18, fill: subColor, fontFamily: "Arial" }), "organization"));
    sc.add(dyn(new Textbox(catText,   { left: 36, top: 292, width: 400, fontSize: 16, fill: accentColor, fontFamily: "Arial" }), "category"));
    sc.add(dyn(new Textbox(emailText, { left: 36, top: 330, width: 640, fontSize: 13, fill: subColor, fontFamily: "Arial" }), "email"));
    sc.add(new Rect({ left: 750, top: 155, width: 220, height: 220, fill: qrBg, rx: 8, ry: 8 }));
    const qrImg = await FabricImage.fromURL(data.qrDataUrl, { crossOrigin: "anonymous" });
    qrImg.scaleToWidth(200);
    qrImg.set({ left: 760, top: 165 });
    dyn(qrImg, "qr_id");
    sc.add(qrImg);
    sc.add(new Rect({ left: 0, top: H - 52, width: W, height: 52, fill: headerColor }));
    sc.add(new Textbox("Scan QR at entry for attendance verification", { left: 36, top: H - 36, width: 600, fontSize: 12, fill: footerText, fontFamily: "Arial" }));

  } else if (layoutStyle === "left-panel") {
    sc.add(new Rect({ left: 0, top: 0, width: 195, height: H, fill: headerColor }));
    sc.add(new Rect({ left: 195, top: 0, width: W - 195, height: 7, fill: accentColor }));
    sc.add(new Rect({ left: 195, top: 0, width: 7, height: H, fill: accentColor }));
    sc.add(new Textbox(headerTitle, { left: 8, top: 82, width: 178, fontSize: 20, fontWeight: "bold", fill: "#FFFFFF", textAlign: "center", fontFamily: "Arial" }));
    sc.add(new Textbox(headerSub,   { left: 8, top: 115, width: 178, fontSize: 12, fill: footerText, textAlign: "center", fontFamily: "Arial" }));
    sc.add(dyn(new Textbox(nameText,  { left: 222, top: 78,  width: 555, fontSize: 36, fontWeight: "bold", fill: textColor, fontFamily: "Arial" }), "name"));
    sc.add(dyn(new Textbox(orgText,   { left: 222, top: 148, width: 555, fontSize: 18, fill: subColor, fontFamily: "Arial" }), "organization"));
    sc.add(dyn(new Textbox(catText,   { left: 222, top: 185, width: 400, fontSize: 16, fill: accentColor, fontFamily: "Arial" }), "category"));
    sc.add(dyn(new Textbox(emailText, { left: 222, top: 223, width: 555, fontSize: 13, fill: subColor, fontFamily: "Arial" }), "email"));
    sc.add(new Rect({ left: 630, top: 262, width: 185, height: 185, fill: qrBg, rx: 6, ry: 6 }));
    const qrImg = await FabricImage.fromURL(data.qrDataUrl, { crossOrigin: "anonymous" });
    qrImg.scaleToWidth(168);
    qrImg.set({ left: 638, top: 270 });
    dyn(qrImg, "qr_id");
    sc.add(qrImg);
    sc.add(new Rect({ left: 202, top: H - 52, width: W - 202, height: 52, fill: headerColor }));
    sc.add(new Textbox("Scan QR at entry for attendance verification", { left: 222, top: H - 36, width: 550, fontSize: 12, fill: footerText, fontFamily: "Arial" }));

  } else {
    // full-dark
    sc.add(new Rect({ left: 0, top: 0, width: 10, height: H, fill: accentColor }));
    sc.add(new Rect({ left: 10, top: 0, width: W - 10, height: 105, fill: headerColor }));
    sc.add(new Textbox(headerTitle, { left: 38, top: 20, width: 580, fontSize: 26, fontWeight: "bold", fill: accentColor, fontFamily: "Arial" }));
    sc.add(new Textbox(headerSub,   { left: 38, top: 62, width: 380, fontSize: 14, fill: subColor, fontFamily: "Arial" }));
    sc.add(dyn(new Textbox(nameText,  { left: 38, top: 162, width: 600, fontSize: 38, fontWeight: "bold", fill: textColor, fontFamily: "Arial" }), "name"));
    sc.add(dyn(new Textbox(orgText,   { left: 38, top: 228, width: 600, fontSize: 18, fill: subColor, fontFamily: "Arial" }), "organization"));
    sc.add(dyn(new Textbox(catText,   { left: 38, top: 265, width: 400, fontSize: 16, fill: accentColor, fontFamily: "Arial" }), "category"));
    sc.add(dyn(new Textbox(emailText, { left: 38, top: 303, width: 600, fontSize: 13, fill: subColor, fontFamily: "Arial" }), "email"));
    sc.add(new Rect({ left: 752, top: 148, width: 216, height: 216, fill: qrBg, rx: 8, ry: 8 }));
    const qrImg = await FabricImage.fromURL(data.qrDataUrl, { crossOrigin: "anonymous" });
    qrImg.scaleToWidth(196);
    qrImg.set({ left: 762, top: 158 });
    dyn(qrImg, "qr_id");
    sc.add(qrImg);
    sc.add(new Rect({ left: 10, top: H - 52, width: W - 10, height: 52, fill: headerColor }));
    sc.add(new Textbox("Scan QR at entry for attendance verification", { left: 38, top: H - 36, width: 600, fontSize: 12, fill: subColor, fontFamily: "Arial" }));
  }

  sc.renderAll();
  const json = (sc as any).toJSON(["data"]);
  sc.dispose();
  return json;
};

// ─── Convenience wrappers ─────────────────────────────────────────────────────
// Preview / editor: passes sampleName as the display name, uses a dummy QR
const makePreviewBuilder =
  (bg: string, hc: string, ac: string, tc: string, sc2: string, fc: string, ft: string,
   qrBg: string, ht: string, hs: string, layout: "left-panel" | "top-bar" | "full-dark") =>
  async (sampleName = "Participant Name") => {
    const qrUrl = await makeQrDataUrl(encodeQr("preview", "preview"));
    return buildTemplateCanvas(bg, hc, ac, tc, sc2, fc, ft, qrBg, ht, hs, layout,
      { name: sampleName, organization: "{{Organization}}", category: "{{Category}}", email: "{{Email}}", qrDataUrl: qrUrl },
      true);
  };

// Generation: injects real participant data and a unique QR
const makeParticipantBuilder =
  (bg: string, hc: string, ac: string, tc: string, sc2: string, fc: string, ft: string,
   qrBg: string, ht: string, hs: string, layout: "left-panel" | "top-bar" | "full-dark") =>
  async (p: Participant, qrPayload: string) => {
    const qrUrl = await makeQrDataUrl(qrPayload);
    return buildTemplateCanvas(bg, hc, ac, tc, sc2, fc, ft, qrBg, ht, hs, layout,
      { name: p.name, organization: p.organization, category: p.category, email: p.email, qrDataUrl: qrUrl },
      false);
  };

// ─── Templates ────────────────────────────────────────────────────────────────
const ID_CARD_TEMPLATES: IdCardTemplate[] = [
  { key: "classic-blue",  name: "Classic Blue",     accentColor: "#2563EB", width: W, height: H,
    build: makePreviewBuilder("#FFFFFF","#1E3A8A","#2563EB","#1E293B","#475569","#1E3A8A","#DBEAFE","#EFF6FF","EVENT NAME","Official Participant Pass","top-bar"),
    buildForParticipant: makeParticipantBuilder("#FFFFFF","#1E3A8A","#2563EB","#1E293B","#475569","#1E3A8A","#DBEAFE","#EFF6FF","EVENT NAME","Official Participant Pass","top-bar") },
  { key: "elegant-gold",  name: "Elegant Gold",     accentColor: "#C9A227", width: W, height: H,
    build: makePreviewBuilder("#FFFDF6","#C9A227","#A37C10","#2B2B2B","#6B6B6B","#C9A227","#FFF8E0","#FFFDF6","EVENT BADGE","Official Participant","top-bar"),
    buildForParticipant: makeParticipantBuilder("#FFFDF6","#C9A227","#A37C10","#2B2B2B","#6B6B6B","#C9A227","#FFF8E0","#FFFDF6","EVENT BADGE","Official Participant","top-bar") },
  { key: "modern-dark",   name: "Modern Dark",      accentColor: "#F9BB1E", width: W, height: H,
    build: makePreviewBuilder("#0F172A","#1E293B","#F9BB1E","#F1F5F9","#94A3B8","#1E293B","#64748B","#1E293B","CREAVATOR EVENT","Official ID Card","full-dark"),
    buildForParticipant: makeParticipantBuilder("#0F172A","#1E293B","#F9BB1E","#F1F5F9","#94A3B8","#1E293B","#64748B","#1E293B","CREAVATOR EVENT","Official ID Card","full-dark") },
  { key: "nature-green",  name: "Nature Green",     accentColor: "#10B981", width: W, height: H,
    build: makePreviewBuilder("#F0FDF4","#065F46","#10B981","#064E3B","#047857","#065F46","#6EE7B7","#CCFBF1","EVENT","BADGE","left-panel"),
    buildForParticipant: makeParticipantBuilder("#F0FDF4","#065F46","#10B981","#064E3B","#047857","#065F46","#6EE7B7","#CCFBF1","EVENT","BADGE","left-panel") },
  { key: "royal-purple",  name: "Royal Purple",     accentColor: "#A78BFA", width: W, height: H,
    build: makePreviewBuilder("#FAF5FF","#6D28D9","#A78BFA","#4C1D95","#5B21B6","#6D28D9","#C4B5FD","#EDE9FE","PARTICIPANT ID","Official Access Pass","top-bar"),
    buildForParticipant: makeParticipantBuilder("#FAF5FF","#6D28D9","#A78BFA","#4C1D95","#5B21B6","#6D28D9","#C4B5FD","#EDE9FE","PARTICIPANT ID","Official Access Pass","top-bar") },
  { key: "crimson-red",   name: "Crimson Red",      accentColor: "#EF4444", width: W, height: H,
    build: makePreviewBuilder("#FFFBFB","#991B1B","#EF4444","#7F1D1D","#991B1B","#991B1B","#FECACA","#FEF2F2","EVENT PASS","Official Participant Badge","top-bar"),
    buildForParticipant: makeParticipantBuilder("#FFFBFB","#991B1B","#EF4444","#7F1D1D","#991B1B","#991B1B","#FECACA","#FEF2F2","EVENT PASS","Official Participant Badge","top-bar") },
  { key: "teal-wave",     name: "Teal Wave",        accentColor: "#14B8A6", width: W, height: H,
    build: makePreviewBuilder("#F0FDFA","#0F766E","#14B8A6","#134E4A","#0F766E","#0F766E","#CCFBF1","#CCFBF1","PARTICIPANT BADGE","Official Access Card","top-bar"),
    buildForParticipant: makeParticipantBuilder("#F0FDFA","#0F766E","#14B8A6","#134E4A","#0F766E","#0F766E","#CCFBF1","#CCFBF1","PARTICIPANT BADGE","Official Access Card","top-bar") },
  { key: "rose-gold",     name: "Rose Gold",        accentColor: "#FB7185", width: W, height: H,
    build: makePreviewBuilder("#FFF1F2","#E11D48","#FB7185","#881337","#BE123C","#E11D48","#FECDD3","#FFF1F2","PARTICIPANT CARD","Official Event Badge","top-bar"),
    buildForParticipant: makeParticipantBuilder("#FFF1F2","#E11D48","#FB7185","#881337","#BE123C","#E11D48","#FECDD3","#FFF1F2","PARTICIPANT CARD","Official Event Badge","top-bar") },
  { key: "minimalist",    name: "Minimalist White", accentColor: "#111827", width: W, height: H,
    build: makePreviewBuilder("#FFFFFF","#111827","#374151","#111827","#6B7280","#111827","#9CA3AF","#F3F4F6","I D  C A R D","Official Pass","top-bar"),
    buildForParticipant: makeParticipantBuilder("#FFFFFF","#111827","#374151","#111827","#6B7280","#111827","#9CA3AF","#F3F4F6","I D  C A R D","Official Pass","top-bar") },
  { key: "navy-orange",   name: "Navy & Orange",    accentColor: "#F97316", width: W, height: H,
    build: makePreviewBuilder("#0F172A","#1E293B","#F97316","#F1F5F9","#94A3B8","#1E293B","#94A3B8","#1E293B","EVENT","ID CARD","left-panel"),
    buildForParticipant: makeParticipantBuilder("#0F172A","#1E293B","#F97316","#F1F5F9","#94A3B8","#1E293B","#94A3B8","#1E293B","EVENT","ID CARD","left-panel") },
];

// ─── Template Preview ─────────────────────────────────────────────────────────
const TemplatePreview = ({ template, sampleName }: { template: IdCardTemplate; sampleName: string }) => {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDataUrl("");

    (async () => {
      try {
        const json = await template.build(sampleName);
        const el = document.createElement("canvas");
        el.width = template.width;
        el.height = template.height;
        const sc = new StaticCanvas(el, { width: template.width, height: template.height });
        await sc.loadFromJSON(json);
        sc.renderAll();
        const url = sc.toDataURL({ format: "png", multiplier: 0.5 });
        sc.dispose();
        if (!cancelled) { setDataUrl(url); setLoading(false); }
      } catch (e) {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [template.key, sampleName]);

  if (loading) return (
    <div className="w-full aspect-[1011/638] rounded-xl border border-border bg-muted/30 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <img src={dataUrl} alt={template.name}
      className="w-full h-auto rounded-xl border border-border shadow-sm" />
  );
};

// ─── Template Gallery ─────────────────────────────────────────────────────────
const TemplateGallery = ({
  participants, onSelect,
}: {
  participants: Participant[];
  onSelect: (t: IdCardTemplate) => void;
}) => {
  const sampleName = participants[0]?.name || "Participant Name";

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">Choose a Template</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select a design to customise, then generate ID cards for all {participants.length} participant{participants.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ID_CARD_TEMPLATES.map(t => (
            <div key={t.key}
              className="group cursor-pointer rounded-xl border border-border bg-card hover:border-violet-400 hover:shadow-md transition-all"
              onClick={() => onSelect(t)}>
              <div className="p-3">
                <TemplatePreview template={t} sampleName={sampleName} />
              </div>
              <div className="px-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.accentColor }} />
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); onSelect(t); }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-violet-700">
                  Use this
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Editor ───────────────────────────────────────────────────────────────────
const IdCardEditor = ({
  template, participants, eventId, onBack, onDone,
}: {
  template: IdCardTemplate;
  participants: Participant[];
  eventId: string;
  eventName: string;
  listName: string;
  dayNumber: number;
  onBack: () => void;
  onDone: (results: GenerateResult[]) => void;
}) => {
  const canvasElRef    = useRef<HTMLCanvasElement>(null);
  const fabricRef      = useRef<Canvas | null>(null);
  const wrapperRef     = useRef<HTMLDivElement>(null);
  // Tracks only user-added decorative objects (never includes locked/dynamic ones)
  const userAddedRef   = useRef<any[]>([]);
  const [activeObj, setActiveObj]       = useState<any>(null);
  const [zoom, setZoom]                 = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress]         = useState({ done: 0, total: 0 });
  const [rightTab, setRightTab]         = useState<"style" | "participants">("style");
  const [canvasReady, setCanvasReady]   = useState(false);

  const sampleName = participants[0]?.name || "Participant Name";

  // ── Init Fabric Canvas ───────────────────────────────────────────────────
  useEffect(() => {
    let canvas: Canvas | null = null;

    const init = async () => {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (!canvasElRef.current) return;

      try {
        canvas = new Canvas(canvasElRef.current, {
          width: template.width,
          height: template.height,
          backgroundColor: "#ffffff",
        });
        fabricRef.current = canvas;

        const json = await template.build(sampleName);
        await canvas.loadFromJSON(json);

        canvas.getObjects().forEach(obj => {
          const d = (obj as any).data;
          if (d?.locked || d?.dynamicField) {
            obj.set({ selectable: false, evented: false, hoverCursor: "not-allowed" });
          }
        });

        canvas.on("selection:created", (e: any) => setActiveObj(e.selected?.[0] || null));
        canvas.on("selection:updated", (e: any) => setActiveObj(e.selected?.[0] || null));
        canvas.on("selection:cleared", ()        => setActiveObj(null));
        // Reset user-added objects tracking when canvas initialises
        userAddedRef.current = [];
        canvas.renderAll();

        const availW = (wrapperRef.current?.clientWidth || 900) - 48;
        const availH = window.innerHeight - 130;
        setZoom(Math.min(availW / template.width, availH / template.height, 1));
        setCanvasReady(true);
      } catch (err) {
        console.error("Fabric init error:", err);
      }
    };

    init();
    return () => { try { canvas?.dispose(); } catch (_) {} };
  }, []);

  // ── Toolbar actions ──────────────────────────────────────────────────────
  const addText = () => {
    const c = fabricRef.current; if (!c) return;
    const t = new Textbox("Your text here", { left: 80, top: 80, fontSize: 24, fill: "#1f2937", width: 220 });
    c.add(t); c.setActiveObject(t); c.renderAll();
    userAddedRef.current.push(t);
  };
  const addRect = () => {
    const c = fabricRef.current; if (!c) return;
    const r = new Rect({ left: 60, top: 60, width: 160, height: 80, fill: template.accentColor, opacity: 0.8 });
    c.add(r); c.setActiveObject(r); c.renderAll();
    userAddedRef.current.push(r);
  };
  const addCircle = () => {
    const c = fabricRef.current; if (!c) return;
    const ci = new Circle({ left: 60, top: 60, radius: 48, fill: template.accentColor, opacity: 0.8 });
    c.add(ci); c.setActiveObject(ci); c.renderAll();
    userAddedRef.current.push(ci);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      const img = await FabricImage.fromURL(evt.target?.result as string, { crossOrigin: "anonymous" });
      img.scaleToWidth(180); img.set({ left: 80, top: 80 });
      fabricRef.current?.add(img); fabricRef.current?.setActiveObject(img); fabricRef.current?.renderAll();
      userAddedRef.current.push(img);
    };
    reader.readAsDataURL(file); e.target.value = "";
  };
  const deleteSelected = () => {
    const c = fabricRef.current; if (!c) return;
    const toRemove = c.getActiveObjects().filter(o => !(o as any).data?.locked && !(o as any).data?.dynamicField);
    toRemove.forEach(o => {
      c.remove(o);
      // Remove from userAddedRef too
      userAddedRef.current = userAddedRef.current.filter(u => u !== o);
    });
    c.discardActiveObject(); c.renderAll(); setActiveObj(null);
  };
  const duplicateSelected = async () => {
    const c = fabricRef.current; const obj = c?.getActiveObject();
    if (!c || !obj || (obj as any).data?.locked) return;
    const cl = await (obj as any).clone(["data"]);
    cl.set({ left: (obj.left || 0) + 18, top: (obj.top || 0) + 18 });
    c.add(cl); c.setActiveObject(cl); c.renderAll();
  };
  const bringForward = () => {
    const c = fabricRef.current; const o = c?.getActiveObject();
    if (c && o) { (c as any).bringObjectForward(o); c.renderAll(); }
  };
  const sendBackward = () => {
    const c = fabricRef.current; const o = c?.getActiveObject();
    if (c && o) { (c as any).sendObjectBackwards(o); c.renderAll(); }
  };
  const handleColorChange    = (color: string) => { const o = fabricRef.current?.getActiveObject(); if (!o) return; o.set("fill", color); fabricRef.current?.renderAll(); };
  const handleFontSizeChange = (size: number)  => { const o = fabricRef.current?.getActiveObject() as any; if (!o) return; o.set("fontSize", size); fabricRef.current?.renderAll(); };
  const handleBgColor        = (color: string) => { const c = fabricRef.current; if (!c) return; c.backgroundColor = color; c.renderAll(); };

  // ── Bulk generate ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const canvas = fabricRef.current; if (!canvas) return;
    setIsGenerating(true);
    setProgress({ done: 0, total: participants.length });

    // Serialise ONLY user-added objects (tracked explicitly — no dynamic/locked objects possible)
    const tempEl = document.createElement("canvas");
    const tempSc = new StaticCanvas(tempEl, { width: template.width, height: template.height });
    for (const obj of userAddedRef.current) tempSc.add(obj);
    const userJson = (tempSc as any).toJSON(["data"]);
    const userAddedSerialized: any[] = userJson.objects || [];
    tempSc.dispose();

    const bgColor: string = (canvas.backgroundColor as string) || "#ffffff";
    const results: GenerateResult[] = [];

    try {
      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];

        // Build a completely fresh canvas with this participant's real data baked in.
        const qrPayload = encodeQr(p.id || p.name, eventId);
        const participantJson = await template.buildForParticipant(p, qrPayload);

        // Append only the explicitly-tracked user-added decorative objects
        participantJson.objects = [...participantJson.objects, ...userAddedSerialized];
        participantJson.background = bgColor;

        // Render off-screen and export
        const el = document.createElement("canvas");
        el.width  = template.width;
        el.height = template.height;
        const sc = new StaticCanvas(el, { width: template.width, height: template.height });
        await sc.loadFromJSON(participantJson);
        sc.renderAll();

        const dataUrl = sc.toDataURL({ format: "png", multiplier: 2 });
        sc.dispose();

        results.push({ participantId: p.id, participantName: p.name, fileUrl: dataUrl });
        setProgress({ done: i + 1, total: participants.length });
      }

      onDone(results);
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const isLocked = activeObj && ((activeObj as any).data?.locked || (activeObj as any).data?.dynamicField);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left toolbar */}
      <div className="w-14 border-r border-border bg-card flex flex-col items-center gap-1 py-4 shrink-0">
        {[
          { icon: <Type className="h-5 w-5" />,       label: "Add Text",      action: addText },
          { icon: <Square className="h-5 w-5" />,     label: "Add Rectangle", action: addRect },
          { icon: <CircleIcon className="h-5 w-5" />, label: "Add Circle",    action: addCircle },
        ].map(b => (
          <button key={b.label} onClick={b.action} title={b.label}
            className="p-2.5 rounded-lg hover:bg-violet-100/60 hover:text-violet-600 transition-colors text-muted-foreground">
            {b.icon}
          </button>
        ))}
        <div className="relative">
          <input type="file" accept="image/*" onChange={handleImageUpload}
            aria-label="Add image" title="Add image"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          <button title="Add Image" className="p-2.5 rounded-lg hover:bg-violet-100/60 hover:text-violet-600 transition-colors text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="w-8 border-t border-border my-2" />
        <button onClick={duplicateSelected} title="Duplicate"
          className="p-2.5 rounded-lg hover:bg-violet-100/60 hover:text-violet-600 transition-colors text-muted-foreground">
          <Copy className="h-5 w-5" />
        </button>
        <button onClick={bringForward} title="Bring Forward"
          className="p-2.5 rounded-lg hover:bg-violet-100/60 hover:text-violet-600 transition-colors text-muted-foreground">
          <ChevronsUp className="h-5 w-5" />
        </button>
        <button onClick={sendBackward} title="Send Backward"
          className="p-2.5 rounded-lg hover:bg-violet-100/60 hover:text-violet-600 transition-colors text-muted-foreground">
          <ChevronsDown className="h-5 w-5" />
        </button>
        <button onClick={deleteSelected} title="Delete Selected"
          className="p-2.5 rounded-lg hover:bg-red-100/60 hover:text-red-500 transition-colors text-muted-foreground">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Canvas area */}
      <div ref={wrapperRef}
        className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 flex items-start justify-center p-8">
        {!canvasReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        )}
        <div className="shadow-2xl rounded-sm ring-1 ring-black/10"
          style={{
            width: template.width * zoom,
            height: template.height * zoom,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}>
          <canvas ref={canvasElRef} />
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 border-l border-border bg-card flex flex-col shrink-0">
        <div className="flex border-b border-border">
          {(["style", "participants"] as const).map(t => (
            <button key={t} onClick={() => setRightTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                rightTab === t
                  ? "border-b-2 border-violet-500 text-violet-500"
                  : "text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-5">
          {rightTab === "style" ? (
            <>
              <div className="flex items-start gap-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-xl p-3">
                <Lock className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                  <strong>Name</strong>, <strong>fields</strong>, and <strong>QR code</strong> are locked —
                  they auto-fill uniquely per participant during generation.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Canvas</p>
                <div className="flex items-center justify-between">
                  <label htmlFor="bg-color" className="text-sm">Background</label>
                  <input id="bg-color" type="color" defaultValue="#ffffff"
                    onChange={e => handleBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-border" />
                </div>
              </div>

              {activeObj && !isLocked ? (
                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selected Object</p>
                  <div className="flex items-center justify-between">
                    <label htmlFor="obj-color" className="text-sm">Color</label>
                    <input id="obj-color" type="color" defaultValue="#000000"
                      onChange={e => handleColorChange(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-border" />
                  </div>
                  {activeObj.type === "textbox" && (
                    <div className="flex items-center justify-between">
                      <label htmlFor="font-size" className="text-sm">Font Size</label>
                      <input id="font-size" type="number" defaultValue={activeObj.fontSize || 24} min={8} max={120}
                        onChange={e => handleFontSizeChange(Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded-lg border border-border bg-background text-sm text-center" />
                    </div>
                  )}
                </div>
              ) : activeObj && isLocked ? (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <p className="text-xs">Locked — auto-fills during generation.</p>
                  </div>
                </div>
              ) : (
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click any unlocked element to edit it. Use the toolbar to add decorative elements.
                  </p>
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-2">
                <button onClick={handleGenerate} disabled={isGenerating || !canvasReady}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50">
                  {isGenerating
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {progress.done}/{progress.total}</>
                    : <><Wand2 className="h-4 w-4" /> Generate for All {participants.length}</>}
                </button>
                <button onClick={onBack}
                  className="w-full text-xs text-muted-foreground hover:text-foreground text-center py-1">
                  ← Choose a different template
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {participants.length} participants
              </p>
              {participants.map(p => (
                <div key={p.id} className="text-sm px-3 py-2 rounded-lg bg-muted/30 border border-border">
                  <p className="font-medium truncate">{p.name}</p>
                  {p.organization && <p className="text-xs text-muted-foreground truncate">{p.organization}</p>}
                  {p.category     && <p className="text-xs text-violet-500 truncate">{p.category}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Results screen ───────────────────────────────────────────────────────────
const ResultsScreen = ({ results, listName, onBack }: { results: GenerateResult[]; listName: string; onBack: () => void }) => {
  const [isZipping,   setIsZipping]   = useState(false);
  const [zipProgress, setZipProgress] = useState({ done: 0, total: 0 });

  const downloadSingle = async (url: string, name: string) => {
    const blob = await (await fetch(url)).blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}_id_card.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadAll = async () => {
    setIsZipping(true); setZipProgress({ done: 0, total: results.length });
    try {
      const zip = new JSZip();
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const blob = await (await fetch(r.fileUrl)).blob();
        zip.file(`${r.participantName}_id_card.png`, blob);
        setZipProgress({ done: i + 1, total: results.length });
      }
      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `${listName}_id_cards.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("ZIP downloaded!");
    } catch (err: any) {
      toast.error("ZIP failed: " + err.message);
    } finally { setIsZipping(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-emerald-500">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">{results.length} ID cards generated!</span>
        </div>
        <button onClick={downloadAll} disabled={isZipping}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50">
          {isZipping
            ? <><Loader2 className="h-4 w-4 animate-spin" /> {zipProgress.done}/{zipProgress.total}</>
            : <><Download className="h-4 w-4" /> Download All (ZIP)</>}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {results.map(r => (
          <div key={r.participantId} className="bg-card border border-border rounded-xl p-3 hover:border-violet-400/50 transition-colors">
            <img src={r.fileUrl} alt={r.participantName} className="w-full rounded-lg border border-border mb-2" />
            <p className="text-sm font-medium truncate">{r.participantName}</p>
            <button onClick={() => downloadSingle(r.fileUrl, r.participantName)}
              className="mt-2 w-full flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <Download className="h-3 w-3" /> Download
            </button>
          </div>
        ))}
      </div>
      <button onClick={onBack} className="mt-6 flex items-center gap-2 text-sm text-violet-500 hover:underline">
        <RefreshCw className="h-3.5 w-3.5" /> Generate with a different template
      </button>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const IdCardPage = () => {
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const eventId   = params.get("event_id")  || "";
  const listName  = params.get("list_name") || "";
  const dayNumber = parseInt(params.get("day_number") || "1");

  const [eventName,    setEventName]    = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [selected,     setSelected]     = useState<IdCardTemplate | null>(null);
  const [step,         setStep]         = useState<"gallery" | "editor" | "results">("gallery");
  const [results,      setResults]      = useState<GenerateResult[]>([]);

  useEffect(() => {
    if (!eventId || !listName) { setIsLoading(false); return; }
    (async () => {
      setIsLoading(true);
      try {
        const { data: ev } = await supabase.from("events").select("name").eq("id", eventId).single();
        if (ev) setEventName(ev.name);

        const { data: rows, error } = await supabase
          .from("participants")
          .select("id,name,email,phone,organization,category")
          .eq("event_id", eventId)
          .eq("list_name", listName)
          .eq("day_number", dayNumber);
        if (error) throw error;
        setParticipants(rows || []);
      } catch (err: any) {
        toast.error("Failed to load: " + err.message);
      } finally { setIsLoading(false); }
    })();
  }, [eventId, listName, dayNumber]);

  if (!eventId || !listName) return (
    <div className="p-10 text-center">
      <p className="text-destructive font-medium">Missing event or list information.</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-sm text-primary underline">Go Back</button>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );

  const handleTemplateSelect = (t: IdCardTemplate) => { setSelected(t); setStep("editor"); };
  const handleGenerateDone   = (res: GenerateResult[]) => { setResults(res); setStep("results"); };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-foreground">ID Card Generator</h1>
          <p className="text-xs text-muted-foreground">{eventName} — {listName}</p>
        </div>
        {step !== "gallery" && (
          <button onClick={() => setStep("gallery")}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Templates
          </button>
        )}
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground">
          Exit
        </button>
      </header>

      {step === "gallery" && (
        <TemplateGallery participants={participants} onSelect={handleTemplateSelect} />
      )}

      {step === "editor" && selected && (
        <IdCardEditor
          template={selected}
          participants={participants}
          eventId={eventId}
          eventName={eventName}
          listName={listName}
          dayNumber={dayNumber}
          onDone={handleGenerateDone}
          onBack={() => setStep("gallery")}
        />
      )}

      {step === "results" && (
        <ResultsScreen results={results} listName={listName} onBack={() => setStep("editor")} />
      )}
    </div>
  );
};

export default IdCardPage;