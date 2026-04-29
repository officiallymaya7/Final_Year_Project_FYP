import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import creovatorLogo from "@/assets/creovator-logo.png";
import heroBg from "@/assets/hero-bg.jpg"; 

import {
  Zap, Upload, Mail, QrCode, Play, ArrowRight, Check, Sparkles, Palette, BarChart3,BrainCircuit, Layers3,  MonitorSmartphone, Stamp,
  Twitter, Github, Linkedin
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const navLinks = ["Home", "Features", "How It Works", "Pricing", "Developers"];

const features = [
  { icon: Sparkles, title: "Smart Event Creation", desc: "AI-powered event setup with intelligent suggestions and templates." },
  { 
    icon: Layers3, // Multiple layers represent Bulk Generation of assets
    title: "Bulk Material Generation", 
    desc: "Generate hundreds of personalized designing materials and event assets in seconds." 
  },
  { icon: Mail, title: "Email Automation", desc: "Automated emails for invitations (Badges and Tickets), reminders, propsals , follow-ups and Certificates." },
  { 
    icon: MonitorSmartphone, // Devices representing Live Monitoring and presence tracking
    title: "Unified Live Presence Monitor", 
    desc: "Real-time tracking of participants, judges, guests, exhibitors, and visitors through  check-in system." 
  },
  { 
    icon: Stamp, // Represents creation of official certificates/badges for Brand Collateral
    title: "Collateral Forge", 
    desc: "Auto-craft professional-grade certificates, badges, and marketing assets that align perfectly with your event's identity." 
  },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time insights on attendance, engagement, feedback, reviews and much more." },
];

const steps = [
  { num: "01", title: "Sign Up", desc: "Create your Creovator account in seconds." },
  { num: "02", title: "Choose Subscription", desc: "Pick a plan that fits your event needs." },
  { num: "03", title: "Create Event", desc: "Set up your event with our intuitive builder." },
  { num: "04", title: "Manage Events", desc: "Complete end-to-end management from planning to execution." }, 
  { num: "05", title: "Design Materials", desc: "Auto-generate beautiful certificates and promotional materials." }, 
];

const plans = [
  { name: "Basic", price: "9", period: "/month", features: ["5 Events/month", "100 Participants", "Email Support", "Basic Templates"], highlighted: false },
  { name: "Pro", price: "29", period: "/month", features: ["Unlimited Events", "5,000 Participants", "Priority Support", "Custom Templates", "Analytics", "QR Check-in"], highlighted: true },
  { name: "Enterprise", price: "99", period: "/month", features: ["Unlimited Everything", "Dedicated Manager", "Custom Branding", "API Access", "SSO Integration", "SLA Guarantee"], highlighted: false },
];

const team = [
  { 
    name: "Ms. Soomaiya Hamid", 
    role: "Project Supervisor", 
    image: "/team/soomaiya.jpeg",
    description: "A Lecturer in Computer Science and Software Engineering with expertise in computer networks and cybersecurity." 
  },
  { 
    name: "Maya Khurshid Anwar", 
    role: "Lead & AI Automation Engineer", 
    image: "/team/maya.jpeg",
    description: "A Final Year Software Engineering Student from Jinnah University for Women"
  },
  { 
    name: "Laiba Danish", 
    role: "Backend Engineer", 
    image: "/team/laiba.jpeg",
    description: "A Final Year Software Engineering Student from Jinnah University for Women"
  },
  { 
    name: "Imsha Anmol", 
    role: "UI/UX Designer", 
    image: "/team/imsha.jpeg",
    description: "A Final Year Software Engineering Student from Jinnah University for Women"
  },
  { 
    name: "Alishba Iftikhar", 
    role: "Frontend Developer", 
    image: "/team/alishba.jpeg",
    description: "A Final Year Software Engineering Student from Jinnah University for Women"
  },
];

const SectionDivider = () => (
  <div className="w-full flex justify-center py-6">
    <div className="h-[2px] w-3/4 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)] opacity-50" />
  </div>
);

const SaasLanding = () => {
  const navigate = useNavigate();
  const goAuth = () => navigate("/auth");
  
  const stepSectionRef = useRef<HTMLDivElement>(null);
  const stepTriggerRef = useRef<HTMLDivElement>(null);
  const featureSectionRef = useRef<HTMLDivElement>(null);
  const featureTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepSectionRef.current && stepTriggerRef.current) {
      const stepTotalMove = stepSectionRef.current.offsetWidth - window.innerWidth;
      gsap.to(stepSectionRef.current, {
        x: () => -stepTotalMove,
        ease: "none",
        scrollTrigger: {
          trigger: stepTriggerRef.current,
          start: "top top",
          end: () => `+=${stepTotalMove}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }

    if (featureSectionRef.current && featureTriggerRef.current) {
      const featureTotalMove = featureSectionRef.current.offsetWidth - window.innerWidth;
      gsap.to(featureSectionRef.current, {
        x: () => -featureTotalMove,
        ease: "none",
        scrollTrigger: {
          trigger: featureTriggerRef.current,
          start: "top top",
          end: () => `+=${featureTotalMove}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const scrollToDemo = () => {
    const element = document.getElementById('watch-demo');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
        <style dangerouslySetInnerHTML={{ __html: `
            @keyframes borderRotate {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .snake-border-container {
                position: relative;
                padding: 3px; 
                border-radius: 2.1rem;
                background: linear-gradient(90deg, #3b82f6, #60a5fa, transparent, #3b82f6);
                background-size: 200% 200%;
                animation: borderRotate 4s linear infinite;
            }
            .neon-icon-hover:hover {
                color: #3b82f6 !important;
                fill: #3b82f6;
                filter: drop-shadow(0 0 8px #3b82f6) drop-shadow(0 0 15px #3b82f6);
                transform: scale(1.2);
            }
            .heading-gradient {
                background: linear-gradient(to right, #7c3aed, #3b82f6, #a855f7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .heading-with-border {
                position: relative;
                display: inline-block;
                padding: 0.5rem 2rem;
            }
            .heading-with-border::before, .heading-with-border::after {
                content: '';
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                width: 60%;
                height: 2px;
                background: linear-gradient(90deg, transparent, #3b82f6, #a855f7, transparent);
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
            }
            .heading-with-border::before { top: 0; }
            .heading-with-border::after { bottom: 0; }
        `}} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border/20 bg-background/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <img src={creovatorLogo} alt="Creovator" className="h-9 object-contain" />
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
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
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden pt-16">
        <img src={heroBg} alt="Event Backdrop" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <Badge variant="secondary" className="mb-6 bg-primary/10 border-primary/20 text-primary px-4 py-1">
            <Zap className="w-3.5 h-3.5 mr-1" /> AI-Powered Event Management
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 text-white leading-tight">
            Organize Smart Events <br />
            <span className="heading-gradient italic">
              with AI Automation
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Empowering organizers with AI to transform complex event planning into automated, high-impact experiences.
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

      {/* Scrolling Text Banner */}
      <section className="py-12 bg-muted/5 overflow-hidden border-y border-border/30">
        <div className="flex animate-scroll gap-12 whitespace-nowrap">
            {[...Array(10)].map((_, i) => (
             <div key={i} className="flex gap-12 items-center">
               <span className="text-2xl font-bold text-primary italic">CREOVATOR</span>
               <span className="text-sm text-muted-foreground tracking-widest uppercase px-4">Smart Events</span>
             </div>
            ))}
        </div>
      </section>

      <SectionDivider />

      {/* Demo Section */}
      <section id="watch-demo" className="py-24 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="heading-with-border">
            <h2 className="text-3xl md:text-5xl font-bold">
               <span className="heading-gradient">Our Solution: Creovator</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-lg mt-6">Experience the Creovator journey.</p>
        </div>
        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/20 bg-black">
          <video className="w-full aspect-video" controls autoPlay muted loop>
            <source src="/videos/demo.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <SectionDivider />

      {/* How It Works */}
      <section id="how-it-works" ref={stepTriggerRef} className="bg-background overflow-hidden w-full">
        <div className="h-screen flex flex-col justify-center">
          <div className="w-full text-center mb-12">
            <div className="heading-with-border">
                <h2 className="text-4xl font-bold tracking-tight">
                    <span className="heading-gradient">How It Works</span>
                </h2>
            </div>
            <p className="text-muted-foreground mt-6 italic">Scroll to see the process</p>
          </div>
          <div ref={stepSectionRef} className="flex flex-nowrap items-center gap-12 px-[15vw] w-max">
            {steps.map((s, i) => (
              <div key={i} className="step-card group relative w-[320px] flex-shrink-0 h-full rounded-[2.5rem] p-[1.5px] bg-gradient-to-br from-white/20 to-transparent transition-all duration-500">
                <div className="relative h-full w-full rounded-[2.4rem] bg-white/5 backdrop-blur-xl p-10 flex flex-col overflow-hidden border border-white/10 shadow-2xl">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-colors duration-500" />
                  <div>
                    <span className="text-6xl font-black text-white block mb-6 opacity-80 group-hover:opacity-100">{s.num}</span>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary transition-colors">{s.title}</h3>
                    <p className="text-white/60 text-sm font-medium leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Features */}
      <section id="features" ref={featureTriggerRef} className="bg-background overflow-hidden w-full">
        <div className="h-screen flex flex-col justify-center">
          <div className="w-full text-center mb-12">
            <div className="heading-with-border">
                <h2 className="text-4xl font-bold tracking-tight">
                    <span className="heading-gradient">Powerful Features</span>
                </h2>
            </div>
            <p className="text-muted-foreground mt-6 italic">Discover our core capabilities</p>
          </div>
          <div ref={featureSectionRef} className="flex flex-nowrap items-center gap-12 px-[15vw] w-max">
            {features.map((f, i) => (
              <div key={i} className="feature-card group relative w-[320px] flex-shrink-0 h-full rounded-[2.5rem] p-[1.5px] bg-gradient-to-br from-white/20 to-transparent transition-all duration-500">
                <div className="relative h-full w-full rounded-[2.4rem] bg-white/5 backdrop-blur-xl p-10 flex flex-col overflow-hidden border border-white/10 shadow-2xl">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-colors duration-500" />
                  <div className="flex flex-col h-full">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-8 border border-primary/30 group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                      <f.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary transition-colors">{f.title}</h3>
                    <p className="text-white/60 text-sm font-medium leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-4 bg-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="heading-with-border">
                <h2 className="text-4xl font-bold">
                    <span className="heading-gradient">Simple Pricing</span>
                </h2>
            </div>
            <p className="text-muted-foreground mt-6">Choose the perfect plan for your next big event.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0 min-h-[600px]">
            {plans.map((p, i) => (
              <motion.div
                key={i}
                whileHover={{ 
                  scale: p.highlighted ? 1.05 : 1.02, 
                  zIndex: 30,
                  transition: { duration: 0.3 }
                }}
                className={`relative w-full max-w-[350px] transition-all duration-500 flex flex-col ${
                  p.highlighted 
                    ? "z-20 h-[560px] md:-mx-4 shadow-[0_0_50px_rgba(59,130,246,0.25)]" 
                    : "z-10 h-[500px] opacity-95"
                }`}
              >
                <div className={`
                  h-full w-full flex flex-col rounded-[2.5rem] p-8 border backdrop-blur-xl
                  ${p.highlighted 
                    ? "bg-gradient-to-b from-primary/30 to-primary/10 border-primary/40 text-white" 
                    : "bg-white border-white/20 text-primary shadow-2xl"
                  }
                `}>
                  <div className="mb-6">
                    <Badge className={`mb-4 border-none px-3 py-1 ${p.highlighted ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                      {p.name.toUpperCase()} PLAN
                    </Badge>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold">${p.price}</span>
                      <span className={`text-sm font-medium ${p.highlighted ? "text-white/70" : "text-primary/70"}`}>{p.period}</span>
                    </div>
                    <p className={`text-xs mt-3 italic leading-relaxed ${p.highlighted ? "text-white/60" : "text-primary/60"}`}>
                      Best for {p.name === "Pro" ? "growing teams" : p.name === "Basic" ? "individuals" : "large enterprises"}.
                    </p>
                  </div>

                  <div className="flex-grow space-y-4 mb-8">
                    {p.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${p.highlighted ? "bg-white/20" : "bg-primary/10"}`}>
                          <Check className={`h-3 w-3 ${p.highlighted ? "text-white" : "text-primary"}`} />
                        </div>
                        <span className="text-sm font-medium opacity-90">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={goAuth}
                    className={`w-full h-12 rounded-2xl text-sm font-bold transition-all duration-300 ${
                      p.highlighted 
                        ? "bg-white text-primary hover:bg-white/90 shadow-xl" 
                        : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                    }`}
                  >
                    Click here to get started! <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* TEAM SECTION */}
      <section id="developers" className="py-24 px-4 bg-background relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
              {/* <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1">Our Experts</Badge> */}
              <div className="heading-with-border">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    <span className="heading-gradient">Meet Our Team</span>
                </h2>
              </div>
          </div>
          
          <div className="space-y-24">
            {team.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
              >
                {/* Profile Image */}
                <div className="relative group flex-shrink-0">
                  <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white/5 group-hover:border-primary/50 transition-all duration-500 shadow-2xl">
                    <img 
                      src={m.image} 
                      alt={m.name} 
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" 
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${m.name}&background=0D8ABC&color=fff&size=512`; }}
                    />
                  </div>
                </div>

                {/* Content - Snake Border Message Box */}
                <div className="relative flex-grow w-full max-w-2xl">
                    <div className="snake-border-container">
                     <div className={`
                       relative p-8 md:p-10 rounded-[2rem] bg-black/80 backdrop-blur-xl transition-all duration-300
                       ${i % 2 !== 0 ? "text-center md:text-right" : "text-center md:text-left"}
                     `}>
                       {/* Box Background Glow */}
                       <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-[2rem] -z-10" />
                       
                       <h4 className="text-3xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{m.name}</h4>
                       <div className={`flex items-center gap-2 mb-2 justify-center ${i % 2 !== 0 ? "md:justify-end" : "md:justify-start"}`}>
                         <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] tracking-widest uppercase py-0.5 px-2">
                           {m.role}
                         </Badge>
                       </div>

                       <p className={`text-sm text-white/70 mb-6 italic ${i % 2 !== 0 ? "md:text-right" : "md:text-left"}`}>
                         {m.description}
                       </p>

                       {/* SOCIAL ICONS WITH NEON EFFECT */}
                       <div className={`flex items-center gap-6 justify-center ${i % 2 !== 0 ? "md:justify-end" : "md:justify-start"}`}>
                         <a href="#" className="text-white/50 transition-all duration-300 neon-icon-hover">
                           <Twitter className="w-6 h-6" />
                         </a>
                         <a href="#" className="text-white/50 transition-all duration-300 neon-icon-hover">
                           <Github className="w-6 h-6" />
                         </a>
                         <a href="#" className="text-white/50 transition-all duration-300 neon-icon-hover">
                           <Linkedin className="w-6 h-6" />
                         </a>
                       </div>

                       {/* Box Corner Accent */}
                       <div className={`absolute bottom-6 w-12 h-1 bg-primary/40 rounded-full ${i % 2 !== 0 ? "right-10" : "left-10"}`} />
                     </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
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