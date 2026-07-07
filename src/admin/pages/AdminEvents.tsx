import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface EventRow {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

const AdminEvents = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("admin-list", {
          body: { table: "events" },
        });

        if (fnError) throw fnError;

        if (data?.success) {
          setEvents(data.data);
        } else {
          setError(data?.error ?? "Failed to load events");
        }
      } catch (err) {
        console.error("Events fetch failed:", err);
        setError("Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Events</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All events created across the platform
        </p>
      </div>

      {error && <div className="mb-4 text-sm text-destructive">{error}</div>}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading...</p>
        ) : events.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No events found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Event Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{ev.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(ev.created_at).toLocaleDateString()}
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

export default AdminEvents;