import { Palette, Type } from "lucide-react";
import MyElementsPanel from "@/components/MyElementsPanel";
import { saveBrandKit, fetchBrandKit, type EventBrandKit } from "@/lib/eventBrandKit";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EventAssetPackProps {
  eventId: string;
  eventName: string;
}

const DEFAULT_KIT = {
  primary_color: "#F9BB1E",
  secondary_color: "#1E3A8A",
  accent_color: "#0F0A1F",
  font_heading: "Arial",
  font_body: "Arial",
};

const EventAssetPack = ({ eventId, eventName }: EventAssetPackProps) => {
  const [brandKit, setBrandKit] = useState<EventBrandKit | Partial<EventBrandKit>>(DEFAULT_KIT);

  useEffect(() => {
    if (!eventId) return;
    fetchBrandKit(eventId).then((kit) => {
      if (kit) setBrandKit(kit);
    });
  }, [eventId]);

  const handleColorChange = async (field: keyof typeof DEFAULT_KIT, value: string) => {
    setBrandKit((prev) => ({ ...prev, [field]: value }));
    try {
      const updated = await saveBrandKit(eventId, { [field]: value } as Partial<EventBrandKit>);
      setBrandKit(updated);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save.");
    }
  };

  return (
    <div className="mb-12">
      <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6">
        {eventName} Asset Pack
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* My Elements: the one place for everything the user uploads for this event */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card/40 border border-white/5 backdrop-blur-xl">
          <p className="text-sm text-gray-400 mb-4">
            Logo, banner, certificate/ID card reference, social templates — jitni bhi files chahiye,
            saari yahan upload karein. Yeh sab Design Studio ke editor me bhi seedha milengi.
          </p>
          <div className="[&_.text-slate-900]:!text-white [&_.bg-slate-50]:!bg-white/5 [&_.border-slate-200]:!border-white/10 [&_.bg-white]:!bg-white/10">
            <MyElementsPanel eventId={eventId} onInsert={() => {}} />
          </div>
        </div>

        {/* Brand colors + fonts stay separate since they're single values, not files */}
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-card/40 border border-white/5 backdrop-blur-xl flex flex-col gap-3">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <Palette className="w-4 h-4" /> Brand Colors
            </span>
            <div className="flex gap-2">
              {(["primary_color", "secondary_color", "accent_color"] as const).map((field) => (
                <div key={field} className="flex-1 flex flex-col items-center gap-1">
                  <input
                    type="color"
                    value={brandKit[field] || DEFAULT_KIT[field]}
                    onChange={(e) => handleColorChange(field, e.target.value)}
                    className="w-full h-9 rounded cursor-pointer bg-transparent"
                  />
                  <span className="text-[9px] text-gray-500 uppercase">
                    {field.replace("_color", "")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card/40 border border-white/5 backdrop-blur-xl flex flex-col gap-3">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <Type className="w-4 h-4" /> Event Fonts
            </span>
            <input
              value={brandKit.font_heading || ""}
              onChange={(e) => handleColorChange("font_heading" as keyof typeof DEFAULT_KIT, e.target.value)}
              placeholder="Heading font (e.g. Georgia)"
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-gray-200"
            />
            <input
              value={brandKit.font_body || ""}
              onChange={(e) => handleColorChange("font_body" as keyof typeof DEFAULT_KIT, e.target.value)}
              placeholder="Body font (e.g. Arial)"
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-gray-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventAssetPack;