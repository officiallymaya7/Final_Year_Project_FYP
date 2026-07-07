import DashboardCharts from "@/admin/components/DashboardCharts";
import { useEffect, useState } from "react";
import { Users, CalendarDays, Award, Mail } from "lucide-react";
import StatCard from "@/admin/components/StatCard";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  totalManagers: number;
  totalEvents: number;
  certificatesGenerated: number;
  emailsSent: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalManagers: 0,
    totalEvents: 0,
    certificatesGenerated: 0,
    emailsSent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Ab hum sab counts ek trusted Edge Function (admin-stats) se lete hain,
        // jo service role key use karke RLS bypass karta hai (sirf server-side).
        const { data, error: fnError } = await supabase.functions.invoke("admin-stats");

        if (fnError) throw fnError;

        if (data?.success) {
          setStats(data.stats);
        } else {
          setError(data?.error ?? "Failed to load stats");
        }
      } catch (err) {
        console.error("Dashboard stats fetch failed:", err);
        setError("Failed to load dashboard stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform-wide overview and activity
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Event Managers"
          value={isLoading ? "..." : stats.totalManagers}
          icon={Users}
        />
        <StatCard
          label="Total Events"
          value={isLoading ? "..." : stats.totalEvents}
          icon={CalendarDays}
        />
        <StatCard
          label="Certificates Generated"
          value={isLoading ? "..." : stats.certificatesGenerated}
          icon={Award}
        />
        <StatCard
          label="Emails Sent"
          value={isLoading ? "..." : stats.emailsSent}
          icon={Mail}
        />
      </div>

      {/* <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">
          Recent activity and event category breakdown coming soon.
        </p>
      </div> */}
      <DashboardCharts
  managers={stats.totalManagers}
  events={stats.totalEvents}
  certificates={stats.certificatesGenerated}
  emails={stats.emailsSent}
/>
    </div>
  );
};

export default AdminDashboard;