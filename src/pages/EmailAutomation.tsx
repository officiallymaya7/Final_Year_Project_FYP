import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Send, Loader2, CheckCircle2, XCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";

interface EventRow {
  id: string;
  name: string;
}

interface ParticipantRow {
  id: string;
  name: string;
  email: string | null;
  list_name: string;
}

const EmailAutomation = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // Load text passed in from Content Generation
  useEffect(() => {
    const state = location.state as { generatedContent?: string } | null;
    if (state?.generatedContent) {
      setContent(state.generatedContent);
    }
  }, [location.state]);

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("events")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setEvents(data || []);
      const preselect = searchParams.get("event_id");
      if (preselect) setSelectedEventId(preselect);
    };
    loadEvents();
  }, []);

  // Load participants for the selected event
  useEffect(() => {
    if (!selectedEventId) {
      setParticipants([]);
      return;
    }
    const loadParticipants = async () => {
      setLoadingParticipants(true);
      const { data } = await supabase
        .from("participants")
        .select("id, name, email, list_name")
        .eq("event_id", selectedEventId);
      setParticipants(data || []);
      setSelectedIds(new Set());
      setLoadingParticipants(false);
    };
    loadParticipants();
  }, [selectedEventId]);

  const toggleParticipant = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const withEmail = participants.filter((p) => p.email);
    if (selectedIds.size === withEmail.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(withEmail.map((p) => p.id)));
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast({ variant: "destructive", title: "Subject and content are required" });
      return;
    }
    if (selectedIds.size === 0) {
      toast({ variant: "destructive", title: "Select at least one participant" });
      return;
    }

    setSending(true);
    // TODO: Connect Resend Edge Function here (next step)
    setTimeout(() => {
      toast({ title: "This feature is still under development — sending not connected yet" });
      setSending(false);
    }, 1000);
  };

  const participantsWithEmail = participants.filter((p) => p.email);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Email Automation</h1>
            <p className="text-sm text-muted-foreground">
              Select an event, choose participants, and send emails.
            </p>
          </div>
        </div>

        {/* Step 1 - Event select */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-5 space-y-3">
          <label className="text-sm font-medium">1. Select an Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">-- Choose an event --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2 - Participants select */}
        {selectedEventId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" /> 2. Select Participants
              </label>
              {participantsWithEmail.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-xs text-primary hover:underline"
                >
                  {selectedIds.size === participantsWithEmail.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            {loadingParticipants ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : participants.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No participants found for this event.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {participants.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                      !p.email
                        ? "opacity-50 cursor-not-allowed border-border/30"
                        : selectedIds.has(p.id)
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:bg-accent/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={!p.email}
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleParticipant(p.id)}
                        className="accent-primary"
                      />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.list_name}</p>
                      </div>
                    </div>
                    {p.email ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {p.email}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="w-3.5 h-3.5" /> No email
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3 - Subject + Content */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-5 space-y-3">
          <label className="text-sm font-medium">3. Write the Email</label>
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-background border-border/50"
          />
          <Textarea
            placeholder="Email content will appear here (from Content Generation, or write your own)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[220px] bg-background border-border/50 resize-none"
          />
        </div>

        {/* Step 4 - Send */}
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={sending}
            className="gap-2 shadow-lg shadow-primary/20"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send to {selectedIds.size} participant{selectedIds.size !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailAutomation;