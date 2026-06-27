import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Canvas, StaticCanvas, Textbox, Rect, Circle, FabricImage } from "fabric";
import QRCode from "qrcode";
import {
  ArrowLeft, Type, Square, Circle as CircleIcon, Image as ImageIcon, Trash2, Copy,
  ChevronsUp, ChevronsDown, Save, Loader2, Wand2, CheckCircle2, Download, RefreshCw, QrCode,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { generateDesignsForAll, type ParticipantLite, type GenerateResult } from "../lib/designerHelpers";
import { getTemplatesForCategory, type GalleryTemplate } from "../lib/templateGallery";
import { downloadFile, downloadAllAsZip } from "../lib/downloadHelpers";
import { toast } from "sonner";

const SIZE_PRESETS = [
  { label: "ID Card", width: 1011, height: 638 },
  { label: "Certificate", width: 1200, height: 850 },
  { label: "Poster", width: 900, height: 1200 },
  { label: "Banner", width: 1200, height: 400 },
];

const FIELD_OPTIONS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "organization", label: "Organization" },
  { key: "category", label: "Category" },
];

const BLANK_DEFAULTS: Record<string, { w: number; h: number }> = {
  certificate: { w: 1200, h: 850 },
  id_card: { w: 1011, h: 638 },
  poster: { w: 900, h: 1200 },
  banner: { w: 1200, h: 400 },
  general: { w: 800, h: 500 },
};

const GalleryPreview = ({ template }: { template: GalleryTemplate }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let staticCanvas: StaticCanvas | null = null;
    let cancelled = false;
    const render = async () => {
      const json = await template.build();
      if (cancelled || !ref.current) return;
      staticCanvas = new StaticCanvas(ref.current, { width: template.width, height: template.height });
      await staticCanvas.loadFromJSON(json);
      staticCanvas.renderAll();
    };
    render();
    return () => { cancelled = true; staticCanvas?.dispose(); };
  }, [template]);

  return <canvas ref={ref} className="w-full h-auto rounded-lg border border-border" />;
};

const DesigningPortal = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventId = params.get("event_id") || "";
  const listName = params.get("list_name") || "";
  const dayNumber = parseInt(params.get("day_number") || "1");
  const category = params.get("category") || "general";

  const isBulkCategory = category === "certificate" || category === "id_card";
  const moduleLabel =
    category === "id_card" ? "ID Cards" :
    category === "certificate" ? "Certificates" :
    category === "poster" ? "Poster" :
    category === "banner" ? "Banner" : "Designing Portal";

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const pendingJsonRef = useRef<any>(null);

  const [eventName, setEventName] = useState("");
  const [participants, setParticipants] = useState<ParticipantLite[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeObj, setActiveObj] = useState<any>(null);
  const [rightTab, setRightTab] = useState<"style" | "participants">("style");

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<GenerateResult[]>([]);
  const [step, setStep] = useState<"gallery" | "editor" | "results">("gallery");
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState({ done: 0, total: 0 });

  // ── Load event/participants/existing template ─────────────────────────────
  useEffect(() => {
    if (!eventId || !listName) { setIsLoading(false); return; }

    const init = async () => {
      setIsLoading(true);
      try {
        const { data: eventRow } = await supabase.from("events").select("name").eq("id", eventId).single();
        if (eventRow) setEventName(eventRow.name);

        const { data: rows } = await supabase
          .from("participants")
          .select("id, name, email, phone, organization, category")
          .eq("event_id", eventId)
          .eq("list_name", listName)
          .eq("day_number", dayNumber);
        setParticipants(rows || []);

        const { data: tplRow } = await supabase
          .from("design_templates")
          .select("*")
          .eq("event_id", eventId)
          .eq("list_name", listName)
          .eq("day_number", dayNumber)
          .eq("category", category)
          .maybeSingle();

        if (tplRow) {
          setTemplateId(tplRow.id);
          setCanvasSize({ width: tplRow.canvas_width, height: tplRow.canvas_height });
          pendingJsonRef.current = tplRow.canvas_json;
          setStep("editor");
        } else {
          setStep("gallery");
        }
      } catch (err: any) {
        toast.error("Load failed: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [eventId, listName, dayNumber, category]);

  // ── Initialize fabric canvas whenever we enter the editor step ────────────
  useEffect(() => {
    if (step !== "editor" || !canvasElRef.current) return;

    const canvas = new Canvas(canvasElRef.current, {
      width: canvasSize.width, height: canvasSize.height, backgroundColor: "#ffffff",
    });
    fabricCanvasRef.current = canvas;
    canvas.on("selection:created", (e: any) => setActiveObj(e.selected?.[0] || null));
    canvas.on("selection:updated", (e: any) => setActiveObj(e.selected?.[0] || null));
    canvas.on("selection:cleared", () => setActiveObj(null));

    if (pendingJsonRef.current) {
      const json = pendingJsonRef.current;
      pendingJsonRef.current = null;
      canvas.loadFromJSON(json).then(() => canvas.renderAll());
    }

    return () => { canvas.dispose(); fabricCanvasRef.current = null; };
  }, [step, canvasSize.width, canvasSize.height]);

  // ── Gallery actions ────────────────────────────────────────────────────────
  const loadGalleryTemplate = async (tpl: GalleryTemplate) => {
    setIsLoading(true);
    try {
      const json = await tpl.build();
      pendingJsonRef.current = json;
      setCanvasSize({ width: tpl.width, height: tpl.height });
      setStep("editor");
    } catch (err: any) {
      toast.error("Template load failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startBlank = () => {
    const d = BLANK_DEFAULTS[category] || BLANK_DEFAULTS.general;
    pendingJsonRef.current = null;
    setCanvasSize({ width: d.w, height: d.h });
    setStep("editor");
  };

  // ── Toolbar actions ────────────────────────────────────────────────────────
  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const text = new Textbox("Double-click to edit", { left: 80, top: 80, fontSize: 28, fill: "#1f2937", width: 220 });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addDynamicField = (fieldKey: string, label: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const text = new Textbox(`{{${label}}}`, {
      left: 80, top: 130, fontSize: 28, fill: "#1d4ed8", backgroundColor: "#dbeafe", width: 220,
    });
    (text as any).set("data", { dynamicField: fieldKey });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addQrPlaceholder = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    try {
      let qrContent = "";
      let markDynamic = false;
      if (isBulkCategory) {
        qrContent = participants[0]?.id || "sample-participant-id";
        markDynamic = true;
      } else {
        const input = window.prompt("QR code mein kya encode karna hai? (link ya text)", eventName || "");
        if (!input) return;
        qrContent = input;
      }
      const dataUrl = await QRCode.toDataURL(qrContent, { margin: 1, width: 300 });
      const img = await FabricImage.fromURL(dataUrl);
      img.scaleToWidth(150);
      img.set({ left: 60, top: 60 });
      if (markDynamic) (img as any).set("data", { dynamicField: "qr_id" });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      toast.success(markDynamic ? "QR placeholder added — bulk generate ke waqt har participant ka apna QR aa jayega" : "QR code added!");
    } catch (err: any) {
      toast.error("QR add failed: " + err.message);
    }
  };

  const addRect = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const rect = new Rect({ left: 60, top: 60, width: 160, height: 100, fill: "#3b82f6" });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const circle = new Circle({ left: 60, top: 60, radius: 60, fill: "#10b981" });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      const img = await FabricImage.fromURL(dataUrl);
      img.scaleToWidth(220);
      img.set({ left: 100, top: 100 });
      fabricCanvasRef.current?.add(img);
      fabricCanvasRef.current?.setActiveObject(img);
      fabricCanvasRef.current?.renderAll();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.getActiveObjects().forEach((o) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.renderAll();
    setActiveObj(null);
  };

  const duplicateSelected = async () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const cloned = await (obj as any).clone(["data"]);
    cloned.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20 });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.renderAll();
  };

  const bringForward = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) { (canvas as any).bringObjectForward(obj); canvas.renderAll(); }
  };

  const sendBackward = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) { (canvas as any).sendObjectBackwards(obj); canvas.renderAll(); }
  };

  const bringToFront = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) { (canvas as any).bringObjectToFront(obj); canvas.renderAll(); }
  };

  const sendToBack = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) { (canvas as any).sendObjectToBack(obj); canvas.renderAll(); }
  };

  const centerObject = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    canvas.centerObject(obj);
    canvas.renderAll();
  };

  const flipHorizontal = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set("flipX", !obj.flipX);
    canvas.renderAll();
  };

  const flipVertical = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set("flipY", !obj.flipY);
    canvas.renderAll();
  };

  const handleColorChange = (color: string) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set("fill", color);
    canvas.renderAll();
  };

  const handleStrokeColorChange = (color: string) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set("stroke", color);
    canvas.renderAll();
  };

  const handleStrokeWidthChange = (width: number) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set("strokeWidth", width);
    canvas.renderAll();
  };

  const handleCornerRadiusChange = (r: number) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    (obj as any).set({ rx: r, ry: r });
    canvas.renderAll();
  };

  const handleFontSizeChange = (size: number) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    (obj as any).set("fontSize", size);
    canvas.renderAll();
  };

  const toggleBold = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject() as any;
    if (!canvas || !obj) return;
    obj.set("fontWeight", obj.fontWeight === "bold" ? "normal" : "bold");
    canvas.renderAll();
    setActiveObj({ ...obj });
  };

  const toggleItalic = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject() as any;
    if (!canvas || !obj) return;
    obj.set("fontStyle", obj.fontStyle === "italic" ? "normal" : "italic");
    canvas.renderAll();
    setActiveObj({ ...obj });
  };

  const toggleUnderline = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject() as any;
    if (!canvas || !obj) return;
    obj.set("underline", !obj.underline);
    canvas.renderAll();
    setActiveObj({ ...obj });
  };

  const handleBgColorChange = (color: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.backgroundColor = color;
    canvas.renderAll();
  };

  const applyPreset = (w: number, h: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.setDimensions({ width: w, height: h });
    setCanvasSize({ width: w, height: h });
    canvas.renderAll();
  };

  // ── Save / Generate / Download ─────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    setIsSaving(true);
    try {
      const json = canvas.toJSON(["data"]);
      const { data, error } = await supabase
        .from("design_templates")
        .upsert(
          {
            event_id: eventId, list_name: listName, day_number: dayNumber, category,
            canvas_width: canvasSize.width, canvas_height: canvasSize.height,
            canvas_json: json, updated_at: new Date().toISOString(),
          },
          { onConflict: "event_id,list_name,day_number,category" }
        )
        .select()
        .single();
      if (error) throw error;
      setTemplateId(data.id);
      toast.success("Design saved!");
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAll = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    if (participants.length === 0) { toast.error("Is list mein abhi koi participant nahi hai"); return; }
    setIsGenerating(true);
    setProgress({ done: 0, total: participants.length });
    try {
      const json = canvas.toJSON(["data"]);
      const { data: saved, error: saveErr } = await supabase
        .from("design_templates")
        .upsert(
          {
            event_id: eventId, list_name: listName, day_number: dayNumber, category,
            canvas_width: canvasSize.width, canvas_height: canvasSize.height,
            canvas_json: json, updated_at: new Date().toISOString(),
          },
          { onConflict: "event_id,list_name,day_number,category" }
        )
        .select()
        .single();
      if (saveErr) throw saveErr;
      setTemplateId(saved.id);

      const res = await generateDesignsForAll({
        templateId: saved.id,
        category,
        canvasJson: json,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        participants,
        eventId,
        listName,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setResults(res);
      setStep("results");
      toast.success(`${res.length} ${moduleLabel.toLowerCase()} generated!`);
    } catch (err: any) {
      toast.error("Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSingle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${listName || eventName || "design"}_${category}.png`;
    a.click();
    toast.success("Design downloaded!");
  };

  const handleDownloadAllZip = async () => {
    if (results.length === 0) return;
    setIsZipping(true);
    setZipProgress({ done: 0, total: results.length });
    try {
      await downloadAllAsZip(
        results.map((r) => ({ url: r.fileUrl, filename: `${r.participantName}_${category}.png` })),
        `${listName}_${category}.zip`,
        (done, total) => setZipProgress({ done, total })
      );
    } catch (err: any) {
      toast.error("Zip download failed: " + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  if (!eventId || !listName) {
    return (
      <div className="p-10 text-center">
        <p className="text-destructive font-medium">Missing event or list information.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-primary underline">Go Back</button>
      </div>
    );
  }

  const galleryOptions = getTemplatesForCategory(category);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="text-center">
          <h1 className="font-bold text-[#F9BB1E]">{moduleLabel} — {listName}</h1>
          <p className="text-xs text-muted-foreground">{eventName} · {participants.length} participants</p>
        </div>
        {step === "editor" ? (
          <div className="flex items-center gap-2">
            {galleryOptions.length > 0 && (
              <button onClick={() => setStep("gallery")} className="text-xs text-muted-foreground hover:text-foreground underline">
                Change template
              </button>
            )}
            <button onClick={handleSaveTemplate} disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors disabled:opacity-50">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
            {isBulkCategory ? (
              <button onClick={handleGenerateAll} disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isGenerating
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> {progress.done}/{progress.total}</>
                  : <><Wand2 className="h-4 w-4" /> Generate for All</>}
              </button>
            ) : (
              <button onClick={handleDownloadSingle}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <Download className="h-4 w-4" /> Download Design
              </button>
            )}
          </div>
        ) : <div className="w-24" />}
      </div>

      {step === "gallery" ? (
        <div className="p-6 max-w-5xl mx-auto w-full">
          <h2 className="text-lg font-semibold mb-4">Choose a starting template</h2>
          {isLoading ? (
            <div className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {galleryOptions.map((tpl) => (
                <div key={tpl.key} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 transition-colors">
                  <GalleryPreview template={tpl} />
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-semibold">{tpl.name}</span>
                    <button onClick={() => loadGalleryTemplate(tpl)}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                      Use this Template
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-card border border-dashed border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center min-h-[200px]">
                <p className="text-sm text-muted-foreground mb-3">Sab kuch khud se banayein</p>
                <button onClick={startBlank} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
                  Blank Canvas
                </button>
              </div>
            </div>
          )}
        </div>
      ) : step === "results" ? (
        <div className="p-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-4 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">{results.length} {moduleLabel.toLowerCase()} generated and saved!</span>
          </div>
          <div className="flex justify-end mb-3">
            <button onClick={handleDownloadAllZip} disabled={isZipping}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isZipping
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Zipping {zipProgress.done}/{zipProgress.total}</>
                : <><Download className="h-4 w-4" /> Download All (ZIP)</>}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {results.map((r) => (
              <div key={r.participantId} className="bg-card border border-border rounded-xl p-3">
                <img src={r.fileUrl} alt={r.participantName} className="w-full rounded-lg border border-border mb-2" />
                <p className="text-sm font-medium truncate">{r.participantName}</p>
                <button onClick={() => downloadFile(r.fileUrl, `${r.participantName}_${category}.png`)}
                  className="mt-2 w-full flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <Download className="h-3 w-3" /> Download
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => setStep("editor")} className="mt-6 flex items-center gap-2 text-sm text-primary hover:underline">
            <RefreshCw className="h-3.5 w-3.5" /> Back to Editor
          </button>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left toolbar */}
          <div className="w-16 border-r border-border bg-card flex flex-col items-center gap-2 py-4">
            <button onClick={addText} title="Add Text" className="p-2.5 rounded-lg hover:bg-muted/60 transition-colors"><Type className="h-5 w-5" /></button>
            <button onClick={addRect} title="Add Rectangle" className="p-2.5 rounded-lg hover:bg-muted/60 transition-colors"><Square className="h-5 w-5" /></button>
            <button onClick={addCircle} title="Add Circle" className="p-2.5 rounded-lg hover:bg-muted/60 transition-colors"><CircleIcon className="h-5 w-5" /></button>
            <div className="relative">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Upload image" />
              <button title="Add Image" className="p-2.5 rounded-lg hover:bg-muted/60 transition-colors"><ImageIcon className="h-5 w-5" /></button>
            </div>
            <button onClick={addQrPlaceholder} title="Add QR Code" className="p-2.5 rounded-lg hover:bg-muted/60 transition-colors text-primary"><QrCode className="h-5 w-5" /></button>
            <div className="w-8 border-t border-border my-1" />
            <button onClick={duplicateSelected} title="Duplicate" className="p-2.5 rounded-lg hover:bg-muted/60 transition-colors"><Copy className="h-5 w-5" /></button>
            <button onClick={bringForward} title="Bring Forward" className="p-2.5 rounded-lg hover:bg-muted/60 transition-colors"><ChevronsUp className="h-5 w-5" /></button>
            <button onClick={sendBackward} title="Send Backward" className="p-2.5 rounded-lg hover:bg-muted/60 transition-colors"><ChevronsDown className="h-5 w-5" /></button>
            <button onClick={deleteSelected} title="Delete" className="p-2.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-5 w-5" /></button>
          </div>

          {/* Canvas area */}
          <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-8">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="shadow-2xl">
                <canvas ref={canvasElRef} />
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="w-72 border-l border-border bg-card flex flex-col">
            <div className="flex border-b border-border">
              <button onClick={() => setRightTab("style")}
                className={`flex-1 py-2.5 text-sm font-medium ${rightTab === "style" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
                Style
              </button>
              <button onClick={() => setRightTab("participants")}
                className={`flex-1 py-2.5 text-sm font-medium ${rightTab === "participants" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
                Participants
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {rightTab === "style" ? (
                <div className="space-y-5">
                  {isBulkCategory && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Insert Participant Field</p>
                      <select
                        title="Insert Participant Field"
                        defaultValue=""
                        onChange={(e) => {
                          const opt = FIELD_OPTIONS.find((f) => f.key === e.target.value);
                          if (opt) addDynamicField(opt.key, opt.label);
                          e.target.value = "";
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      >
                        <option value="" disabled>Choose a field...</option>
                        {FIELD_OPTIONS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                      <p className="text-[11px] text-muted-foreground mt-1">Yeh blue box har participant ke actual data se bulk generate ke waqt fill hoga.</p>
                    </div>
                  )}

                  <div className={isBulkCategory ? "pt-3 border-t border-border" : ""}>
                    <button onClick={addQrPlaceholder} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-primary/40 text-primary text-sm hover:bg-primary/10 transition-colors">
                      <QrCode className="h-4 w-4" /> Add QR Code
                    </button>
                  </div>

                  {activeObj ? (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground">Selected Object</p>

                      <div className="flex items-center justify-between">
                        <label htmlFor="fill-color" className="text-sm">Fill Color</label>
                        <input id="fill-color" type="color" defaultValue="#000000" onChange={(e) => handleColorChange(e.target.value)} className="w-9 h-9 rounded cursor-pointer border border-border" />
                      </div>
                      <div className="flex items-center justify-between">
                        <label htmlFor="stroke-color" className="text-sm">Stroke Color</label>
                        <input id="stroke-color" type="color" defaultValue="#000000" onChange={(e) => handleStrokeColorChange(e.target.value)} className="w-9 h-9 rounded cursor-pointer border border-border" />
                      </div>
                      <div className="flex items-center justify-between">
                        <label htmlFor="stroke-width" className="text-sm">Stroke Width</label>
                        <input id="stroke-width" type="number" min={0} max={30} defaultValue={0} onChange={(e) => handleStrokeWidthChange(Number(e.target.value))} className="w-20 px-2 py-1 rounded-lg border border-border bg-background text-sm" />
                      </div>

                      {activeObj.type === "rect" && (
                        <div className="flex items-center justify-between">
                          <label htmlFor="corner-radius" className="text-sm">Corner Radius</label>
                          <input id="corner-radius" type="number" min={0} max={100} defaultValue={0} onChange={(e) => handleCornerRadiusChange(Number(e.target.value))} className="w-20 px-2 py-1 rounded-lg border border-border bg-background text-sm" />
                        </div>
                      )}

                      {activeObj.type === "textbox" && (
                        <>
                          <div className="flex items-center justify-between">
                            <label htmlFor="font-size" className="text-sm">Font Size</label>
                            <input id="font-size" type="number" defaultValue={activeObj.fontSize || 28} min={8} max={120}
                              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                              className="w-20 px-2 py-1 rounded-lg border border-border bg-background text-sm" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={toggleBold} className={`flex-1 px-2 py-1.5 rounded-lg border text-sm font-bold transition-colors ${activeObj.fontWeight === "bold" ? "bg-primary/10 border-primary text-primary" : "border-border"}`}>B</button>
                            <button onClick={toggleItalic} className={`flex-1 px-2 py-1.5 rounded-lg border text-sm italic transition-colors ${activeObj.fontStyle === "italic" ? "bg-primary/10 border-primary text-primary" : "border-border"}`}>I</button>
                            <button onClick={toggleUnderline} className={`flex-1 px-2 py-1.5 rounded-lg border text-sm underline transition-colors ${activeObj.underline ? "bg-primary/10 border-primary text-primary" : "border-border"}`}>U</button>
                          </div>
                        </>
                      )}

                      <div className="flex items-center gap-2">
                        <button onClick={flipHorizontal} className="flex-1 px-2 py-1.5 rounded-lg border border-border text-xs hover:bg-muted/50 transition-colors">Flip H</button>
                        <button onClick={flipVertical} className="flex-1 px-2 py-1.5 rounded-lg border border-border text-xs hover:bg-muted/50 transition-colors">Flip V</button>
                      </div>

                      <p className="text-xs font-medium text-muted-foreground pt-2">Position</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={bringToFront} className="px-2 py-1.5 rounded-lg border border-border text-xs hover:bg-muted/50 transition-colors">To Front</button>
                        <button onClick={sendToBack} className="px-2 py-1.5 rounded-lg border border-border text-xs hover:bg-muted/50 transition-colors">To Back</button>
                        <button onClick={bringForward} className="px-2 py-1.5 rounded-lg border border-border text-xs hover:bg-muted/50 transition-colors">Forward</button>
                        <button onClick={sendBackward} className="px-2 py-1.5 rounded-lg border border-border text-xs hover:bg-muted/50 transition-colors">Backward</button>
                        <button onClick={centerObject} className="col-span-2 px-2 py-1.5 rounded-lg border border-border text-xs hover:bg-muted/50 transition-colors">Center on Canvas</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground pt-3 border-t border-border">Canvas par koi object select karein usay edit karne ke liye.</p>
                  )}

                  <div className="pt-3 border-t border-border space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Canvas Settings</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Background</span>
                      <input type="color" defaultValue="#ffffff" onChange={(e) => handleBgColorChange(e.target.value)} className="w-9 h-9 rounded cursor-pointer border border-border" />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SIZE_PRESETS.map((p) => (
                        <button key={p.label} onClick={() => applyPreset(p.width, p.height)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{participants.length} participants in "{listName}"</p>
                  {participants.map((p) => (
                    <div key={p.id} className="text-sm px-3 py-2 rounded-lg bg-muted/30 border border-border">
                      <p className="font-medium truncate">{p.name}</p>
                      {p.organization && <p className="text-xs text-muted-foreground truncate">{p.organization}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesigningPortal;