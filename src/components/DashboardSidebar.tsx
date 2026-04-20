import { useState } from "react";
import {
  Monitor, PartyPopper, Heart, Cake, LayoutGrid, Plus, ChevronDown, ChevronRight,
} from "lucide-react";
import creovatorLogo from "@/assets/creovator-logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EventType = "tech" | "party" | "wedding" | "birthday" | "others";

interface SidebarProps {
  activeType: EventType;
  onTypeChange: (type: EventType) => void;
  onCreateEvent: () => void;
  collapsed?: boolean;
}

const eventTypes: { key: EventType; label: string; icon: typeof Monitor }[] = [
  { key: "tech", label: "Tech Events", icon: Monitor },
  { key: "party", label: "Party Events", icon: PartyPopper },
  { key: "wedding", label: "Weddings", icon: Heart },
  { key: "birthday", label: "Birthday Parties", icon: Cake },
  { key: "others", label: "Others", icon: LayoutGrid },
];

const DashboardSidebar = ({ activeType, onTypeChange, onCreateEvent, collapsed }: SidebarProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <img src={creovatorLogo} alt="Creovator" className="h-10 object-contain" />
      </div>

      {/* Create Event Button */}
      <div className="p-4">
        <Button onClick={onCreateEvent} className="w-full gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Event Types */}
      <nav className="flex-1 px-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-full"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Event Types
        </button>
        {expanded && (
          <ul className="space-y-1">
            {eventTypes.map((et) => (
              <li key={et.key}>
                <button
                  onClick={() => onTypeChange(et.key)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    activeType === et.key
                      ? "bg-accent text-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <et.icon className="w-4 h-4" />
                  {et.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">© 2026 Creovator</p>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
