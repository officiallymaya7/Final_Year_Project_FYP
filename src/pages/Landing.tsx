import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Monitor, PartyPopper, ArrowRight, Sparkles,
  CheckCircle2, Activity, CalendarCheck, Users, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import heroBg from "@/assets/hero-events.jpg";

const organizerTips = [
  "Tip: Switch to Calendar view to see your upcoming event timeline.",
  "Pro Tip: You can now batch-export certificates directly from the Design Queue.",
  "Reminder: Check your 'Tech Events' category for new participant registrations.",
  "Design Hint: AI-generated posters work best with high-resolution event logos.",
  "Efficiency Tip: Use the 'My Events' tab to quickly duplicate previous event settings."
];

const eventCards = [
  {
    key: "tech",
    title: "Tech Events",
    description: "Hackathons, conferences, summits with exhibitors, judges & volunteers.",
    icon: Monitor,
    gradient: "from-primary/30 to-primary/10",
    border: "border-primary/30",
  },
  {
    key: "party",
    title: "Party / Wedding / Birthday",
    description: "Manage guest lists and send beautiful invitation cards.",
    icon: PartyPopper,
    gradient: "from-secondary/30 to-secondary/10",
    border: "border-secondary/30",
  },
  {
    key: "others",
    title: "Custom Events",
    description: "Create your own event type with fully customizable participant lists.",
    icon: Sparkles,
    gradient: "from-accent/40 to-accent/10",
    border: "border-accent/40",
  },
];

const TYPE_COLORS: Record<string, string> = {
  tech:     "#6366f1",
  party:    "#f9bb1e",
  wedding:  "#ec4899",
  birthday: "#f97316",
  others:   "#22d3ee",
};

const TYPE_LABELS: Record<string, string> = {
  tech:     "Tech",
  party:    "Party",
  wedding:  "Wedding",
  birthday: "Birthday",
  others:   "Others",
};

const DonutChart = ({ data }: { data: { type: string; count: number }[] }) => {
  const size = 110;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-2">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#ffffff10" strokeWidth={strokeWidth}
          />
        </svg>
        <p className="text-xs text-gray-500 font-medium">No events yet</p>
      </div>
    );
  }

  let offset = 0;
  const segments = data.map((d) => {
    const pct = d.count / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const seg = { ...d, dash, gap, offset, pct };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="relative shrink-0">
        <svg
          width={size} height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#ffffff08" strokeWidth={strokeWidth}
          />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke={TYPE_COLORS[seg.type] || "#6366f1"}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white">{total}</span>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Events</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: TYPE_COLORS[seg.type] || "#6366f1" }}
            />
            <span className="text-[11px] text-gray-300 font-medium truncate">
              {TYPE_LABELS[seg.type] || seg.type}
            </span>
            <span className="text-[11px] text-gray-500 ml-auto pl-2 font-bold shrink-0">
              {seg.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Small floating "building block" icon used to give a sense of events being assembled
const FloatingChip = ({
  icon: Icon,
  className,
  delay = "0s",
}: {
  icon: typeof CalendarCheck;
  className: string;
  delay?: string;
}) => (
  <div
    className={`absolute hidden md:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg animate-float ${className}`}
    style={{ animationDelay: delay }}
  >
    <Icon className="w-5 h-5 text-white/90" />
  </div>
);

const Landing = () => {
  const navigate = useNavigate();
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [randomTip, setRandomTip] = useState("");
  const [eventTypeDist, setEventTypeDist] = useState<{ type: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      const name = profileData?.full_name || user.user_metadata?.full_name || "Organizer";
      setUserName(name);

      const { data: eventsData, error } = await supabase
        .from("events")
        .select("type")
        .eq("user_id", user.id);

      if (!error && eventsData) {
        const counts: Record<string, number> = {};
        eventsData.forEach((e: any) => {
          const t = (e.type || "others").toLowerCase();
          counts[t] = (counts[t] || 0) + 1;
        });
        setEventTypeDist(Object.entries(counts).map(([type, count]) => ({ type, count })));
      }
    } catch (err) {
      console.error("DB Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const authType = localStorage.getItem("authType");
    if (authType === "signup") setWelcomeMsg("Welcome 👋");
    else if (authType === "login") setWelcomeMsg("Welcome Back 👋");

    setRandomTip(organizerTips[Math.floor(Math.random() * organizerTips.length)]);
    fetchStats();

    return () => { localStorage.removeItem("authType"); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#160d33] via-[#1a0f38] to-[#150c2e] text-foreground selection:bg-primary/30 relative overflow-hidden">

      {/* Local keyframes for the gentle floating "building block" chips */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        .animate-float {
          animation: float-slow 5s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient glow blobs, same family as Design Studio */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-indigo-600/25 blur-[120px]" />
        <div className="absolute top-1/4 -right-32 w-[480px] h-[480px] rounded-full bg-fuchsia-600/20 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 w-[380px] h-[380px] rounded-full bg-purple-500/20 blur-[120px]" />
      </div>

      <DashboardHeader />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <h2 className="text-4xl font-black tracking-tight text-white">
            {welcomeMsg || `Hello, ${userName || "Organizer"}`}
          </h2>
          <p className="text-muted-foreground mt-2 font-medium">
            Your event management pipeline is live and synced.
          </p>
        </div>

        <section className="relative w-full rounded-[3rem] overflow-hidden min-h-[420px] shadow-2xl group border border-white/10 mb-8 animate-in fade-in-0 slide-in-from-bottom-6 duration-700">
          <img
            src={heroBg} alt="Hero"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#160d33]/95 via-[#160d33]/60 to-[#160d33]/10" />

          {/* Floating "building the event" chips */}
          <FloatingChip icon={CalendarCheck} className="top-16 right-[22%]" delay="0s" />
          <FloatingChip icon={Users} className="top-1/2 right-[10%]" delay="1.2s" />
          <FloatingChip icon={Layers} className="bottom-16 right-[30%]" delay="2.1s" />

          <div className="relative h-full flex flex-col justify-center px-10 sm:px-16 py-12">
            <Badge className="w-fit mb-6 bg-primary/20 text-primary border-primary/40 px-4 py-1 backdrop-blur-md uppercase tracking-[0.2em] text-[10px] font-black animate-in fade-in-0 slide-in-from-left-4 duration-700">
              Event Automation Hub
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-black mb-6 leading-[1.1] text-white animate-in fade-in-0 slide-in-from-left-6 duration-700 delay-100">
              Revolutionize <br />
              <span className="text-[#f9bb1e] italic text-5xl sm:text-7xl">Events.</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-md mb-10 leading-relaxed font-medium animate-in fade-in-0 slide-in-from-left-6 duration-700 delay-200">
              The ultimate workspace for smart event organization and automated asset generation.
            </p>
            <Button
              className="w-fit gap-3 h-14 px-10 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all hover:-translate-y-1 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300"
              onClick={() => navigate("/dashboard/manage")}
            >
              OPEN DASHBOARD <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

          <div
            className="group flex flex-col gap-3 p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-primary/40 backdrop-blur-xl transition-all shadow-xl cursor-pointer animate-in fade-in-0 slide-in-from-bottom-4 duration-700"
            onClick={() => navigate('/dashboard/manage')}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs font-black text-white uppercase tracking-wider">
                Event Distribution
              </p>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100" />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200" />
              </div>
            ) : (
              <DonutChart data={eventTypeDist} />
            )}
          </div>

          <div className="group flex gap-5 items-center p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-secondary/40 backdrop-blur-xl transition-all shadow-xl animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:rotate-12 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-wider">Smart Features</p>
              <p className="text-[11px] text-gray-400 font-medium mt-1">New tools and enhancements are on the way!</p>
            </div>
          </div>

          <div className="group flex gap-5 items-center p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-green-500/40 backdrop-blur-xl transition-all shadow-xl animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
            <div className="bg-green-500/10 p-4 rounded-2xl text-green-500 group-hover:rotate-12 transition-transform">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-wider">System Ready</p>
              <p className="text-[11px] text-gray-400 font-medium mt-1">All design modules are online and synced.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mb-16 px-8 py-4 bg-white/5 rounded-3xl border border-white/10 animate-in fade-in-0 duration-700">
          <Sparkles className="h-4 w-4 text-primary/50 mr-3" />
          <p className="text-[12px] text-gray-400 font-bold italic text-center animate-pulse">
            "{randomTip}"
          </p>
        </div>

        <section>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white uppercase tracking-widest">
                Categories
              </h2>
              <p className="text-muted-foreground mt-2 font-medium">
                Select a category to start managing participants.
              </p>
            </div>
            <Badge variant="outline" className="hidden sm:flex items-center gap-2 px-4 py-2 border-white/10 text-[10px] text-gray-400 font-black tracking-widest">
              <Activity className="w-3 h-3 text-primary" />
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {eventCards.map((card, i) => (
              <button
                key={card.key}
                onClick={() => navigate(`/dashboard/manage?type=${card.key}`)}
                className={`group relative bg-gradient-to-br ${card.gradient} border ${card.border} rounded-[2.5rem] p-10 text-left transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl animate-in fade-in-0 slide-in-from-bottom-6 duration-700`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#160d33]/70 backdrop-blur-md flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 group-hover:border-primary/50 transition-all shadow-xl">
                  <card.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-white group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed font-medium mb-8">
                  {card.description}
                </p>
                <div className="inline-flex items-center gap-3 text-[10px] font-black text-primary tracking-widest opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-3">
                  MANAGE NOW <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Landing;