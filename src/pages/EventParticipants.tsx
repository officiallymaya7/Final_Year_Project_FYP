import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import ParticipantManagement from "@/components/ParticipantManagement";

const EventParticipants = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (!error && data) {
        setEvent({ ...data, startDate: data.start_date, endDate: data.end_date });
      }
      setIsLoading(false);
    };
    load();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center gap-4">
        <p className="text-muted-foreground">Event not found.</p>
        <button onClick={() => navigate("/dashboard/manage")} className="text-primary underline text-sm">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <button
          onClick={() => navigate(`/dashboard/event/${eventId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {event.name} Workspace
        </button>
        <div className="bg-card border border-border rounded-2xl shadow-xl">
          <ParticipantManagement eventType={event.type} eventData={event} />
        </div>
      </div>
    </div>
  );
};

export default EventParticipants;