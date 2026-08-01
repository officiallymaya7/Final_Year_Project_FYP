import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronDown, ChevronRight, CalendarDays, Clock, Palette, Image as ImageIcon } from "lucide-react";
import creovatorLogo from "@/assets/creovator-logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export type EventType = "tech" | "party" | "wedding" | "birthday" | "others";

interface SidebarEvent {
  id: string;
  name: string;
  type: EventType;
  startDate: string;
}

interface SavedDesignPreview {
  id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
}

interface SidebarProps {
  activeType: EventType;
  onTypeChange: (type: EventType) => void;
  onCreateEvent: () => void;
  collapsed?: boolean;
  events?: SidebarEvent[];
  onEventClick?: (event: SidebarEvent) => void;
}

const DashboardSidebar = ({
  activeType,
  onTypeChange,
  onCreateEvent,
  collapsed,
  events = [],
  onEventClick,
}: SidebarProps) => {
  const [myEventsExpanded, setMyEventsExpanded] = useState(false);
  const [myDesignsExpanded, setMyDesignsExpanded] = useState(false);
  const [designs, setDesigns] = useState<SavedDesignPreview[]>([]);
  const [designsLoaded, setDesignsLoaded] = useState(false);
  const navigate = useNavigate();

  // Fetch saved designs only once, the first time the dropdown is opened
  useEffect(() => {
    if (!myDesignsExpanded || designsLoaded) return;

    const loadDesigns = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setDesignsLoaded(true);
        return;
      }
      const { data } = await supabase
        .from("designs")
        .select("id, name, category, thumbnail_url")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setDesigns(data || []);
      setDesignsLoaded(true);
    };

    loadDesigns();
  }, [myDesignsExpanded, designsLoaded]);

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border overflow-hidden">
        <img
          src={creovatorLogo}
          alt="Creovator"
          className="h-14 w-auto object-contain scale-[2.5] origin-left"
        />
      </div>

      {/* Create Event Button */}
      <div className="p-4 space-y-2">
        <Button onClick={onCreateEvent} className="w-full gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
        <Button
          onClick={() => navigate("/dashboard/design")}
          variant="outline"
          className="w-full gap-2"
        >
          <Palette className="w-4 h-4" />
          Design Studio
        </Button>
      </div>

      {/* My Events + My Designs */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-1">
        {/* My Events Dropdown */}
        <div>
          <button
            onClick={() => setMyEventsExpanded(!myEventsExpanded)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
              myEventsExpanded
                ? "bg-accent text-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              My Events
            </div>
            {myEventsExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {myEventsExpanded && (
            <ul className="mt-1 space-y-0.5 pl-2">
              {events.length > 0 ? (
                events.map((event) => (
                  <li key={event.id}>
                    <button
                      onClick={() => onEventClick?.(event)}
                      className="flex items-start gap-2.5 w-full px-3 py-2 rounded-lg text-left hover:bg-sidebar-accent transition-all group"
                    >
                      <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground group-hover:text-accent-foreground truncate">
                          {event.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {event.type} · {event.startDate}
                        </p>
                      </div>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-3 text-xs text-muted-foreground italic">
                  No events yet. Create one!
                </li>
              )}
            </ul>
          )}
        </div>

        {/* My Designs Dropdown */}
        <div>
          <button
            onClick={() => setMyDesignsExpanded(!myDesignsExpanded)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
              myDesignsExpanded
                ? "bg-accent text-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              My Designs
            </div>
            {myDesignsExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {myDesignsExpanded && (
            <ul className="mt-1 space-y-0.5 pl-2">
              {!designsLoaded ? (
                <li className="px-3 py-3 text-xs text-muted-foreground italic">Loading...</li>
              ) : designs.length > 0 ? (
                <>
                  {designs.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => navigate(`/dashboard/design/saved/${d.id}`)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left hover:bg-sidebar-accent transition-all group"
                      >
                        {d.thumbnail_url ? (
                          <img
                            src={d.thumbnail_url}
                            alt={d.name}
                            className="w-8 h-8 rounded object-cover shrink-0 border border-sidebar-border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-muted shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-sidebar-foreground group-hover:text-accent-foreground truncate">
                            {d.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground capitalize">
                            {d.category}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => navigate("/dashboard/design/my")}
                      className="w-full px-3 py-2 text-xs font-medium text-primary hover:underline text-left"
                    >
                      View all designs →
                    </button>
                  </li>
                </>
              ) : (
                <li className="px-3 py-3 text-xs text-muted-foreground italic">
                  No designs yet. Try Design Studio!
                </li>
              )}
            </ul>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">© 2026 Creovator</p>
      </div>
    </aside>
  );
};

export default DashboardSidebar;