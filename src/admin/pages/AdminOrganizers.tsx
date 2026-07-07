import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Organizer {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

const AdminOrganizers = () => {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("admin-list", {
          body: { table: "profiles" },
        });

        if (fnError) throw fnError;

        if (data?.success) {
          setOrganizers(data.data);
        } else {
          setError(data?.error ?? "Failed to load event managers");
        }
      } catch (err) {
        console.error("Organizers fetch failed:", err);
        setError("Failed to load event managers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizers();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Event Managers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All registered event managers on the platform
        </p>
      </div>

      {error && <div className="mb-4 text-sm text-destructive">{error}</div>}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading...</p>
        ) : organizers.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No event managers found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {organizers.map((org) => (
                <tr key={org.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{org.full_name}</td>
                  <td className="px-4 py-3 text-foreground">{org.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrganizers;