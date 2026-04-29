import { useState, useEffect } from "react";
import { Bell, Search, ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase"; // Supabase import کریں

const DashboardHeader = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Organizer");

  useEffect(() => {
    
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata) {
        setUserName(user.user_metadata.full_name || "Organizer");
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="relative flex items-center flex-1">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events, participants..."
            className="pl-9 border-0 bg-transparent focus-visible:ring-0 text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button size="icon" variant="ghost" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </Button>

        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-accent/30 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {userInitial}
          </div>
          <span className="text-sm font-medium hidden sm:inline-block pr-2">
            {userName}
          </span>
        </div>

        <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;