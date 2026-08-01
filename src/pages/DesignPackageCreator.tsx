// src/pages/DesignPackageCreator.tsx
import { saveBrandKit } from "@/lib/eventBrandKit";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { DESIGN_CATEGORIES, DESIGN_PACKAGES, type DesignCategoryKey } from "@/lib/designPackages";

const DesignPackageCreator = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<"categories" | "packages">("categories");
  const [selected, setSelected] = useState<DesignCategoryKey[]>([]);

  const toggle = (key: DesignCategoryKey) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const goToEditor = async (packageKey: string) => {
  const pkg = DESIGN_PACKAGES.find((p) => p.key === packageKey)!;
  try {
    await saveBrandKit(eventId!, {
      ...pkg.brandKit,
      package_key: pkg.key,
      selected_categories: selected,
    });
    toast.success(`${pkg.name} applied to this event!`);
    navigate(
      `/dashboard/event/${eventId}/design/editor?package=${packageKey}&categories=${selected.join(",")}`
    );
  } catch (err: any) {
    toast.error("Failed to save brand kit: " + err.message);
  }
};

  return (
    <div className="min-h-screen bg-[#0f0a1f] text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={() => (step === "packages" ? setStep("categories") : navigate(-1))}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {step === "categories" ? (
          <>
            <h1 className="text-3xl font-black mb-2">What do you need for this event?</h1>
            <p className="text-gray-400 mb-8">
              Select every design type you want. We'll build a matching branded package for all of them.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
              {DESIGN_CATEGORIES.map((c) => {
                const isOn = selected.includes(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => toggle(c.key)}
                    className={`relative text-left p-5 rounded-2xl border transition-all ${
                      isOn
                        ? "border-primary bg-primary/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {isOn && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-black" />
                      </div>
                    )}
                    <p className="font-bold">{c.label}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {c.bulk ? "Auto-generated per participant" : "Single editable design"}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              disabled={selected.length === 0}
              onClick={() => setStep("packages")}
              className="px-6 py-3 rounded-xl bg-primary text-black font-bold disabled:opacity-40"
            >
              Continue with {selected.length} categor{selected.length === 1 ? "y" : "ies"} →
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-black mb-2">Choose a Brand Package</h1>
            <p className="text-gray-400 mb-8">
              Every design below — {selected.map((k) => DESIGN_CATEGORIES.find((c) => c.key === k)?.label).join(", ")}
              — will share the same colors, fonts, and style.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {DESIGN_PACKAGES.map((pkg) => (
                <div
                  key={pkg.key}
                  className="rounded-2xl overflow-hidden border border-white/10 bg-white/5"
                >
                  <div className="h-32" style={{ background: pkg.thumbnailGradient }} />
                  <div className="p-5">
                    <h3 className="font-bold text-lg">{pkg.name}</h3>
                    <p className="text-sm text-gray-400 mt-1 mb-4">{pkg.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selected.map((k) => (
                        <span key={k} className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-gray-300">
                          {DESIGN_CATEGORIES.find((c) => c.key === k)?.label}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => goToEditor(pkg.key)}
                      className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-200"
                    >
                      Use This Package
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DesignPackageCreator;