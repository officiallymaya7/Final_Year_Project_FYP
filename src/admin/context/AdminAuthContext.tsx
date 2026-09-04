import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface AdminUser {
  id: string;
  username: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_SESSION_KEY = "creovator_admin_session";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore a previously verified admin session (set after a successful login).
    const saved = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (saved) {
      setAdmin(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    // Credentials are verified server-side by the `admin-login` Edge Function,
    // which checks them against the `admins` table via the `verify_admin_login`
    // Postgres function (password hashes never leave the database).
    try {
      const { data, error } = await supabase.functions.invoke("admin-login", {
        body: { username, password },
      });

      if (error || !data?.success || !data?.admin) {
        return { success: false, error: data?.error ?? "Invalid username or password" };
      }

      const adminUser: AdminUser = { id: data.admin.id, username: data.admin.username };
      setAdmin(adminUser);
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: "Could not reach the server. Please try again." };
    }
  };

  const logout = () => {
    setAdmin(null);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}