import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import creovatorLogo from "@/assets/creovator-logo.png";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  // { label: "Designing Portal", path: "/dashboard/designer" },
  { label: "Designing Portal", path: "/dashboard/manage" },
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
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0f0a1f]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
      <img
  src={creovatorLogo}
  alt="Creovator"
  className="h-16 w-auto object-contain cursor-pointer shrink-0 scale-[3] origin-left"
  onClick={() => navigate("/dashboard")}
/>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `relative group transition-all ${isActive ? "text-primary" : "hover:text-primary"}`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="h-8 w-[1px] bg-white/10 mx-1" />

          <div className="relative group/avatar">
            <button
              onClick={() => navigate("/profile")}
              className="rounded-full ring-2 ring-transparent hover:ring-primary/50 transition-all duration-200"
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

            <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-card border border-white/10 rounded-xl text-xs text-white font-bold whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-all pointer-events-none shadow-xl">
              {userName || "View Profile"}
              <div className="absolute -top-1 right-3 w-2 h-2 bg-card border-l border-t border-white/10 rotate-45" />
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="hidden sm:flex gap-2 text-muted-foreground hover:text-destructive"
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