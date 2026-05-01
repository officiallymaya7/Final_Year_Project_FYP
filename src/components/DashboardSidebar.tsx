import { useState } from "react";
import { Plus, ChevronDown, ChevronRight, CalendarDays, Clock } from "lucide-react";
import creovatorLogo from "@/assets/creovator-logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EventType = "tech" | "party" | "wedding" | "birthday" | "others";

interface SidebarEvent {
  id: string;
  name: string;
  type: EventType;
  startDate: string;
}

interface SidebarProps {
  activeType: EventType;
  onTypeChange: (type: EventType) => void;
  onCreateEvent: () => void;
  collapsed?: boolean;
  // My Events dropdown ke liye
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

      {/* My Events Dropdown */}
      <nav className="flex-1 px-3 overflow-y-auto">
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

        {/* Events List — history style */}
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
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">© 2026 Creovator</p>
      </div>
    </aside>
  );
};

export default DashboardSidebar;