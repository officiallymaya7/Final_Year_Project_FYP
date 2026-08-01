import { supabase } from "./supabase";

export interface EventBrandKit {
  id: string;
  event_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  logo_url: string | null;
  pattern: "none" | "dots" | "waves" | "geometric" | "diagonal";
  package_key: string | null;
  selected_categories: string[];
}

const DEFAULT_KIT = {
  primary_color: "#F9BB1E",
  secondary_color: "#1E3A8A",
  accent_color: "#0F0A1F",
  font_heading: "Arial",
  font_body: "Arial",
  logo_url: null,
  pattern: "none" as const,
  package_key: null,
  selected_categories: [] as string[],
};

/**
 * Get the brand kit for an event, or sensible defaults if none saved yet.
 */
export const fetchBrandKit = async (eventId: string): Promise<EventBrandKit | null> => {
  const { data, error } = await supabase
    .from("event_brand_kit")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data as EventBrandKit;
};

/**
 * Create or update the brand kit for an event (one row per event).
 */
export const saveBrandKit = async (
  eventId: string,
  kit: Partial<Omit<EventBrandKit, "id" | "event_id">>
): Promise<EventBrandKit> => {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("event_brand_kit")
    .upsert(
      {
        event_id: eventId,
        user_id: userData.user.id,
        ...DEFAULT_KIT,
        ...kit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as EventBrandKit;
};