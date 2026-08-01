import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  fetchEventAssets,
  uploadEventAsset,
  deleteEventAsset,
  type EventAsset,
} from "@/lib/eventAssets";

interface MyElementsPanelProps {
  eventId: string;
  /** Called when the user clicks an asset to insert it into the canvas. */
  onInsert: (fileUrl: string) => void;
}

const MyElementsPanel = ({ eventId, onInsert }: MyElementsPanelProps) => {
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadAssets = async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const data = await fetchEventAssets(eventId);
      setAssets(data);
    } catch (err) {
      console.error(err);
      toast.error("My Elements load nahi ho sake.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;
    setIsUploading(true);
    try {
      const asset = await uploadEventAsset(file, eventId);
      setAssets((prev) => [asset, ...prev]);
      toast.success("Element save ho gaya!");
    } catch (err) {
      console.error(err);
      toast.error("Upload nahi ho saka.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (assetId: string) => {
    try {
      await deleteEventAsset(assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      toast.success("Element delete ho gaya.");
    } catch (err) {
      console.error(err);
      toast.error("Delete nahi ho saka.");
    }
  };

  if (!eventId) return null;

  return (
    <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">My Elements</p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-1.5"
        >
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      <p className="text-xs text-slate-500">
        Is event ke liye apni saved images yahan se seedha canvas pe daalein.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
          <ImagePlus className="w-6 h-6" />
          <p className="text-xs">Abhi koi element save nahi hua.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative aspect-square rounded-md overflow-hidden border border-slate-200 bg-white cursor-pointer"
              onClick={() => onInsert(asset.file_url)}
              title={`Insert ${asset.name}`}
            >
              <img
                src={asset.file_url}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(asset.id);
                }}
                className="absolute top-1 right-1 p-1 rounded bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyElementsPanel;