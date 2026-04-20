import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import creovatorLogo from "@/assets/creovator-logo.png";
import heroBg from "@/assets/hero-bg.jpg"; 
import {
  Zap, Upload, Mail, QrCode, Award, BarChart3,
  Play, ArrowRight, Check, Sparkles, ChevronRight, Globe,
  Twitter, Github, Linkedin, Palette
} from "lucide-react";

const navLinks = ["Home", "Features", "How It Works", "Pricing", "Developers"];

const features = [
  { icon: Sparkles, title: "Smart Event Creation", desc: "AI-powered event setup with intelligent suggestions and templates." },
  { icon: Upload, title: "Excel Upload", desc: "Bulk import participants from Excel with smart column mapping." },
  { icon: Mail, title: "Email Automation", desc: "Automated emails for invitations, reminders, and follow-ups." },
  { icon: QrCode, title: "QR Check-in", desc: "Instant attendee check-in with unique QR codes." },
  { icon: Palette, title: "Creative Material Design", desc: "Auto-generate beautiful certificates and other event materials." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time insights on attendance, engagement, and more." },
];

const steps = [
  { num: "01", title: "Sign Up", desc: "Create your Creovator account in seconds." },
  { num: "02", title: "Choose Subscription", desc: "Pick a plan that fits your event needs." },
  { num: "03", title: "Create Event", desc: "Set up your event with our intuitive builder." },
  { num: "04", title: "Manage Events", desc: "Complete end-to-end management from planning to execution." }, 
  { num: "05", title: "Design Materials", desc: "Auto-generate beautiful certificates and promotional materials." }, 
];

const plans = [
  { name: "Basic", price: "$9", period: "/month", features: ["5 Events/month", "100 Participants", "Email Support", "Basic Templates"], highlighted: false },
  { name: "Pro", price: "$29", period: "/month", features: ["Unlimited Events", "5,000 Participants", "Priority Support", "Custom Templates", "Analytics", "QR Check-in"], highlighted: true },
  { name: "Enterprise", price: "$99", period: "/month", features: ["Unlimited Everything", "Dedicated Manager", "Custom Branding", "API Access", "SSO Integration", "SLA Guarantee"], highlighted: false },
];

const team = [
  { name: "Ms. Soomaiya Hamid", role: "Project Supervisor", image: "/team/soomaiya.png" },
  { name: "Maya Khurshid Anwar", role: "Lead & Full Stack Developer", image: "/team/maya.jpg" },
  { name: "Alishba Iftikhar", role: "Backend Developer", image: "/team/alishba.jpeg" },
  { name: "Imsha Anmol", role: "UI/UX Designer", image: "/team/imsha.jpeg" },
  { name: "Laiba Danish", role: "Frontend Developer", image: "/team/laiba.jpeg" },
];

const SectionDivider = () => (
  <div className="w-full flex justify-center py-6">
    <div className="h-[3px] w-3/4 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)] opacity-50" />
  </div>
);

const SaasLanding = () => {
  const navigate = useNavigate();
  const goAuth = () => navigate("/auth");

  const scrollToDemo = () => {
    const element = document.getElementById('watch-demo');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <img src={creovatorLogo} alt="Creovator" className="h-9 object-contain" />
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={goAuth}>Login</Button>
            <Button size="sm" onClick={goAuth}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">
        <img src={heroBg} alt="Event Backdrop" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <Badge variant="secondary" className="mb-6 bg-primary/10 border-primary/20 text-primary px-4 py-1">
            <Zap className="w-3.5 h-3.5 mr-1" /> AI-Powered Event Management
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 text-white leading-tight">
            Organize Smart Events <br />
            <span className="text-primary italic">with AI Automation</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            The all-in-one platform for universities and corporates to create, manage, and scale events effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" onClick={goAuth} className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" onClick={scrollToDemo} className="h-14 px-8 text-lg font-bold border-primary/30 bg-primary/5">
               <Play className="mr-2 h-5 w-5 fill-primary text-primary" /> Watch Story
            </Button>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Marquee Section */}
      <section className="py-12 bg-muted/5 overflow-hidden border-y border-border/30">
        <div className="flex animate-[scroll_30s_linear_infinite] gap-12 whitespace-nowrap">
           {[...Array(10)].map((_, i) => (
             <div key={i} className="flex gap-12 items-center">
               <span className="text-2xl font-bold text-primary italic">CREOVATOR</span>
               <span className="text-sm text-muted-foreground tracking-widest uppercase px-4">Smart Events</span>
             </div>
           ))}
        </div>
      </section>

      <SectionDivider />

      {/* Video Section */}
      <section id="watch-demo" className="py-24 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Our Solution: Creovator</h2>
          <p className="text-muted-foreground text-lg">Experience the Creovator journey.</p>
        </div>
        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/20 bg-black">
          <video className="w-full aspect-video" controls>
            <source src="/videos/demo.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <SectionDivider />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-center text-4xl font-bold mb-16 text-white tracking-tight">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="bg-card/90 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-xl hover:border-primary/50 transition-all group duration-300">
              <span className="text-4xl font-black text-primary/40 block mb-4 group-hover:text-primary transition-colors">{s.num}</span>
              <h3 className="text-xl font-bold mb-2 text-white">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* Features Section */}
      <section id="features" className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-center text-4xl font-bold mb-16 text-white tracking-tight">Powerful Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <Card key={i} className="bg-card/95 border-white/10 hover:border-primary/40 transition-all duration-300 hover:-translate-y-2 shadow-2xl">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <f.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-center text-4xl font-bold mb-16 text-white tracking-tight">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p, i) => (
            <Card key={i} className="flex flex-col bg-card/95 border-white/10 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/60 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <CardContent className="p-8 text-center flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{p.name}</h3>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-4xl font-bold text-white">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </div>
                </div>
                <ul className="text-left space-y-4 mb-8 flex-grow">
                  {p.features.map(feat => (
                    <li key={feat} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" /> {feat}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full h-12 text-md font-semibold bg-primary hover:bg-primary/90 text-white transition-all shadow-lg shadow-primary/20" 
                  onClick={goAuth}
                >
                  Choose Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* Team Section - Updated with Profile Pictures */}
      <section id="developers" className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-center text-4xl font-bold mb-16 text-white tracking-tight">Meet the Team</h2>
        <div className="flex flex-wrap justify-center gap-12">
          {team.map((m, i) => (
            <div key={i} className="text-center group w-40">
              <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border-2 border-primary/20 group-hover:border-primary transition-all duration-300 shadow-lg group-hover:shadow-primary/40">
                <img 
                  src={m.image} 
                  alt={m.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${m.name}&background=0D8ABC&color=fff`;
                  }}
                />
              </div>
              <h4 className="font-bold text-white group-hover:text-primary transition-colors text-sm md:text-base leading-tight">
                {m.name}
              </h4>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-2 leading-tight uppercase tracking-wider">
                {m.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* Footer */}
      <footer className="border-t border-border/30 py-16 px-4 sm:px-6 lg:px-8 bg-muted/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            <img src={creovatorLogo} alt="Creovator" className="h-10 object-contain" />
            <p className="text-muted-foreground text-sm">Leading the future of event management with AI.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="hover:text-primary cursor-pointer transition-colors">Features</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Pricing</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">Connect</h4>
            <div className="flex gap-4">
              <Twitter className="w-5 h-5 hover:text-primary cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 hover:text-primary cursor-pointer transition-colors" />
              <Github className="w-5 h-5 hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">Stay Updated</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-background border border-border/50 rounded-lg px-3 py-2 text-sm w-full focus:border-primary outline-none" />
              <Button size="sm">Join</Button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border/20 text-center text-xs text-muted-foreground">
          © 2026 Creovator AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default SaasLanding;