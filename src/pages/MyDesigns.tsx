import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Trash2, Pencil, Palette, Loader2 } from "lucide-react";
import { categoryLabels, type DesignCategory } from "@/design/designTemplate";

interface SavedDesign {
  id: string;
  template_id: string;
  name: string;
  category: DesignCategory;
  thumbnail_url: string | null;
  created_at: string;
}

const MyDesigns = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDesigns = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("designs")
      .select("id, template_id, name, category, thumbnail_url, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Designs load nahi ho sakin. Supabase table check karein.");
      console.error(error);
    } else {
      setDesigns(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("designs").delete().eq("id", id);
    if (error) {
      toast.error("Delete nahi ho saka.");
    } else {
      toast.success("Design delete ho gayi.");
      setDesigns((prev) => prev.filter((d) => d.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">My Designs</h1>
          </div>
          <Button onClick={() => navigate("/dashboard/design")} variant="outline">
            + New Design
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading your designs...
          </div>
        )}

        {!loading && designs.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <p className="mb-4">Abhi tak koi design save nahi ki gayi.</p>
            <Button onClick={() => navigate("/dashboard/design")}>
              Design Studio mein jayein
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {designs.map((d) => (
            <div
              key={d.id}
              className="group rounded-xl border border-border overflow-hidden bg-card hover:shadow-lg transition-all"
            >
              <div
                className="h-40 w-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => navigate(`/dashboard/design/saved/${d.id}`)}
              >
                {d.thumbnail_url ? (
                  <img
                    src={d.thumbnail_url}
                    alt={d.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No preview</span>
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="font-medium text-sm truncate">{d.name}</p>
                <Badge variant="secondary" className="text-xs capitalize">
                  {categoryLabels[d.category] || d.category}
                </Badge>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 gap-1"
                    onClick={() => navigate(`/dashboard/design/saved/${d.id}`)}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === d.id}
                    onClick={() => handleDelete(d.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyDesigns;