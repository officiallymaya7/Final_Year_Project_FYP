import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import creovatorLogo from "@/assets/creovator-logo.png";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Design Studio", path: "/dashboard/design" },
  { label: "Content Generation", path: "/dashboard/content-generation" },
  { label: "Email Automation", path: "/dashboard/email-automation" },
];

const DashboardHeader = () => {
  const navigate = useNavigate();
  const [userInitials, setUserInitials] = useState("??");
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      const name = profileData?.full_name || user.user_metadata?.full_name || "Organizer";
      setUserName(name);

      const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      setUserInitials(initials || "??");

      if (profileData?.avatar_url) {
        const base = profileData.avatar_url.split("?")[0];
        setUserAvatarUrl(base + `?t=${Date.now()}`);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    localStorage.removeItem("authType");
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#120a26] via-[#1a0f38] to-[#170c2e] backdrop-blur-md relative overflow-hidden">
      {/* subtle glow accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 w-72 h-72 rounded-full bg-indigo-600/20 blur-[90px]" />
        <div className="absolute -top-24 right-1/4 w-72 h-72 rounded-full bg-fuchsia-600/20 blur-[90px]" />
      </div>

      <div className="relative max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <img
          src={creovatorLogo}
          alt="Creovator"
          className="h-16 w-auto object-contain cursor-pointer shrink-0 scale-[3] origin-left"
          onClick={() => navigate("/dashboard")}
        />

        <div className="hidden md:flex items-center gap-2 text-sm font-semibold">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/30 to-fuchsia-500/30 text-white border border-white/20 shadow-[0_0_18px_rgba(217,70,239,0.25)]"
                    : "text-slate-300/80 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="h-8 w-[1px] bg-white/10 mx-1" />

          <div className="relative group/avatar">
            <button
              onClick={() => navigate("/profile")}
              className="rounded-full ring-2 ring-fuchsia-500/30 hover:ring-fuchsia-400/60 transition-all duration-200"
              title="View Profile"
            >
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                {userAvatarUrl ? (
                  <AvatarImage src={userAvatarUrl} alt={userName} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[#532062] to-[#2d256d] text-white text-xs font-bold font-serif">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="hidden sm:flex gap-2 text-slate-300/80 hover:text-white hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="font-bold uppercase tracking-tighter">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default DashboardHeader;