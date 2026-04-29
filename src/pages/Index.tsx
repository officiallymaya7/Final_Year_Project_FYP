import { toast } from 'sonner';
import CustomEventForm, { type CustomEventFormData } from "../components/CustomEventForm";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; 
import { CalendarDays, Users, ArrowLeft, Loader2, LayoutGrid, Sparkles, Trash2, AlertTriangle } from "lucide-react";
import DashboardSidebar, { type EventType } from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import EventCreationForm, { type EventFormData } from "../components/EventCreationForm";
import ParticipantManagement from "../components/ParticipantManagement";
import { cn } from "../lib/utils";

type View = "overview" | "participants";

// ✅ Delete Confirmation Modal Component
const DeleteConfirmModal = ({
  eventName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  eventName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
      {/* Icon */}
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mx-auto mb-4">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>

      {/* Text */}
      <h2 className="text-xl font-bold text-center text-foreground mb-2">Delete Event?</h2>
      <p className="text-sm text-muted-foreground text-center mb-1">
        You are about to permanently delete:
      </p>
      <p className="text-base font-semibold text-[#F9BB1E] text-center mb-4">
        "{eventName}"
      </p>
      <p className="text-xs text-muted-foreground text-center bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 mb-6">
        ⚠️ This will also delete all participants and lists linked to this event. This action cannot be undone.
      </p>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isDeleting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
          ) : (
            <><Trash2 className="h-4 w-4" /> Yes, Delete</>
          )}
        </button>
      </div>
    </div>
  </div>
);

const Index = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [view, setView] = useState<View>("overview");
  const [activeType, setActiveType] = useState<EventType>("tech");
  const [showCreate, setShowCreate] = useState(false);
  const [showCustomCreate, setShowCustomCreate] = useState(false);

  // ✅ Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: participantData } = await supabase
      .from('participants')
      .select('id, event_id');

    if (!eventsError && eventsData) {
      const formatted = eventsData.map(e => ({
        ...e,
        startDate: e.start_date,
        endDate: e.end_date
      }));
      setEvents(formatted);

      if (participantData) {
        const myEventIds = eventsData.map(e => e.id);
        const myParticipants = participantData.filter(p => myEventIds.includes(p.event_id));
        setTotalParticipants(myParticipants.length);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEventSubmit = async (formData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      const { data, error } = await supabase
        .from('events')
        .insert([{
          name: formData.name,
          start_date: formData.startDate,
          end_date: formData.endDate,
          venue: formData.venue || formData.dayVenues?.[0] || "",
          day_venues: formData.dayVenues,
          type: formData.type || formData.customType,
          description: formData.description,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchData();
      setSelectedEvent(data);
      setView("participants");
      setShowCreate(false);
      setShowCustomCreate(false);
      toast.success("Event created successfully!");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  // ✅ Delete handler — Supabase se event + participants delete karega
  const handleDeleteEvent = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      // Step 1: Participants delete karo pehle (foreign key safety)
      const { error: participantsError } = await supabase
        .from('participants')
        .delete()
        .eq('event_id', deleteTarget.id);

      if (participantsError) throw participantsError;

      // Step 2: Event days delete karo (agar table hai)
      await supabase
        .from('event_days')
        .delete()
        .eq('event_id', deleteTarget.id);

      // Step 3: Event khud delete karo
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', deleteTarget.id);

      if (eventError) throw eventError;

      toast.success(`"${deleteTarget.name}" deleted successfully!`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      toast.error("Delete failed: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = [
    { label: "Total Events", value: events.length, icon: CalendarDays, color: "text-primary" },
    { label: "Current View", value: activeType, icon: Sparkles, color: "text-purple-400" },
    { label: "Participants", value: totalParticipants.toLocaleString(), icon: Users, color: "text-success" },
  ];

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <DashboardSidebar
        activeType={activeType}
        onTypeChange={setActiveType}
        onCreateEvent={() => activeType === "tech" ? setShowCreate(true) : setShowCustomCreate(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <div className="flex-1 overflow-y-auto p-6">
          {view === "overview" ? (
            <div className="max-w-6xl mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-[#F9BB1E]">Welcome, Organizer 👋</h1>
                <p className="text-muted-foreground mt-1">Showing all your events and real-time data.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((s) => (
                  <div key={s.label} className="bg-card/50 backdrop-blur-md p-6 rounded-xl border border-border shadow-sm">
                    <s.icon className={cn("h-5 w-5 mb-2", s.color)} />
                    <div className="text-3xl font-bold">{s.value}</div>
                    <div className="text-sm text-muted-foreground font-medium uppercase">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    My Events
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.length > 0 ? (
                    events.map((event) => (
                      <div
                        key={event.id}
                        className="group p-5 border border-border rounded-xl text-left bg-card hover:border-primary/50 transition-all relative"
                      >
                        {/* ✅ Delete Button — top right corner */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ id: event.id, name: event.name });
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        {/* Card Content — click karne pe participants page */}
                        <button
                          className="w-full text-left"
                          onClick={() => { setSelectedEvent(event); setView("participants"); }}
                        >
                          <div className="flex justify-between items-start pr-8">
                            <div>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/10 text-primary mb-2 inline-block">
                                {event.type}
                              </span>
                              <div className="font-bold text-lg group-hover:text-[#F9BB1E]">{event.name}</div>
                              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
                                <span>📅 {event.startDate}</span>
                                <span>📍 {event.venue || "TBD"}</span>
                              </div>
                            </div>
                            <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground group-hover:text-primary transition-all mt-1" />
                          </div>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 border-2 border-dashed border-border rounded-2xl">
                      <p className="text-muted-foreground">No events found. Create your first event to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            selectedEvent && (
              <div className="max-w-6xl mx-auto space-y-6">
                <button
                  onClick={() => { setView("overview"); fetchData(); }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </button>
                <div className="bg-card border border-border rounded-2xl shadow-xl">
                  <ParticipantManagement eventType={selectedEvent.type} eventData={selectedEvent} />
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {/* ✅ Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          eventName={deleteTarget.name}
          onConfirm={handleDeleteEvent}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}

      {showCreate && (
        <EventCreationForm onClose={() => setShowCreate(false)} onSubmit={handleCreateEventSubmit} />
      )}

      {showCustomCreate && (
        <CustomEventForm onClose={() => setShowCustomCreate(false)} onSubmit={handleCreateEventSubmit} />
      )}
    </div>
  );
};

export default Index;