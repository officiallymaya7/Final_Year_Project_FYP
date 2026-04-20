import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, User, CalendarDays, Monitor, PartyPopper, Cake, LayoutGrid,
  Users, BarChart3, ArrowRight, Sparkles, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import creovatorLogo from "@/assets/creovator-logo.png";
import heroBg from "@/assets/hero-events.jpg";

const stats = [
  { label: "Total Events", value: "12", icon: CalendarDays, color: "text-primary" },
  { label: "Tech Events", value: "5", icon: Monitor, color: "text-primary" },
  { label: "Custom Events", value: "3", icon: LayoutGrid, color: "text-secondary" },
  { label: "Participants", value: "1,240", icon: Users, color: "text-success" },
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

const navLinks = ["Dashboard", "My Events", "Calendar"];

const Landing = () => {
  const navigate = useNavigate();
  const [welcomeMsg, setWelcomeMsg] = useState("");

  useEffect(() => {
    const authType = localStorage.getItem("authType");
    if (authType === "signup") setWelcomeMsg("Welcome 👋");
    else if (authType === "login") setWelcomeMsg("Welcome Back 👋");
    // Clear after showing
    return () => { localStorage.removeItem("authType"); };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authType");
    navigate("/auth");
  };

  const handleCardClick = (key: string) => {
    navigate(`/dashboard/manage?type=${key}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <img src={creovatorLogo} alt="Creovator" className="h-9 object-contain" />
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </Button>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs">OP</AvatarFallback>
            </Avatar>
            <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Welcome Message */}
      {welcomeMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-6 py-4">
            <h1 className="text-2xl font-bold text-foreground">{welcomeMsg}</h1>
            <p className="text-sm text-muted-foreground mt-1">Let's get your events organized.</p>
          </div>
        </div>
      )}

      {/* Profile Summary */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">OP</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{welcomeMsg || "Welcome back, Organizer"}</h2>
            <div className="flex gap-4 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> 12 Total Events
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <BarChart3 className="w-3 h-3" /> 4 Upcoming
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Banner */}
      <section className="relative mx-4 sm:mx-6 lg:mx-auto max-w-7xl rounded-2xl overflow-hidden">
        <img
          src={heroBg}
          alt="Event management hero banner"
          className="w-full h-64 sm:h-80 object-cover"
          width={1920}
          height={640}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Manage Your Events <span className="gradient-text">Seamlessly</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
            Create, organize and track everything in one place
          </p>
          <Button
            className="mt-5 w-fit gap-2"
            onClick={() => navigate("/dashboard/manage")}
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Event Type Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Event Categories</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose a category to start managing</p>
          </div>
          <Badge variant="secondary" className="hidden sm:flex">
            3 categories
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {eventCards.map((card) => (
            <button
              key={card.key}
              onClick={() => handleCardClick(card.key)}
              className={`group relative bg-gradient-to-br ${card.gradient} border ${card.border} rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10`}
            >
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4 group-hover:bg-muted transition-colors">
                <card.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Landing;
