import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import * as fabric from "fabric";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Download,
  Type,
  Image as ImageIcon,
  Trash2,
  Save,
  Palette,
  Plus,
} from "lucide-react";
import { getTemplateById, type DesignCategory } from "@/design/designTemplate";
import { supabase } from "@/lib/supabase";
import MyElementsPanel from "@/components/MyElementsPanel";


const DesignEditor = () => {
  const { templateId, designId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event_id") || "";

  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selected, setSelected] = useState<fabric.Object | null>(null);
  const [textValue, setTextValue] = useState("");
  const [colorValue, setColorValue] = useState("#000000");
  const [saving, setSaving] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(!!designId);

  const [meta, setMeta] = useState<{
    id: string;
    savedRowId: string | null;
    name: string;
    category: DesignCategory;
    kind: string;
    width: number;
    height: number;
    background: string;
    json: { background: string; objects: Record<string, unknown>[] } | null;
  } | null>(null);

  useEffect(() => {
    const resolve = async () => {
      if (templateId) {
        const tpl = getTemplateById(templateId);
        if (!tpl) return;
        setMeta({
          id: tpl.id,
          savedRowId: null,
          name: tpl.name,
          category: tpl.category,
          kind: tpl.kind,
          width: tpl.width,
          height: tpl.height,
          background: tpl.json.background,
          json: tpl.json,
        });
        setLoadingSaved(false);
        return;
      }

      if (designId) {
        setLoadingSaved(true);
        const { data, error } = await supabase
          .from("designs")
          .select("*")
          .eq("id", designId)
          .single();

        if (error || !data) {
          toast.error("Ye saved design nahi mil saki.");
          setLoadingSaved(false);
          return;
        }

        const canvasJson = data.canvas_json as {
          background?: string;
          objects?: Record<string, unknown>[];
        };

        setMeta({
          id: data.template_id,
          savedRowId: data.id,
          name: data.name,
          category: data.category,
          kind: "Design",
          width: 800,
          height: 1000,
          background: canvasJson?.background || "#ffffff",
          json: {
            background: canvasJson?.background || "#ffffff",
            objects: canvasJson?.objects || [],
          },
        });
        setLoadingSaved(false);
      }
    };

    resolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, designId]);

  useEffect(() => {
    if (!canvasElRef.current || !meta || !meta.json) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: meta.width,
      height: meta.height,
      backgroundColor: meta.background,
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    canvas.loadFromJSON(meta.json, () => {
      canvas.renderAll();
    });

    const onSelect = () => {
      const obj = canvas.getActiveObject() || null;
      setSelected(obj);
      if (obj && obj.type === "textbox") {
        setTextValue((obj as fabric.Textbox).text || "");
      }
      if (obj && (obj as fabric.Object & { fill?: string }).fill) {
        setColorValue(String((obj as fabric.Object & { fill?: string }).fill));
      }
    };
    canvas.on("selection:created", onSelect);
    canvas.on("selection:updated", onSelect);
    canvas.on("selection:cleared", () => setSelected(null));

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.id, meta?.savedRowId]);

  const updateSelectedText = useCallback((value: string) => {
    setTextValue(value);
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (obj && obj.type === "textbox") {
      (obj as fabric.Textbox).set("text", value);
      canvas?.renderAll();
    }
  }, []);

  const updateSelectedColor = useCallback((value: string) => {
    setColorValue(value);
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set("fill", value);
      canvas?.renderAll();
    }
  }, []);

  const addText = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new fabric.Textbox("New Text", {
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
    const canvas = fabricRef.current;
    if (!file || !canvas) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      fabric.FabricImage.fromURL(dataUrl).then((img) => {
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

  // Insert an image the user previously saved in "My Elements" for this event
  const insertFromMyElements = (fileUrl: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    fabric.FabricImage.fromURL(fileUrl, { crossOrigin: "anonymous" }).then((img) => {
      img.scaleToWidth(200);
      img.set({ left: 100, top: 100 });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  };

  const deleteSelected = () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      canvas.remove(obj);
      canvas.discardActiveObject();
      canvas.renderAll();
      setSelected(null);
    }
  };

  const downloadPNG = () => {
    const canvas = fabricRef.current;
    if (!canvas || !meta) return;
    const dataUrl = canvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${meta.name.replace(/\s+/g, "_")}.png`;
    link.click();
  };

  const saveDesign = async () => {
    const canvas = fabricRef.current;
    if (!canvas || !meta) return;
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const canvasJson = canvas.toJSON();
      const thumbnail = canvas.toDataURL({ format: "png", quality: 0.6, multiplier: 0.3 });

      if (meta.savedRowId) {
        const { error } = await supabase
          .from("designs")
          .update({
            canvas_json: canvasJson,
            thumbnail_url: thumbnail,
          })
          .eq("id", meta.savedRowId);
        if (error) throw error;
        toast.success("Design update ho gayi!");
      } else {
        const { data, error } = await supabase
          .from("designs")
          .insert({
            user_id: userData?.user?.id ?? null,
            template_id: meta.id,
            name: meta.name,
            category: meta.category,
            canvas_json: canvasJson,
            thumbnail_url: thumbnail,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success("Design save ho gayi! Ab 'My Designs' mein milegi.");
        if (data) {
          setMeta((prev) => (prev ? { ...prev, savedRowId: data.id } : prev));
          navigate(`/dashboard/design/saved/${data.id}`, { replace: true });
        }
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        "Save nahi ho saka. Supabase mein 'designs' table check karein (setup notes dekhein)."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingSaved) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4">
        <p className="text-slate-400">Design/Template nahi mila.</p>
        <Button onClick={() => navigate("/dashboard/design")}>Back to Design Studio</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* White editor workspace */}
      <div className="bg-white text-slate-900 min-h-[calc(100vh-64px)]">
        <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
          {/* Toolbar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6">
            <div>
              <h2 className="font-semibold text-lg text-slate-900">{meta.name}</h2>
              <p className="text-xs text-slate-500 capitalize">
                {meta.kind} • {meta.category}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={addText} className="gap-1.5">
                <Type className="w-4 h-4" /> Add Text
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <ImageIcon className="w-4 h-4" /> Add Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={addImage}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={deleteSelected}
                disabled={!selected}
                className="gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>

            {selected && (
              <div className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-sm font-medium flex items-center gap-1.5 text-slate-900">
                  <Palette className="w-4 h-4" /> Edit Selected
                </p>

                {selected.type === "textbox" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Text</Label>
                    <Textarea
                      value={textValue}
                      onChange={(e) => updateSelectedText(e.target.value)}
                      rows={3}
                      className="bg-white"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">Color</Label>
                  <Input
                    type="color"
                    value={colorValue}
                    onChange={(e) => updateSelectedColor(e.target.value)}
                    className="h-10 p-1 bg-white"
                  />
                </div>
              </div>
            )}

            {/* My Elements: only shows up when this editor was opened with
               ?event_id=... in the URL (i.e. opened from an event workspace) */}
            {eventId && (
              <MyElementsPanel eventId={eventId} onInsert={insertFromMyElements} />
            )}

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <Button onClick={downloadPNG} className="w-full gap-1.5">
                <Download className="w-4 h-4" /> Download PNG
              </Button>
              <Button
                onClick={saveDesign}
                variant="outline"
                className="w-full gap-1.5"
                disabled={saving}
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : meta.savedRowId ? "Update Saved Design" : "Save to My Designs"}
              </Button>
              <Button
                onClick={() => navigate("/dashboard/design/my")}
                variant="ghost"
                className="w-full gap-1.5 text-slate-600"
              >
                <Palette className="w-4 h-4" /> Go to My Designs
              </Button>
              <Button
                onClick={() => navigate("/dashboard/design")}
                variant="ghost"
                className="w-full gap-1.5 text-slate-600"
              >
                <Plus className="w-4 h-4" /> Choose Another Template
              </Button>
            </div>
          </aside>

          {/* Canvas */}
          <div className="flex-1 flex justify-center">
            <div className="border border-slate-200 rounded-lg shadow-sm overflow-auto bg-slate-50 p-4 max-w-full">
              <canvas ref={canvasElRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignEditor;