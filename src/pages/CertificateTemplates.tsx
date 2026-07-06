import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Award,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Type,
  Square,
  Circle as CircleIcon,
  Image as ImageIcon,
  Trash2,
  Copy,
  Save,
  QrCode,
} from "lucide-react";
import { Canvas, Textbox, Rect, Circle, FabricImage } from "fabric";
import QRCode from "qrcode";
import { supabase } from "../lib/supabase";
import { certificateTemplates, type CertificateTemplate } from "../lib/certificateTemplates";
import { generateCertificatesForList, type GenerateResult } from "../lib/certificateGenerator";
import { toast } from "sonner";

interface ParticipantLite {
  id: string;
  name: string;
  category?: string;
}

const FIELD_OPTIONS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "organization", label: "Organization" },
  { key: "category", label: "Category" },
];

// ── Template preview (static canvas render) ───────────────────────────────────
const TemplatePreviewCanvas = ({
  template,
  sampleName,
  eventName,
}: {
  template: CertificateTemplate;
  sampleName: string;
  eventName: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = template.width;
    canvas.height = template.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    template.draw(ctx, {
      participantName: sampleName,
      eventName,
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    });
  }, [template, sampleName, eventName]);

  return (
    <canvas ref={canvasRef} className="w-full h-auto rounded-lg border border-border" />
  );
};

// ── Fabric editor for a chosen template ───────────────────────────────────────
const CertificateEditor = ({
  template,
  participants,
  eventId,
  eventName,
  listName,
  dayNumber,
  organizerName,
  onBack,
  onDone,
}: {
  template: CertificateTemplate;
  participants: ParticipantLite[];
  eventId: string;
  eventName: string;
  listName: string;
  dayNumber: number;
  organizerName: string;
  onBack: () => void;
  onDone: (results: GenerateResult[]) => void;
}) => {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeObj, setActiveObj] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [rightTab, setRightTab] = useState<"style" | "participants">("style");

  const computeZoom = (w: number, h: number) => {
    const availW = (wrapperRef.current?.clientWidth || window.innerWidth - 360) - 64;
    const availH = window.innerHeight - 130;
    return Math.min(availW / w, availH / h, 1);
  };

  useEffect(() => {
    let canvas: Canvas;
    const init = async () => {
      await new Promise((r) => setTimeout(r, 50));
      canvas = new Canvas(canvasElRef.current!, {
        width: template.width,
        height: template.height,
        backgroundColor: "#ffffff",
      });
      fabricRef.current = canvas;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = template.width;
      tempCanvas.height = template.height;
      const ctx = tempCanvas.getContext("2d")!;
      template.draw(ctx, {
        participantName: participants[0]?.name || "Participant Name",
        eventName,
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        organizerName,
      });
      const bgDataUrl = tempCanvas.toDataURL();
      const bgImg = await FabricImage.fromURL(bgDataUrl);
      bgImg.set({ left: 0, top: 0, selectable: false, evented: false });
      (bgImg as any).set("data", { isBackground: true });
      canvas.add(bgImg);
      canvas.sendObjectToBack(bgImg);

      canvas.on("selection:created", (e: any) => setActiveObj(e.selected?.[0] || null));
      canvas.on("selection:updated", (e: any) => setActiveObj(e.selected?.[0] || null));
      canvas.on("selection:cleared", () => setActiveObj(null));
      canvas.renderAll();

      const z = computeZoom(template.width, template.height);
      setZoom(z);
    };
    init();
    return () => {
      try {
        canvas?.dispose();
      } catch (_) {}
    };
  }, []);

  const addText = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new Textbox("Your text here", {
      left: 100,
      top: 100,
      fontSize: 32,
      fill: "#1f2937",
      width: 300,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addDynamicField = (fieldKey: string, label: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new Textbox(`{{${label}}}`, {
      left: 100,
      top: 140,
      fontSize: 32,
      fill: "#1d4ed8",
      backgroundColor: "#dbeafe",
      width: 300,
    });
    (text as any).set("data", { dynamicField: fieldKey });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addRect = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.add(
      new Rect({ left: 60, top: 60, width: 160, height: 80, fill: "#3b82f6", opacity: 0.8 })
    );
    canvas.renderAll();
  };

  const addCircle = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.add(
      new Circle({ left: 60, top: 60, radius: 50, fill: "#10b981", opacity: 0.8 })
    );
    canvas.renderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const img = await FabricImage.fromURL(evt.target?.result as string);
      img.scaleToWidth(200);
      img.set({ left: 100, top: 100 });
      fabricRef.current?.add(img);
      fabricRef.current?.renderAll();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const addQr = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const dataUrl = await QRCode.toDataURL(participants[0]?.id || "sample", {
      margin: 1,
      width: 300,
    });
    const img = await FabricImage.fromURL(dataUrl);
    img.scaleToWidth(120);
    img.set({ left: 60, top: 60 });
    (img as any).set("data", { dynamicField: "qr_id" });
    canvas.add(img);
    canvas.renderAll();
    toast.success("QR placeholder added");
  };

  const deleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas
      .getActiveObjects()
      .filter((o) => !(o as any).data?.isBackground)
      .forEach((o) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.renderAll();
    setActiveObj(null);
  };

  const duplicateSelected = async () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj || (obj as any).data?.isBackground) return;
    const cloned = await (obj as any).clone(["data"]);
    cloned.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20 });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.renderAll();
  };

  const handleColorChange = (color: string) => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return;
    obj.set("fill", color);
    fabricRef.current?.renderAll();
  };

  const handleFontSizeChange = (size: number) => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return;
    (obj as any).set("fontSize", size);
    fabricRef.current?.renderAll();
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress({ done: 0, total: participants.length });
    try {
      const res = await generateCertificatesForList({
        template,
        participants,
        eventId,
        eventName,
        listName,
        dayNumber,
        organizerName,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      toast.success(`${res.length} certificates generated!`);
      onDone(res);
    } catch (err: any) {
      toast.error("Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // suppress unused warning — isSaving is available for future use
  void isSaving;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left toolbar */}
      <div className="w-14 border-r border-border bg-card flex flex-col items-center gap-1 py-4 shrink-0">
        <button
          onClick={addText}
          title="Add Text"
          className="p-2.5 rounded-lg hover:bg-amber-100/60 hover:text-amber-700 transition-colors text-muted-foreground"
        >
          <Type className="h-5 w-5" />
        </button>
        <button
          onClick={addRect}
          title="Add Rectangle"
          className="p-2.5 rounded-lg hover:bg-amber-100/60 hover:text-amber-700 transition-colors text-muted-foreground"
        >
          <Square className="h-5 w-5" />
        </button>
        <button
          onClick={addCircle}
          title="Add Circle"
          className="p-2.5 rounded-lg hover:bg-amber-100/60 hover:text-amber-700 transition-colors text-muted-foreground"
        >
          <CircleIcon className="h-5 w-5" />
        </button>
        <div className="relative">
          <label htmlFor="image-upload" className="sr-only">
            Add Image
          </label>
          <input
            id="image-upload"
          
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <button
            title="Add Image"
            className="p-2.5 rounded-lg hover:bg-amber-100/60 hover:text-amber-700 transition-colors text-muted-foreground"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={addQr}
          title="Add QR Code"
          className="p-2.5 rounded-lg hover:bg-amber-100/60 hover:text-amber-700 transition-colors text-amber-600"
        >
          <QrCode className="h-5 w-5" />
        </button>
        <div className="w-8 border-t border-border my-2" />
        <button
          onClick={duplicateSelected}
          title="Duplicate"
          className="p-2.5 rounded-lg hover:bg-amber-100/60 hover:text-amber-700 transition-colors text-muted-foreground"
        >
          <Copy className="h-5 w-5" />
        </button>
        <button
          onClick={deleteSelected}
          title="Delete Selected"
          className="p-2.5 rounded-lg hover:bg-red-100/60 hover:text-red-500 transition-colors text-muted-foreground"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={wrapperRef}
        className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 flex items-start justify-center p-8"
      >
        <div
          className="shadow-2xl rounded-sm ring-1 ring-black/10 origin-top-left"
          style={{
            width: template.width * zoom,
            height: template.height * zoom,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <canvas ref={canvasElRef} />
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 border-l border-border bg-card flex flex-col shrink-0">
        <div className="flex border-b border-border">
          <button
            onClick={() => setRightTab("style")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              rightTab === "style"
                ? "border-b-2 border-[#F9BB1E] text-[#F9BB1E]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Style
          </button>
          <button
            onClick={() => setRightTab("participants")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              rightTab === "participants"
                ? "border-b-2 border-[#F9BB1E] text-[#F9BB1E]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Participants
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-5">
          {rightTab === "style" ? (
            <>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Insert Participant Field
                </p>
                <select
                  aria-label="Insert Participant Field"
                  defaultValue=""
                  onChange={(e) => {
                    const opt = FIELD_OPTIONS.find((f) => f.key === e.target.value);
                    if (opt) addDynamicField(opt.key, opt.label);
                    e.target.value = "";
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                >
                  <option value="" disabled>
                    Choose a field...
                  </option>
                  {FIELD_OPTIONS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                  Blue placeholders get replaced with each participant's real data during
                  generation.
                </p>
              </div>

              {activeObj && !(activeObj as any).data?.isBackground ? (
                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Selected Object
                  </p>
                  <div className="flex items-center justify-between">
                    <label htmlFor="color-picker" className="text-sm">
                      Color
                    </label>
                    <input
                      id="color-picker"
                      type="color"
                      defaultValue="#000000"
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-border"
                    />
                  </div>
                  {activeObj.type === "textbox" && (
                    <div className="flex items-center justify-between">
                      <label htmlFor="font-size-input" className="text-sm">
                        Font Size
                      </label>
                      <input
                        id="font-size-input"
                        type="number"
                        defaultValue={activeObj.fontSize || 32}
                        min={8}
                        max={200}
                        onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded-lg border border-border bg-background text-sm text-center"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click any object on the canvas to edit it. The template background is
                    locked — add new elements on top.
                  </p>
                </div>
              )}

              {/* Generate button */}
              <div className="border-t border-border pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F9BB1E] text-black text-sm font-semibold hover:bg-[#F9BB1E]/90 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {progress.done}/
                      {progress.total}
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4" /> Generate for All {participants.length}
                    </>
                  )}
                </button>
                <button
                  onClick={onBack}
                  className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground text-center py-1"
                >
                  ← Choose a different template
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {participants.length} participants
              </p>
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="text-sm px-3 py-2 rounded-lg bg-muted/30 border border-border"
                >
                  <p className="font-medium truncate">{p.name}</p>
                  {p.category && (
                    <p className="text-xs text-muted-foreground truncate">{p.category}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const CertificateTemplatesPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventId = params.get("event_id") || "";
  const listName = params.get("list_name") || "";
  const dayNumber = parseInt(params.get("day_number") || "1");

  const [eventName, setEventName] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [participants, setParticipants] = useState<ParticipantLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [step, setStep] = useState<"gallery" | "editor" | "results">("gallery");
  const [results, setResults] = useState<GenerateResult[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!eventId || !listName) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const { data: eventRow } = await supabase
          .from("events")
          .select("name")
          .eq("id", eventId)
          .single();
        if (eventRow) setEventName(eventRow.name);

        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data: profRow } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", authData.user.id)
            .single();
          if (profRow?.full_name) setOrganizerName(profRow.full_name);
        }

        const { data: rows, error } = await supabase
          .from("participants")
          .select("id, name, category")
          .eq("event_id", eventId)
          .eq("list_name", listName)
          .eq("day_number", dayNumber);
        if (error) throw error;
        setParticipants(rows || []);
      } catch (err: any) {
        toast.error("Failed to load: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [eventId, listName, dayNumber]);

  if (!eventId || !listName) {
    return (
      <div className="p-10 text-center">
        <p className="text-destructive font-medium">Missing event or list information.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-primary underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card shrink-0">
        <button
          onClick={() => (step === "gallery" ? navigate(-1) : setStep("gallery"))}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="text-center">
          <h1 className="font-bold text-[#F9BB1E] flex items-center gap-2">
            <Award className="h-4 w-4" /> Certificates — {listName}
          </h1>
          <p className="text-xs text-muted-foreground">
            {eventName} · {participants.length} participants
          </p>
        </div>
        <div className="w-20" />
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading...
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl m-6">
          <p className="text-muted-foreground">
            No participants found in this list yet. Add participants first.
          </p>
        </div>
      ) : step === "gallery" ? (
        <div className="p-6 max-w-5xl mx-auto w-full">
          <p className="text-sm text-muted-foreground mb-6">
            Choose a template to get started. You can customise it before generating.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {certificateTemplates.map((tpl) => (
              <div
                key={tpl.key}
                className="bg-card border border-border rounded-2xl p-4 hover:border-[#F9BB1E]/50 transition-colors"
              >
                <TemplatePreviewCanvas
                  template={tpl}
                  sampleName={participants[0]?.name || "Your Name"}
                  eventName={eventName || "Event"}
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="font-semibold">{tpl.name}</span>
                  <button
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      setStep("editor");
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Use this Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : step === "editor" && selectedTemplate ? (
        <CertificateEditor
          template={selectedTemplate}
          participants={participants}
          eventId={eventId}
          eventName={eventName}
          listName={listName}
          dayNumber={dayNumber}
          organizerName={organizerName}
          onBack={() => setStep("gallery")}
          onDone={(res) => {
            setResults(res);
            setStep("results");
          }}
        />
      ) : step === "results" ? (
        <div className="p-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-4 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">
              {results.length} certificates generated and saved!
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {results.map((r) => (
              <div key={r.participantId} className="bg-card border border-border rounded-xl p-3">
                <img
                  src={r.fileUrl}
                  alt={r.participantName}
                  className="w-full rounded-lg border border-border mb-2"
                />
                <p className="text-sm font-medium truncate">{r.participantName}</p>
                <a
                  href={r.fileUrl}
                  download={`${r.participantName}_certificate.png`}
                  className="mt-2 flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <Download className="h-3 w-3" /> Download
                </a>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setStep("gallery");
              setResults([]);
            }}
            className="mt-6 flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Generate with a different template
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default CertificateTemplatesPage;