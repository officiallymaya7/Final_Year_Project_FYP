import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
    // Step 3 mein ye real session verification (Edge Function) se replace hoga
    const saved = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (saved) {
      setAdmin(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    // TODO (Step 3): Yahan Supabase Edge Function call hogi jo `admins`
    // table ke against username/password verify karegi (bcrypt compare).
    // Abhi ke liye placeholder logic:
    if (username === "admin" && password === "admin123") {
      const mockAdmin = { id: "temp-id", username };
      setAdmin(mockAdmin);
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(mockAdmin));
      return { success: true };
    }
    return { success: false, error: "Invalid username or password" };
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