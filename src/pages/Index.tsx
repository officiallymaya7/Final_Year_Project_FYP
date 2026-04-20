import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, Users, BarChart3, ArrowLeft } from "lucide-react";
import DashboardSidebar, { type EventType } from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import EventCreationForm, { type EventFormData } from "@/components/EventCreationForm";
import CustomEventForm, { type CustomEventFormData } from "@/components/CustomEventForm";
import ParticipantManagement from "@/components/ParticipantManagement";
import CustomParticipantManagement from "@/components/CustomParticipantManagement";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type View = "overview" | "participants";

interface DashboardEvent extends EventFormData {
  id: string;
}

const sampleEvents: DashboardEvent[] = [
  { id: "1", name: "Hackathon 2026", date: "2026-04-15", venue: "Main Auditorium", type: "tech", description: "Annual coding hackathon" },
  { id: "2", name: "Spring Gala", date: "2026-05-10", venue: "Grand Ballroom", type: "party", description: "Formal spring celebration" },
  { id: "3", name: "AI Summit", date: "2026-06-20", venue: "Tech Center", type: "tech", description: "AI & ML conference" },
];

const typeColors: Record<EventType, string> = {
  tech: "bg-primary/20 text-primary",
  party: "bg-warning/20 text-warning",
  wedding: "bg-destructive/20 text-destructive",
  birthday: "bg-success/20 text-success",
  others: "bg-muted text-muted-foreground",
};

const Index = () => {
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as EventType) || "tech";
  const [activeType, setActiveType] = useState<EventType>(initialType);
  const [showCreate, setShowCreate] = useState(false);
  const [showCustomCreate, setShowCustomCreate] = useState(false);
  const [events, setEvents] = useState<DashboardEvent[]>(sampleEvents);
  const [selectedEvent, setSelectedEvent] = useState<DashboardEvent | null>(null);
  const [view, setView] = useState<View>("overview");

  // --- Dynamic User Logic ---
  const [userName, setUserName] = useState("Organizer");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserName(userData.name || "Organizer");
    }
  }, []);

  const userInitial = userName.charAt(0).toUpperCase();

  const filteredEvents = events.filter((e) => e.type === activeType);

  const handleCreate = (data: EventFormData) => {
    const newEvent: DashboardEvent = { ...data, id: crypto.randomUUID() };
    setEvents((prev) => [...prev, newEvent]);
    setShowCreate(false);
    setSelectedEvent(newEvent);
    setView("participants");
  };

  const handleCustomCreate = (data: CustomEventFormData) => {
    const newEvent: DashboardEvent = {
      id: crypto.randomUUID(),
      name: data.name,
      date: data.date,
      venue: data.venue,
      type: "others",
      description: `[${data.customType}] ${data.description}`,
    };
    setEvents((prev) => [...prev, newEvent]);
    setShowCustomCreate(false);
    setSelectedEvent(newEvent);
    setView("participants");
  };

  const handleCreateEvent = () => {
    if (activeType === "others") {
      setShowCustomCreate(true);
    } else {
      setShowCreate(true);
    }
  };

  const handleSelectEvent = (event: DashboardEvent) => {
    setSelectedEvent(event);
    setView("participants");
  };

  const stats = [
    { label: "Total Events", value: events.length, icon: CalendarDays, color: "text-primary" },
    { label: "This Category", value: filteredEvents.length, icon: BarChart3, color: "text-secondary" },
    { label: "Active Now", value: events.filter((e) => new Date(e.date) >= new Date()).length, icon: Users, color: "text-success" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        activeType={activeType}
        onTypeChange={(t) => { setActiveType(t); setView("overview"); setSelectedEvent(null); }}
        onCreateEvent={handleCreateEvent}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />

        <main className="flex-1 p-6 overflow-auto">
          {view === "overview" && (
            <div className="space-y-6 max-w-6xl">
              {/* Dynamic Welcome Section - REPLACED STATIC CONTENT */}
              <div className="bg-card border border-border/50 rounded-2xl p-8 mb-6 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/20">
                  {userInitial}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Welcome Back, {userName}! 👋
                  </h1>
                  <p className="text-muted-foreground mt-1 text-lg">
                    {activeType === "tech" ? "Tech Events" : activeType === "party" ? "Party Events" : activeType === "wedding" ? "Weddings" : activeType === "birthday" ? "Birthday Parties" : "Other Events"} Overview
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((s) => (
                  <div key={s.label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className={cn("w-10 h-10 rounded-lg bg-muted flex items-center justify-center", s.color)}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Event List */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/20">
                  <h2 className="font-semibold text-foreground">Active Events</h2>
                </div>
                {filteredEvents.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div>
                          <p className="font-medium text-foreground">{event.name}</p>
                          <p className="text-sm text-muted-foreground">{event.venue} · {event.date}</p>
                        </div>
                        <Badge className={cn("capitalize shadow-none", typeColors[event.type])}>{event.type}</Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-16 text-center text-muted-foreground">
                    <p className="text-lg">No events in this category yet.</p>
                    <p className="text-sm">Click "Create Event" to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "participants" && selectedEvent && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center gap-3">
                <button onClick={() => { setView("overview"); setSelectedEvent(null); }} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <span className="text-muted-foreground">/</span>
                <h1 className="text-xl font-bold text-foreground">{selectedEvent.name}</h1>
                <Badge className={cn("capitalize shadow-none", typeColors[selectedEvent.type])}>{selectedEvent.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground pl-1">{selectedEvent.venue} · {selectedEvent.date}</p>
              {selectedEvent.type === "others" ? (
                <CustomParticipantManagement />
              ) : (
                <ParticipantManagement eventType={selectedEvent.type} isCustomEvent={false} />
              )}
            </div>
          )}
        </main>
      </div>

      {showCreate && <EventCreationForm onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
      {showCustomCreate && <CustomEventForm onClose={() => setShowCustomCreate(false)} onSubmit={handleCustomCreate} />}
    </div>
  );
};

export default Index;