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
  const moduleLabel = category === "id_card" ? "ID Cards" :
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

  // Load event data
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

  // Canvas + Load Template
  useEffect(() => {
    if (step !== "editor" || !canvasElRef.current) return;

    const canvas = new Canvas(canvasElRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: "#ffffff",
    });

    fabricCanvasRef.current = canvas;

    if (pendingJsonRef.current) {
      const json = pendingJsonRef.current;
      console.log("🔄 Loading template:", json.objects?.length || 0, "objects");

      pendingJsonRef.current = null;

      canvas.loadFromJSON(json, () => {
        canvas.getObjects().forEach((obj: any) => {
          if (obj.type === "textbox") {
            obj.set({ editable: true, selectable: true, evented: true });
          }
        });
        canvas.setBackgroundColor(json.backgroundColor || "#ffffff", canvas.renderAll.bind(canvas));
        canvas.renderAll();
        console.log("✅ Template Loaded! Objects:", canvas.getObjects().length);
      }).catch(err => console.error("Load error:", err));
    }

    return () => canvas.dispose();
  }, [step, canvasSize]);

  const loadGalleryTemplate = async (tpl: GalleryTemplate) => {
    setIsLoading(true);
    try {
      const json = await tpl.build();
      console.log("🔥 Template:", tpl.name, "| Objects:", json.objects?.length || 0);

      setTemplateId(null);
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

  // Add your other functions here (addText, addRect, handleSaveTemplate, etc.)
  // ... (apne purane code se baaki functions copy paste kar lena)

  if (!eventId || !listName) {
    return <div className="p-10 text-center">Missing event or list information.</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-bold text-[#F9BB1E]">{moduleLabel} — {listName}</h1>
      </div>

      {step === "gallery" ? (
        <div className="p-6 max-w-5xl mx-auto w-full">
          <h2 className="text-lg font-semibold mb-4">Choose a starting template</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {getTemplatesForCategory(category).map((tpl) => (
              <div key={tpl.key} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 transition-colors">
                <GalleryPreview template={tpl} />
                <div className="flex items-center justify-between mt-4">
                  <span className="font-semibold">{tpl.name}</span>
                  <button 
                    onClick={() => loadGalleryTemplate(tpl)}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                  >
                    Use this Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
            <canvas ref={canvasElRef} className="shadow-2xl border border-border" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DesigningPortal;