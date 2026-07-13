import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Canvas, StaticCanvas, Textbox, Rect, Circle, FabricImage } from "fabric";
import QRCode from "qrcode";
import {
  ArrowLeft, Loader2, Download, Save, Wand2
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getTemplatesForCategory, type GalleryTemplate } from "../lib/templateGallery";
import { downloadFile, downloadAllAsZip } from "../lib/downloadHelpers";
import { toast } from "sonner";

const DesigningPortal = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventId = params.get("event_id") || "";
  const listName = params.get("list_name") || "";
  const dayNumber = parseInt(params.get("day_number") || "1");
  const category = params.get("category") || "general";

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const pendingJsonRef = useRef<any>(null);

  const [step, setStep] = useState<"gallery" | "editor">("gallery");
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 850 });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isZipping, setIsZipping] = useState(false);

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
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <canvas ref={canvasElRef} className="shadow-2xl border-4 border-gray-300 rounded-xl" />
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
        c.loadFromJSON(json, () => c.renderAll());
      }
    });
    return () => c?.dispose();
  }, [template]);
  return <canvas ref={ref} className="w-full border rounded-lg" />;
};

export default DesigningPortal;