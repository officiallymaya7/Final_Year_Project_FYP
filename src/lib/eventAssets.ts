import { supabase } from "./supabase";

// crypto.randomUUID() only works in secure contexts (https or localhost).
// This fallback works everywhere so uploads don't break on a plain http/LAN address.
const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export interface EventAsset {
  id: string;
  event_id: string;
  user_id: string;
  name: string;
  file_url: string;
  file_type: string;
  category: "logo" | "banner" | "certificate" | "id_card" | "social" | "personal";
  created_at: string;
}

/**
 * Fetch all "My Elements" assets the current user has saved for a given event.
 * Pass a category to filter (e.g. only "logo"), or omit for everything.
 */
export const fetchEventAssets = async (
  eventId: string,
  category?: EventAsset["category"]
): Promise<EventAsset[]> => {
  let query = supabase
    .from("event_assets")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw error;
  return (data as EventAsset[]) || [];
};

/**
 * Upload a file to the "event-assets" storage bucket and save a row in
 * event_assets so it shows up in "My Elements" for that event.
 */
export const uploadEventAsset = async (
  file: File,
  eventId: string,
  category: EventAsset["category"] = "personal"
): Promise<EventAsset> => {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) throw new Error("Not logged in");
  const userId = userData.user.id;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${eventId}/${generateId()}-${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from("event-assets")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage.from("event-assets").getPublicUrl(path);

  // No single-slot restriction: a user can save as many elements as they
  // want for an event (logos, banners, templates, anything), all under
  // "My Elements" for that event.
  const { data: rowData, error: insertErr } = await supabase
    .from("event_assets")
    .insert({
      event_id: eventId,
      user_id: userId,
      name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type.startsWith("image/") ? "image" : "file",
      category,
    })
    .select()
    .single();

  if (insertErr) throw insertErr;
  return rowData as EventAsset;
};

/**
 * Delete a saved asset (removes the DB row; storage file can be cleaned up
 * separately/lazily since the bucket is public and cheap to keep).
 */
export const deleteEventAsset = async (assetId: string): Promise<void> => {
  const { error } = await supabase.from("event_assets").delete().eq("id", assetId);
  if (error) throw error;
};