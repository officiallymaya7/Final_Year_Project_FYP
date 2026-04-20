import { useState } from "react";
import { CalendarPlus, Image, Upload, UserPlus, Info, LogOut, Menu, X } from "lucide-react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Create Event", icon: CalendarPlus },
    { label: "Gallery", icon: Image },
    { label: "Upload Images", icon: Upload },
    { label: "Create New User", icon: UserPlus },
    { label: "About Us", icon: Info },
  ];

  return (
    <nav className="nav-transparent fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <span className="text-xl font-bold text-primary-foreground tracking-tight">
            MMDU Event
          </span>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors rounded-md hover:bg-primary-foreground/10"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
            <button className="flex items-center gap-1.5 ml-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          <button
            className="md:hidden text-primary-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden nav-transparent border-t border-primary-foreground/10 px-4 pb-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
          <button className="flex items-center gap-2 mt-2 w-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
