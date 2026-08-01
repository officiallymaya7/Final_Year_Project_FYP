import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Canvas, Textbox, StaticCanvas, FabricImage, type FabricObject } from "fabric";
import {
  ArrowLeft, Loader2, Download, Save, Type, Image as ImageIcon, Trash2, Palette
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getTemplatesForCategory, type GalleryTemplate } from "../lib/templateGallery";
import { downloadFile, downloadAllAsZip } from "../lib/downloadHelpers";
import { fetchBrandKit, type EventBrandKit } from "@/lib/eventBrandKit";
import { toast } from "sonner";
import MyElementsPanel from "@/components/MyElementsPanel";

const DesigningPortal = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventId = params.get("event_id") || "";
  const listName = params.get("list_name") || "";
  const dayNumber = parseInt(params.get("day_number") || "1");
  const category = params.get("category") || "general";

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingJsonRef = useRef<any>(null);

  const [step, setStep] = useState<"gallery" | "editor">("gallery");
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 850 });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [textValue, setTextValue] = useState("");
  const [colorValue, setColorValue] = useState("#000000");

  const [eventName, setEventName] = useState("");
  const [brandKit, setBrandKit] = useState<EventBrandKit | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const loadPack = async () => {
      try {
        const { data: eventRow } = await supabase.from("events").select("name").eq("id", eventId).single();
        if (eventRow) setEventName(eventRow.name);

        const kit = await fetchBrandKit(eventId);
        setBrandKit(kit);
      } catch (err) {
        console.error(err);
      }
    };
    loadPack();
  }, [eventId]);

  const loadGalleryTemplate = async (tpl: GalleryTemplate) => {
    setIsLoading(true);
    try {
      const json = await tpl.build();
      pendingJsonRef.current = json;
      setCanvasSize({ width: tpl.width, height: tpl.height });
      setStep("editor");
    } catch (err) {
      toast.error("Failed to load template");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize the interactive canvas once we're in the editor step
  useEffect(() => {
    if (step !== "editor" || !canvasElRef.current) return;

    const canvas = new Canvas(canvasElRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      preserveObjectStacking: true,
    });
    fabricCanvasRef.current = canvas;

    if (pendingJsonRef.current) {
      canvas.loadFromJSON(pendingJsonRef.current).then(() => {
        canvas.renderAll();
      });
    }

    const onSelect = () => {
      const obj = canvas.getActiveObject() || null;
      setSelected(obj);
      if (obj && obj.type === "textbox") {
        setTextValue((obj as Textbox).text || "");
      }
      if (obj && (obj as FabricObject & { fill?: string }).fill) {
        setColorValue(String((obj as FabricObject & { fill?: string }).fill));
      }
    };
    canvas.on("selection:created", onSelect);
    canvas.on("selection:updated", onSelect);
    canvas.on("selection:cleared", () => setSelected(null));

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [step, canvasSize.width, canvasSize.height]);

  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const text = new Textbox("New Text", {
      left: 80,
      top: 80,
      width: 300,
      fontSize: 28,
      fill: "#111111",
      fontFamily: "Arial",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const canvas = fabricCanvasRef.current;
    if (!file || !canvas) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      FabricImage.fromURL(dataUrl).then((img) => {
        img.scaleToWidth(200);
        img.set({ left: 100, top: 100 });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const insertFromMyElements = (fileUrl: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    FabricImage.fromURL(fileUrl, { crossOrigin: "anonymous" }).then((img) => {
      img.scaleToWidth(200);
      img.set({ left: 100, top: 100 });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  };

  const updateSelectedText = (value: string) => {
    setTextValue(value);
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj && obj.type === "textbox") {
      (obj as Textbox).set("text", value);
      canvas?.renderAll();
    }
  };

  const updateSelectedColor = (value: string) => {
    setColorValue(value);
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set("fill", value);
      canvas?.renderAll();
    }
  };

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      canvas.remove(obj);
      canvas.discardActiveObject();
      canvas.renderAll();
      setSelected(null);
    }
  };

  const handleDownloadSingle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `design_${category}.png`;
    a.click();
    toast.success("Image downloaded!");
  };

  const handleDownloadAllZip = async () => {
    if (results.length === 0) {
      toast.error("No designs generated yet");
      return;
    }
    setIsZipping(true);
    try {
      await downloadAllAsZip(
        results.map(r => ({ url: r.fileUrl, filename: `${r.participantName}.png` })),
        `designs_${category}.zip`
      );
      toast.success("ZIP downloaded!");
    } catch (err) {
      toast.error("ZIP download failed");
    } finally {
      setIsZipping(false);
    }
  };

  const handleSaveDesign = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !eventId) {
      toast.error("Event id missing, is design ko event ke sath save nahi kar sakte.");
      return;
    }
    setSaving(true);
    try {
      const canvasJson = canvas.toJSON();
      const { error } = await supabase.from("design_templates").insert({
        event_id: eventId,
        list_name: listName || "Guest List",
        day_number: dayNumber,
        category,
        name: `${category} design`,
        canvas_width: canvasSize.width,
        canvas_height: canvasSize.height,
        canvas_json: canvasJson,
      });
      if (error) throw error;
      toast.success("Design event ke sath save ho gayi!");
    } catch (err) {
      console.error(err);
      toast.error("Save nahi ho saka.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <h1 className="font-bold text-xl text-[#F9BB1E]">Designing Portal</h1>

        {step === "editor" && (
          <div className="flex gap-3">
            <button
              onClick={handleSaveDesign}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium rounded-xl transition-colors"
            >
              {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
              Save
            </button>
            <button
              onClick={handleDownloadSingle}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F9BB1E] hover:bg-yellow-500 text-black font-medium rounded-xl transition-colors"
            >
              <Download className="h-4 w-4" /> Download Image
            </button>

            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F9BB1E] hover:bg-yellow-500 text-black font-medium rounded-xl transition-colors"
            >
              {isZipping ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4" />}
              Download ZIP
            </button>
          </div>
        )}
      </div>

      {step === "gallery" ? (
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-8 text-center">Choose Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {getTemplatesForCategory(category).map(tpl => (
              <div key={tpl.key} className="border rounded-2xl p-6 hover:border-yellow-400 transition-all">
                <GalleryPreview template={tpl} />
                <button
                  onClick={() => loadGalleryTemplate(tpl)}
                  className="mt-6 w-full py-3 bg-[#F9BB1E] hover:bg-yellow-500 text-black font-medium rounded-xl"
                >
                  Use this Template
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 bg-gray-50">
          {/* Toolbar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6 bg-white rounded-xl border p-4 h-fit">
            <div className="flex flex-wrap gap-2">
              <button onClick={addText} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
                <Type className="w-4 h-4" /> Add Text
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
                <ImageIcon className="w-4 h-4" /> Add Image
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={addImage} />
              <button onClick={deleteSelected} disabled={!selected} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>

            {selected && (
              <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Palette className="w-4 h-4" /> Edit Selected
                </p>
                {selected.type === "textbox" && (
                  <textarea
                    value={textValue}
                    onChange={(e) => updateSelectedText(e.target.value)}
                    rows={3}
                    className="w-full text-sm border rounded-md p-2"
                  />
                )}
                <input
                  type="color"
                  value={colorValue}
                  onChange={(e) => updateSelectedColor(e.target.value)}
                  className="h-9 w-full"
                />
                {brandKit && (
                  <div className="flex gap-2 pt-1">
                    {[brandKit.primary_color, brandKit.secondary_color, brandKit.accent_color].map(
                      (c) => (
                        <button
                          key={c}
                          onClick={() => updateSelectedColor(c)}
                          className="w-7 h-7 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {eventId && <MyElementsPanel eventId={eventId} onInsert={insertFromMyElements} />}
          </aside>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center">
            <canvas ref={canvasElRef} className="shadow-2xl border-4 border-gray-300 rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

const GalleryPreview = ({ template }: { template: GalleryTemplate }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let c: any = null;
    template.build().then(json => {
      if (ref.current) {
        c = new StaticCanvas(ref.current, { width: template.width, height: template.height });
        c.loadFromJSON(json).then(() => c.renderAll());
      }
    });
    return () => c?.dispose();
  }, [template]);
  return <canvas ref={ref} className="w-full border rounded-lg" />;
};

export default DesigningPortal;