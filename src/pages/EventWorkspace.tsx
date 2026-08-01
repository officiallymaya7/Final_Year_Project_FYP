import { fetchBrandKit, type EventBrandKit } from "@/lib/eventBrandKit";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Users, Palette, Award, CreditCard, Mail,
  QrCode, Sparkles, CalendarDays, MapPin, Loader2, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import EventAssetPack from "@/components/EventAssetPack";

interface EventRow {
  id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  venue: string | null;
  description: string | null;
}

interface WorkspaceStats {
  participants: number;
  certificates: number;
  checkedIn: number;
}

const EventWorkspace = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [stats, setStats] = useState<WorkspaceStats>({ participants: 0, certificates: 0, checkedIn: 0 });
  const [brandKit, setBrandKit] = useState<EventBrandKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      setIsLoading(true);

      const { data: eventData, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (!error && eventData) setEvent(eventData as EventRow);

      const kit = await fetchBrandKit(eventId);
      setBrandKit(kit);

      const [{ count: participantsCount }, { count: certificatesCount }, { count: checkedInCount }] =
        await Promise.all([
          supabase.from("participants").select("*", { count: "exact", head: true }).eq("event_id", eventId),
          supabase.from("certificates").select("*", { count: "exact", head: true }).eq("event_id", eventId),
          supabase.from("attendance").select("*", { count: "exact", head: true }).eq("event_id", eventId),
        ]);

      setStats({
        participants: participantsCount || 0,
        certificates: certificatesCount || 0,
        checkedIn: checkedInCount || 0,
      });

      setIsLoading(false);
    };
    load();
  }, [eventId]);

  const hasSavedPackage = !!(brandKit?.package_key && brandKit?.selected_categories?.length);

  const modules = [
    {
      key: "participants",
      title: "Participants & Lists",
      description: "Manage guest lists, categories, and import/export data. Start here to generate certificates or ID cards for a list.",
      icon: Users,
      accent: "text-primary",
      bg: "from-primary/25 to-primary/5",
      onClick: () => navigate(`/dashboard/event/${eventId}/participants`),
    },
    {
      key: "designer",
      title: "Design Studio",
      description: hasSavedPackage
        ? "Continue your saved brand package — certificates, posters, banners & more."
        : "Pick your brand package once — it applies across certificates, posters, banners & more.",
      icon: Palette,
      accent: "text-secondary",
      bg: "from-secondary/25 to-secondary/5",
      onClick: () => {
        if (hasSavedPackage) {
          navigate(
            `/dashboard/event/${eventId}/design/editor?package=${brandKit!.package_key}&categories=${brandKit!.selected_categories.join(",")}`
          );
        } else {
          navigate(`/dashboard/event/${eventId}/design`);
        }
      },
    },
    {
      key: "certificates",
      title: "Certificates",
      description: "Open a participant list first, then generate certificates for it.",
      icon: Award,
      accent: "text-[#f9bb1e]",
      bg: "from-[#f9bb1e]/25 to-[#f9bb1e]/5",
      onClick: () => navigate(`/dashboard/event/${eventId}/participants`),
    },
    {
      key: "id-cards",
      title: "ID Cards",
      description: "Open a participant list first, then design & export ID cards.",
      icon: CreditCard,
      accent: "text-cyan-400",
      bg: "from-cyan-400/25 to-cyan-400/5",
      onClick: () => navigate(`/dashboard/event/${eventId}/participants`),
    },
    {
      key: "emails",
      title: "Email Automation",
      description: "Send bulk or individual emails to participants.",
      icon: Mail,
      accent: "text-pink-400",
      bg: "from-pink-400/25 to-pink-400/5",
      onClick: () => navigate(`/dashboard/email-automation?event_id=${eventId}`),
    },
    {
      key: "qr-scan",
      title: "QR Check-in",
      description: "Scan participant QR codes and mark attendance live.",
      icon: QrCode,
      accent: "text-green-400",
      bg: "from-green-400/25 to-green-400/5",
      onClick: () => navigate(`/dashboard/qr-scan?event_id=${eventId}`),
    },
    {
      key: "content",
      title: "Content Studio (AI)",
      description: "Generate invitation emails, announcements & speaker letters with AI.",
      icon: Sparkles,
      accent: "text-purple-400",
      bg: "from-purple-400/25 to-purple-400/5",
      onClick: () => navigate(`/dashboard/content-generation`),
    },
  ];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0a1f]">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0f0a1f] text-center gap-4">
        <p className="text-muted-foreground">Event not found.</p>
        <button onClick={() => navigate("/dashboard/manage")} className="text-primary underline text-sm">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0a1f] text-foreground">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => navigate("/dashboard/manage")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        {/* Event header */}
        <div className="mb-10">
          <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
            {event.type}
          </span>
          <h1 className="text-4xl font-black text-white mb-3">{event.name}</h1>
          <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" /> {event.start_date} → {event.end_date}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {event.venue}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-gray-400 mt-3 max-w-2xl leading-relaxed">{event.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-[1.5rem] bg-card/40 border border-white/5 backdrop-blur-xl">
            <Users className="h-5 w-5 text-primary mb-2" />
            <div className="text-3xl font-black text-white">{stats.participants}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Participants</div>
          </div>
          <div className="p-6 rounded-[1.5rem] bg-card/40 border border-white/5 backdrop-blur-xl">
            <Award className="h-5 w-5 text-[#f9bb1e] mb-2" />
            <div className="text-3xl font-black text-white">{stats.certificates}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Certificates Issued</div>
          </div>
          <div className="p-6 rounded-[1.5rem] bg-card/40 border border-white/5 backdrop-blur-xl">
            <CheckCircle2 className="h-5 w-5 text-green-400 mb-2" />
            <div className="text-3xl font-black text-white">{stats.checkedIn}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Checked In</div>
          </div>
        </div>

        {/* Event Asset Pack */}
        <EventAssetPack eventId={event.id} eventName={event.name} />

        {/* Module tiles */}
        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6">Workspace Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => (
            <button
              key={m.key}
              onClick={m.onClick}
              className={`group relative bg-gradient-to-br ${m.bg} border border-white/5 rounded-[2rem] p-7 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#0f0a1f]/60 backdrop-blur-md flex items-center justify-center mb-5 border border-white/10 group-hover:scale-110 transition-all">
                <m.icon className={`w-6 h-6 ${m.accent}`} />
              </div>
              <h3 className="text-lg font-black mb-2 text-white group-hover:text-primary transition-colors">
                {m.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                {m.description}
              </p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default EventWorkspace;