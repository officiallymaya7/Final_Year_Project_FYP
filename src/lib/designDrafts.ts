import { supabase } from "./supabase";
import type { DesignCategoryKey } from "./designPackages";

export interface DesignDraft {
  event_id: string;
  category: string;
  canvas_objects: any[];
  headline: string;
}

/** Fetch every saved draft for this event in one go (keyed by category) */
export const fetchAllDrafts = async (eventId: string): Promise<Record<string, DesignDraft>> => {
  const { data, error } = await supabase
    .from("design_drafts")
    .select("*")
    .eq("event_id", eventId);
  if (error) throw error;

  const map: Record<string, DesignDraft> = {};
  (data || []).forEach((row: any) => {
    map[row.category] = {
      event_id: row.event_id,
      category: row.category,
      canvas_objects: row.canvas_objects || [],
      headline: row.headline || "",
    };
  });
  return map;
};

/** Silently persist the current state of one category's canvas */
export const saveDraft = async (
  eventId: string,
  category: DesignCategoryKey,
  canvasObjects: any[],
  headline: string
) => {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("design_drafts").upsert(
    {
      event_id: eventId,
      user_id: userData?.user?.id ?? null,
      category,
      canvas_objects: canvasObjects,
      headline,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,category" }
  );
  if (error) throw error;
};