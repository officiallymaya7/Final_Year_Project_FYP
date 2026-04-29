import { toast } from 'sonner';
import CustomEventForm, { type CustomEventFormData } from "../components/CustomEventForm";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; 
import { CalendarDays, Users, ArrowLeft, Loader2, Laptop, LayoutGrid, Sparkles } from "lucide-react";
import DashboardSidebar, { type EventType } from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import EventCreationForm, { type EventFormData } from "../components/EventCreationForm";
import ParticipantManagement from "../components/ParticipantManagement";
import { cn } from "../lib/utils";

type View = "overview" | "participants";

const Index = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [view, setView] = useState<View>("overview");
  const [activeType, setActiveType] = useState<EventType>("tech");
  const [showCreate, setShowCreate] = useState(false);
  const [showCustomCreate, setShowCustomCreate] = useState(false); // 🔥 Added for custom form support

  // 🔹 Data fetch karne ki logic
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

  // 🔹 Naya Event Save karna (Updated with Redirection)
  const handleCreateEventSubmit = async (formData: any) => {
    console.log("Submitting Form Data:", formData);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            name: formData.name,
            start_date: formData.startDate,
            end_date: formData.endDate,
            venue: formData.venue || formData.dayVenues?.[0] || "",
            day_venues: formData.dayVenues, 
            type: formData.type || formData.customType,
            description: formData.description,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchData();
      // ✨ Yeh do lines aapko foran participant page par le jayengi
      setSelectedEvent(data); 
      setView("participants"); 
      
      setShowCreate(false);
      setShowCustomCreate(false);
      toast.success("Event created successfully!");

    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error: " + error.message);
    }
  };

  const stats = [
    { label: "Total Events", value: events.length, icon: CalendarDays, color: "text-primary" },
    { label: "Current View", value: activeType, icon: Sparkles, color: "text-purple-400" },
    { label: "Participants", value: totalParticipants.toLocaleString(), icon: Users, color: "text-success" },
  ];

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar logic updated to handle both form types */}
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
                      <button
                        key={event.id}
                        onClick={() => { setSelectedEvent(event); setView("participants"); }}
                        className="group p-5 border border-border rounded-xl text-left bg-card hover:border-primary/50 transition-all"
                      >
                        <div className="flex justify-between items-start">
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
                          <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground group-hover:text-primary transition-all" />
                        </div>
                      </button>
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
                <button onClick={() => { setView("overview"); fetchData(); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold text-[#F9BB1E]">{selectedEvent.name} <span className="text-sm font-normal text-muted-foreground">({selectedEvent.type})</span></h1>
                <div className="bg-card border border-border rounded-2xl shadow-xl">
                  <ParticipantManagement eventType={selectedEvent.type} eventData={selectedEvent} />
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {/* Standard Form */}
      {showCreate && (
        <EventCreationForm onClose={() => setShowCreate(false)} onSubmit={handleCreateEventSubmit} />
      )}

      {/* Custom Form 🔥 */}
      {showCustomCreate && (
        <CustomEventForm onClose={() => setShowCustomCreate(false)} onSubmit={handleCreateEventSubmit} />
      )}
    </div>
  );
};

export default Index;