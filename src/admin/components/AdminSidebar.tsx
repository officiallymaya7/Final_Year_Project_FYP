import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAdminAuth } from "@/admin/context/AdminAuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Event Managers", to: "/admin/organizers", icon: Users },
  { label: "Events", to: "/admin/events", icon: CalendarDays },
  { label: "Subscriptions", to: "/admin/subscriptions", icon: CreditCard },
];

const AdminSidebar = () => {
  const { admin, logout } = useAdminAuth();

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border">
        <Sparkles className="w-5 h-5 text-sidebar-primary" />
        <span className="font-semibold text-sidebar-foreground">CreoVator</span>
        <span className="text-xs text-muted-foreground ml-auto">Admin</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {admin?.username}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;