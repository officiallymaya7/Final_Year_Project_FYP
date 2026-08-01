import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Canvas, Textbox, Rect, Circle, FabricImage, util } from "fabric";
import {
  ArrowLeft, Download, Save, Loader2, Upload, Palette, Type as TypeIcon,
  Type, Square, Circle as CircleIcon, Image as ImageIcon, Trash2, Copy, Images,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchBrandKit, saveBrandKit } from "@/lib/eventBrandKit";
import { DESIGN_CATEGORIES, getPackageByKey, type DesignCategoryKey, type PackageBrandKit } from "@/lib/designPackages";
import { renderBrandedLayout, CATEGORY_DIMS } from "@/lib/brandedCanvasEngine";
import { fetchAllDrafts, saveDraft, type DesignDraft } from "@/lib/designDrafts";
import MyElementsPanel from "@/components/MyElementsPanel";
import { toast } from "sonner";

const FONT_CHOICES = ["Arial", "Poppins", "Inter", "Playfair Display", "Montserrat", "Georgia"];
const PATTERN_CHOICES: PackageBrandKit["pattern"][] = ["none", "dots", "waves", "geometric", "diagonal"];
const DEFAULT_HEADLINE = "Join us for an unforgettable experience";

const DesignPackageEditor = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const packageKey = params.get("package") || "modern-blue";
  const categories = (params.get("categories") || "").split(",").filter(Boolean) as DesignCategoryKey[];

  const [eventName, setEventName] = useState("");
  const [activeCategory, setActiveCategory] = useState<DesignCategoryKey>(categories[0] || "poster");
  const [brand, setBrand] = useState<PackageBrandKit>(getPackageByKey(packageKey).brandKit);
  const [overrides, setOverrides] = useState<Partial<Record<DesignCategoryKey, Partial<PackageBrandKit>>>>({});
  const [scope, setScope] = useState<"only" | "all">("all");
  const [headlines, setHeadlines] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activeObj, setActiveObj] = useState<any>(null);
  const [rightTab, setRightTab] = useState<"brand" | "elements">("brand");

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  // In-memory cache of every category's user-added objects + headline — survives tab switches instantly
  const draftsRef = useRef<Record<string, DesignDraft>>({});
  // Objects the user manually placed on the CURRENTLY open canvas
  const userObjectsRef = useRef<any[]>([]);

  const effectiveBrand: PackageBrandKit = { ...brand, ...(overrides[activeCategory] || {}) };
  const getHeadline = (cat: DesignCategoryKey) => headlines[cat] ?? DEFAULT_HEADLINE;
  const setHeadlineFor = (cat: DesignCategoryKey, val: string) =>
    setHeadlines((prev) => ({ ...prev, [cat]: val }));

  const computeZoom = (w: number, h: number) => {
    const availW = (wrapperRef.current?.clientWidth || window.innerWidth - 700) - 60;
    const availH = (wrapperRef.current?.clientHeight || window.innerHeight - 140) - 60;
    return Math.min(availW / w, availH / h, 1);
  };

  // Load event + brand kit + ALL saved drafts (once)
  useEffect(() => {
    if (!eventId) return;
    (async () => {
      setIsLoading(true);
      try {
        const [{ data: ev }, kit, drafts] = await Promise.all([
          supabase.from("events").select("name").eq("id", eventId).single(),
          fetchBrandKit(eventId),
          fetchAllDrafts(eventId).catch(() => ({} as Record<string, DesignDraft>)),
        ]);
        if (ev) setEventName(ev.name);
        if (kit) {
          setBrand({
            primary_color: kit.primary_color,
            secondary_color: kit.secondary_color,
            accent_color: kit.accent_color,
            font_heading: kit.font_heading,
            font_body: kit.font_body,
            logo_url: kit.logo_url,
            pattern: kit.pattern,
          });
        }
        draftsRef.current = drafts;
        const seeded: Record<string, string> = {};
        Object.entries(drafts).forEach(([cat, d]) => { if (d.headline) seeded[cat] = d.headline; });
        setHeadlines(seeded);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [eventId]);

  // Serialize the current canvas's user-added objects into the in-memory cache + Supabase (silent)
  const persistCurrentDraft = async () => {
    const canvas = fabricRef.current;
    if (!canvas || !eventId) return;
    const serialized = userObjectsRef.current.map((o: any) => o.toObject(["data"]));
    draftsRef.current[activeCategory] = {
      event_id: eventId,
      category: activeCategory,
      canvas_objects: serialized,
      headline: getHeadline(activeCategory),
    };
    try {
      await saveDraft(eventId, activeCategory, serialized, getHeadline(activeCategory));
    } catch (err) {
      console.error("Draft autosave failed:", err);
    }
  };

  const switchCategory = async (newCat: DesignCategoryKey) => {
    if (newCat === activeCategory) return;
    await persistCurrentDraft();
    setActiveCategory(newCat);
  };

  const goBackToWorkspace = async () => {
    await persistCurrentDraft();
    navigate(`/dashboard/event/${eventId}`);
  };

  // Init fabric canvas when category changes — restores any saved draft for that category
  useEffect(() => {
    if (!canvasElRef.current || isLoading) return;
    const dims = CATEGORY_DIMS[activeCategory];
    const canvas = new Canvas(canvasElRef.current, { width: dims.width, height: dims.height, backgroundColor: "#ffffff" });
    fabricRef.current = canvas;
    userObjectsRef.current = [];

    canvas.on("selection:created", (e: any) => setActiveObj(e.selected?.[0] || null));
    canvas.on("selection:updated", (e: any) => setActiveObj(e.selected?.[0] || null));
    canvas.on("selection:cleared", () => setActiveObj(null));

    (async () => {
      await renderBrandedLayout(canvas, activeCategory, effectiveBrand, eventName, getHeadline(activeCategory));

      const draft = draftsRef.current[activeCategory];
      if (draft?.canvas_objects?.length) {
        try {
          const restored = await util.enlivenObjects(draft.canvas_objects);
          (restored as any[]).forEach((obj) => {
            canvas.add(obj);
            userObjectsRef.current.push(obj);
          });
          canvas.renderAll();
        } catch (err) {
          console.error("Failed to restore draft objects:", err);
        }
      }
      setZoom(computeZoom(dims.width, dims.height));
    })();

    return () => { canvas.dispose(); fabricRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, activeCategory]);

  // Re-sync brand layout WITHOUT losing user-added objects (color/font/pattern/logo change)
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    (async () => {
      await renderBrandedLayout(canvas, activeCategory, effectiveBrand, eventName, getHeadline(activeCategory));
      userObjectsRef.current.forEach((obj) => canvas.add(obj));
      canvas.renderAll();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, overrides, headlines, eventName]);

  const updateBrand = (patch: Partial<PackageBrandKit>) => {
    if (scope === "all") {
      setBrand((prev) => ({ ...prev, ...patch }));
      setOverrides({});
    } else {
      setOverrides((prev) => ({ ...prev, [activeCategory]: { ...prev[activeCategory], ...patch } }));
    }
  };

  // ── Toolbar actions ──────────────────────────────────────────────────────
  const addText = () => {
    const canvas = fabricRef.current; if (!canvas) return;
    const t = new Textbox("Your text here", { left: 100, top: 100, fontSize: 32, fill: "#1f2937", width: 280 });
    canvas.add(t); canvas.setActiveObject(t); canvas.renderAll();
    userObjectsRef.current.push(t);
  };
  const addRect = () => {
    const canvas = fabricRef.current; if (!canvas) return;
    const r = new Rect({ left: 80, top: 80, width: 160, height: 90, fill: effectiveBrand.accent_color, opacity: 0.85 });
    canvas.add(r); canvas.setActiveObject(r); canvas.renderAll();
    userObjectsRef.current.push(r);
  };
  const addCircle = () => {
    const canvas = fabricRef.current; if (!canvas) return;
    const c = new Circle({ left: 80, top: 80, radius: 55, fill: effectiveBrand.accent_color, opacity: 0.85 });
    canvas.add(c); canvas.setActiveObject(c); canvas.renderAll();
    userObjectsRef.current.push(c);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const img = await FabricImage.fromURL(evt.target?.result as string);
      img.scaleToWidth(220);
      img.set({ left: 100, top: 100 });
      fabricRef.current?.add(img); fabricRef.current?.setActiveObject(img); fabricRef.current?.renderAll();
      userObjectsRef.current.push(img);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const insertFromMyElements = async (fileUrl: string) => {
    const canvas = fabricRef.current; if (!canvas) return;
    const img = await FabricImage.fromURL(fileUrl, { crossOrigin: "anonymous" });
    img.scaleToWidth(240);
    img.set({ left: 90, top: 90 });
    canvas.add(img); canvas.setActiveObject(img); canvas.renderAll();
    userObjectsRef.current.push(img);
    toast.success("Element added to canvas");
  };
  const duplicateSelected = async () => {
    const canvas = fabricRef.current; const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const cloned = await (obj as any).clone();
    cloned.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20 });
    canvas.add(cloned); canvas.setActiveObject(cloned); canvas.renderAll();
    userObjectsRef.current.push(cloned);
  };
  const deleteSelected = () => {
    const canvas = fabricRef.current; if (!canvas) return;
    canvas.getActiveObjects().forEach((o) => {
      canvas.remove(o);
      userObjectsRef.current = userObjectsRef.current.filter((u) => u !== o);
    });
    canvas.discardActiveObject(); canvas.renderAll(); setActiveObj(null);
  };
  const handleColorChange = (color: string) => {
    const obj = fabricRef.current?.getActiveObject(); if (!obj) return;
    obj.set("fill", color); fabricRef.current?.renderAll();
  };
  const handleFontSizeChange = (size: number) => {
    const obj = fabricRef.current?.getActiveObject() as any; if (!obj) return;
    obj.set("fontSize", size); fabricRef.current?.renderAll();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;
    try {
      const path = `${eventId}/brand-logo-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("event-assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("event-assets").getPublicUrl(path);
      updateBrand({ logo_url: pub.publicUrl });
      toast.success("Logo uploaded!");
    } catch (err: any) {
      toast.error("Logo upload failed: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  const handleSaveKit = async () => {
    if (!eventId) return;
    setSaving(true);
    try {
      await saveBrandKit(eventId, { ...brand, package_key: packageKey, selected_categories: categories });
      await persistCurrentDraft();

      const canvas = fabricRef.current;
      if (canvas) {
        const canvasJson = canvas.toJSON();
        await supabase.from("design_templates").insert({
          event_id: eventId,
          list_name: "Guest List",
          day_number: 1,
          category: activeCategory,
          name: `${DESIGN_CATEGORIES.find((c) => c.key === activeCategory)?.label} — ${getPackageByKey(packageKey).name}`,
          canvas_width: CATEGORY_DIMS[activeCategory].width,
          canvas_height: CATEGORY_DIMS[activeCategory].height,
          canvas_json: canvasJson,
        });
      }
      toast.success("Saved! You can continue this anytime from the workspace.");
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const canvas = fabricRef.current; if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = dataUrl; a.download = `${activeCategory}_${eventName || "design"}.png`; a.click();
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeInfo = DESIGN_CATEGORIES.find((c) => c.key === activeCategory);

  return (
    <div className="h-screen flex flex-col bg-white text-slate-800">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shrink-0 shadow-sm z-10">
        <button onClick={goBackToWorkspace} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Workspace
        </button>
        <div className="text-center">
          <p className="font-bold text-primary">{getPackageByKey(packageKey).name}</p>
          <p className="text-xs text-slate-400">{eventName}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Download
          </button>
          <button onClick={handleSaveKit} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-black text-sm font-semibold disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-slate-200 bg-slate-50/60 overflow-x-auto shrink-0">
        {categories.map((catKey) => {
          const info = DESIGN_CATEGORIES.find((c) => c.key === catKey);
          if (!info) return null;
          return (
            <button
              key={catKey}
              onClick={async () => {
                if (info.bulk) { await persistCurrentDraft(); navigate(`/dashboard/event/${eventId}/participants`); return; }
                switchCategory(catKey);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === catKey ? "bg-primary text-black" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {info.label}{info.bulk && " ↗"}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left icon toolbar */}
        <div className="w-14 border-r border-slate-200 bg-white flex flex-col items-center gap-1 py-4 shrink-0">
          <button onClick={addText} title="Add Text" className="p-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-slate-500">
            <Type className="h-5 w-5" />
          </button>
          <button onClick={addRect} title="Add Rectangle" className="p-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-slate-500">
            <Square className="h-5 w-5" />
          </button>
          <button onClick={addCircle} title="Add Circle" className="p-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-slate-500">
            <CircleIcon className="h-5 w-5" />
          </button>
          <div className="relative">
            <input type="file" accept="image/*" onChange={handleImageUpload} aria-label="Add image" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            <button title="Add Image" className="p-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-slate-500">
              <ImageIcon className="h-5 w-5" />
            </button>
          </div>
          <button onClick={() => setRightTab("elements")} title="My Elements" className="p-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-slate-500">
            <Images className="h-5 w-5" />
          </button>
          <div className="w-8 border-t border-slate-200 my-2" />
          <button onClick={duplicateSelected} title="Duplicate" disabled={!activeObj} className="p-2.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-slate-500 disabled:opacity-30">
            <Copy className="h-5 w-5" />
          </button>
          <button onClick={deleteSelected} title="Delete" disabled={!activeObj} className="p-2.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-slate-500 disabled:opacity-30">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        {/* Canvas area */}
        <div
          ref={wrapperRef}
          className="flex-1 overflow-auto flex items-center justify-center p-10"
          style={{ backgroundColor: "#FAFAFC", backgroundImage: "radial-gradient(circle, #E5E7EB 1.4px, transparent 1.4px)", backgroundSize: "22px 22px" }}
        >
          <div className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] rounded-sm ring-1 ring-black/5 origin-center" style={{ transform: `scale(${zoom})` }}>
            <canvas ref={canvasElRef} />
          </div>
        </div>

        {/* Right panel */}
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col shrink-0">
          <div className="flex border-b border-slate-200 shrink-0">
            <button onClick={() => setRightTab("brand")} className={`flex-1 py-3 text-sm font-semibold transition-colors ${rightTab === "brand" ? "border-b-2 border-primary text-primary" : "text-slate-400 hover:text-slate-600"}`}>
              Brand Kit
            </button>
            <button onClick={() => setRightTab("elements")} className={`flex-1 py-3 text-sm font-semibold transition-colors ${rightTab === "elements" ? "border-b-2 border-primary text-primary" : "text-slate-400 hover:text-slate-600"}`}>
              My Elements
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 space-y-6">
            {rightTab === "elements" ? (
              eventId && <MyElementsPanel eventId={eventId} onInsert={insertFromMyElements} />
            ) : (
              <>
                {activeObj && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Selected Object</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Color</span>
                      <input type="color" defaultValue="#000000" onChange={(e) => handleColorChange(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200" />
                    </div>
                    {activeObj.type === "textbox" && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Font Size</span>
                        <input type="number" defaultValue={activeObj.fontSize || 32} min={8} max={200} onChange={(e) => handleFontSizeChange(Number(e.target.value))} className="w-20 px-2 py-1 rounded-lg border border-slate-200 text-sm text-center" />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Apply changes to</p>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200">
                    <button onClick={() => setScope("only")} className={`flex-1 py-2 text-xs font-semibold ${scope === "only" ? "bg-primary text-black" : "bg-slate-50 text-slate-500"}`}>
                      Only "{activeInfo?.label}"
                    </button>
                    <button onClick={() => setScope("all")} className={`flex-1 py-2 text-xs font-semibold ${scope === "all" ? "bg-primary text-black" : "bg-slate-50 text-slate-500"}`}>
                      All designs
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" /> Colors
                  </p>
                  <div className="space-y-2">
                    {([["primary_color", "Primary"], ["secondary_color", "Secondary"], ["accent_color", "Accent"]] as const).map(([key, lbl]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{lbl}</span>
                        <input type="color" value={effectiveBrand[key]} onChange={(e) => updateBrand({ [key]: e.target.value } as Partial<PackageBrandKit>)} className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                    <TypeIcon className="h-3.5 w-3.5" /> Fonts
                  </p>
                  <div className="space-y-2">
                    <select value={effectiveBrand.font_heading} onChange={(e) => updateBrand({ font_heading: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm">
                      {FONT_CHOICES.map((f) => <option key={f} value={f}>{f} (Heading)</option>)}
                    </select>
                    <select value={effectiveBrand.font_body} onChange={(e) => updateBrand({ font_body: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm">
                      {FONT_CHOICES.map((f) => <option key={f} value={f}>{f} (Body)</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Background Pattern</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PATTERN_CHOICES.map((p) => (
                      <button key={p} onClick={() => updateBrand({ pattern: p })} className={`py-2 rounded-lg text-[11px] capitalize border ${effectiveBrand.pattern === p ? "border-primary text-primary bg-primary/10" : "border-slate-200 text-slate-500"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Logo</p>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <button onClick={() => logoInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 hover:bg-slate-50">
                    <Upload className="h-4 w-4" /> {effectiveBrand.logo_url ? "Replace Logo" : "Upload Logo"}
                  </button>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Headline Text</p>
                  <textarea value={getHeadline(activeCategory)} onChange={(e) => setHeadlineFor(activeCategory, e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm resize-none" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignPackageEditor;