import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, Users, BarChart3, ArrowLeft, Pencil } from "lucide-react";
import DashboardSidebar, { type EventType } from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import EventCreationForm, { type EventFormData } from "../components/EventCreationForm";
import CustomEventForm, { type CustomEventFormData } from "../components/CustomEventForm";
import ParticipantManagement from "../components/ParticipantManagement";
import CustomParticipantManagement from "../components/CustomParticipantManagement";
import { cn } from "../lib/utils";

type View = "overview" | "participants";

interface DashboardEvent extends EventFormData {
  id: string;
}

const sampleEvents: DashboardEvent[] = [
  {
    id: "1",
    name: "Creovator Launch Event",
    startDate: "2026-05-01",
    endDate: "2026-05-02",
    venue: "JUW Auditorium",
    type: "tech",
    description: "Final Year Project Showcase",
  },
];

const validTypes = ["tech", "party", "wedding", "birthday", "others"];

const Index = () => {
  const [searchParams] = useSearchParams();
  const paramType = searchParams.get("type");
  const initialType = (validTypes.includes(paramType as string) ? paramType : "tech") as EventType;

  const [activeType, setActiveType] = useState<EventType>(initialType);
  const [showCreate, setShowCreate] = useState(false);
  const [showCustomCreate, setShowCustomCreate] = useState(false);
  const [events, setEvents] = useState<DashboardEvent[]>(sampleEvents);
  const [selectedEvent, setSelectedEvent] = useState<DashboardEvent | null>(null);
  const [view, setView] = useState<View>("overview");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editName, setEditName] = useState("");
  const [userName, setUserName] = useState("Organizer");

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUserName(userData.name || "Organizer");
      }
    } catch { setUserName("Organizer"); }
  }, []);

  useEffect(() => {
    if (selectedEvent) setEditName(selectedEvent.name);
  }, [selectedEvent]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredEvents = events.filter((e) => e.type === activeType);

  const stats = [
    { label: "Total Events", value: events.length, icon: CalendarDays, color: "text-primary" },
    { label: "This Category", value: filteredEvents.length, icon: BarChart3, color: "text-secondary" },
    {
      label: "Active Now",
      value: events.filter((e) => {
        const d = new Date(e.startDate);
        return !isNaN(d.getTime()) && d >= today;
      }).length,
      icon: Users,
      color: "text-success",
    },
  ];

  const handleUpdateEventName = () => {
    if (!selectedEvent) return;
    const updatedEvents = events.map((e) => (e.id === selectedEvent.id ? { ...e, name: editName } : e));
    setEvents(updatedEvents);
    setSelectedEvent({ ...selectedEvent, name: editName });
    setIsEditingTitle(false);
  };

  const handleCreateEvent = () => {
    if (activeType === "others") setShowCustomCreate(true);
    else setShowCreate(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        activeType={activeType}
        onTypeChange={(t) => {
          setActiveType(t);
          setView("overview");
          setSelectedEvent(null);
        }}
        onCreateEvent={handleCreateEvent}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <div className="flex-1 overflow-y-auto p-6">
          {view === "overview" ? (
            <div className="max-w-6xl mx-auto space-y-8">
              <h1 className="text-3xl font-bold text-foreground">Welcome, {userName} 👋</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((s) => (
                  <div key={s.label} className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <s.icon className={cn("h-5 w-5 mb-2", s.color)} />
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold capitalize text-foreground">{activeType} Events</h2>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => { setSelectedEvent(event); setView("participants"); }}
                      className="block w-full p-4 border border-border rounded-xl text-left hover:bg-accent/50 transition-colors"
                    >
                      <div className="font-semibold text-lg">{event.name}</div>
                      <div className="text-sm text-muted-foreground">{event.venue} • {event.startDate}</div>
                    </button>
                  ))
                ) : (
                  <p className="text-muted-foreground italic">No events found in this category.</p>
                )}
              </div>
            </div>
          ) : selectedEvent && (
            <div className="max-w-6xl mx-auto space-y-6">
              <button
                onClick={() => setView("overview")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Overview
              </button>

              <div className="flex items-center gap-4">
                {isEditingTitle ? (
                  <input
                    type="text"
                    placeholder="Enter event name"
                    className="text-3xl font-bold bg-transparent border-b-2 border-primary outline-none text-foreground"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleUpdateEventName}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdateEventName()}
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground">{selectedEvent.name}</h1>
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="p-2 hover:bg-accent rounded-full transition-colors"
                      aria-label="Edit event name"
                    >
                      <Pencil className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                {/* Yahan eventData={selectedEvent} pass kiya hai naye multi-day logic ke liye */}
                {selectedEvent.type === "others" ? (
                  <CustomParticipantManagement />
                ) : (
                  <ParticipantManagement 
                    eventType={selectedEvent.type as EventType} 
                    eventData={selectedEvent} 
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- Forms with Auto-Redirect Logic --- */}
      {showCreate && (
        <EventCreationForm 
          onClose={() => setShowCreate(false)} 
          onSubmit={(data) => {
            const newEvent = { ...data, id: Date.now().toString() };
            setEvents((prev) => [...prev, newEvent]);
            setSelectedEvent(newEvent);
            setView("participants");
            setShowCreate(false);
          }} 
        />
      )}

      {showCustomCreate && (
        <CustomEventForm 
          onClose={() => setShowCustomCreate(false)} 
          onSubmit={(data) => {
            const newEvent = { ...data, id: Date.now().toString(), type: "others" as EventType };
            setEvents((prev) => [...prev, newEvent]);
            setSelectedEvent(newEvent);
            setView("participants");
            setShowCustomCreate(false);
          }}
        />
      )}
    </div>
  );
};

export default Index;