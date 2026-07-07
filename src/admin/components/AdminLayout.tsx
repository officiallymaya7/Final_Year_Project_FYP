import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "@/admin/components/AdminSidebar";
import { useAdminAuth } from "@/admin/context/AdminAuthContext";
import { Loader2 } from "lucide-react";

const AdminLayout = () => {
  const { admin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;