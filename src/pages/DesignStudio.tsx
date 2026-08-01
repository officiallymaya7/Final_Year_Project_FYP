import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette } from "lucide-react";
import {
  designTemplates,
  categoryLabels,
  type DesignCategory,
} from "@/design/designTemplate";

const categories: (DesignCategory | "all")[] = [
  "all",
  "tech",
  "wedding",
  "party",
  "birthday",
  "others",
];

const DesignStudio = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<DesignCategory | "all">("all");

  const filtered =
    activeCategory === "all"
      ? designTemplates
      : designTemplates.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Creative gradient workspace */}
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#120a26]">
        {/* Glowing decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-32 w-[420px] h-[420px] rounded-full bg-indigo-600/40 blur-[110px]" />
          <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-fuchsia-600/30 blur-[130px]" />
          <div className="absolute bottom-0 left-1/4 w-[380px] h-[380px] rounded-full bg-purple-500/30 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:28px_28px]" />
        </div>

        <div className="relative p-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Palette className="w-5 h-5 text-fuchsia-300" />
            </div>
            <h1 className="text-2xl font-bold text-white">Design Studio</h1>
          </div>
          <p className="text-slate-300/80 mb-6">
            Choose an editable template for posters, banners, invitations, and flyers —
            for tech events and beyond. Click a template to customize text, colors, and download.
          </p>

          <Tabs
            value={activeCategory}
            onValueChange={(v) => setActiveCategory(v as DesignCategory | "all")}
            className="mb-8"
          >
            <TabsList className="flex flex-wrap h-auto gap-1 bg-white/5 backdrop-blur-sm border border-white/10 p-1">
              {categories.map((c) => (
                <TabsTrigger
                  key={c}
                  value={c}
                  className="capitalize text-slate-300 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  {c === "all" ? "All Templates" : categoryLabels[c]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tpl) => (
              <div
                key={tpl.id}
                className="group rounded-xl overflow-hidden bg-white/95 backdrop-blur-sm border border-white/10 hover:shadow-2xl hover:shadow-fuchsia-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/dashboard/design/editor/${tpl.id}`)}
              >
                <div className="h-44 w-full bg-slate-50 relative flex items-center justify-center">
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: tpl.thumbBg }}
                  />
                  <div
                    className="w-24 h-32 rounded-md shadow-md border border-slate-200"
                    style={{ background: tpl.thumbBg }}
                  />
                  <span className="absolute bottom-3 right-3 text-[11px] font-medium px-2 py-1 rounded-full bg-white/90 text-slate-600 border border-slate-200">
                    {tpl.kind}
                  </span>
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center">
                    <Button
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Use This Template
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1 text-slate-900">{tpl.name}</h3>
                  <Badge variant="secondary" className="text-xs capitalize bg-slate-100 text-slate-600">
                    {categoryLabels[tpl.category]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-20">
              No templates in this category yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignStudio;