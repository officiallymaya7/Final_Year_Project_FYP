import { StaticCanvas, FabricImage, Textbox } from "fabric";
import QRCode from "qrcode";
import { supabase } from "./supabase";

export interface ParticipantLite {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  category?: string;
  [key: string]: any;
}

export interface GenerateResult {
  participantId: string;
  participantName: string;
  fileUrl: string;
}

// ── QR encode/decode ──────────────────────────────────────────────────────────
export const encodeQrPayload = (participantId: string, eventId: string): string =>
  `creavator:${participantId}:${eventId}`;

export const decodeQrPayload = (
  payload: string
): { participantId: string; eventId: string } | null => {
  const parts = payload.split(":");
  if (parts.length === 3 && parts[0] === "creavator")
    return { participantId: parts[1], eventId: parts[2] };
  return null;
};

// ── Core: generate one design for one participant ─────────────────────────────
// Strategy: separate static vs dynamic objects from the JSON.
// Load only static ones, then ADD FRESH objects for each dynamic field.
// This avoids Fabric v6's text-cache bug where .set("text") doesn't re-render.
const generateOne = async (
  baseJson: any,
  participant: ParticipantLite,
  eventId: string,
  canvasWidth: number,
  canvasHeight: number,
): Promise<string> => {
  // Deep-clone base JSON so nothing leaks between participants
  const json = JSON.parse(JSON.stringify(baseJson));

  // Split objects: static (no dynamicField) vs dynamic
  const staticObjs: any[] = [];
  const dynamicObjs: any[] = [];

  for (const obj of json.objects ?? []) {
    if (obj.data?.dynamicField) {
      dynamicObjs.push(obj);
    } else {
      staticObjs.push(obj);
    }
  }

  // Load only static objects onto the canvas
  const cleanJson = { ...json, objects: staticObjs };
  const el = document.createElement("canvas");
  const sc = new StaticCanvas(el, { width: canvasWidth, height: canvasHeight });
  await sc.loadFromJSON(cleanJson);

  // Add fresh objects for each dynamic field
  for (const dynObj of dynamicObjs) {
    const fieldKey: string = dynObj.data.dynamicField;

    if (fieldKey === "qr_id") {
      // Fresh QR image with participant-specific payload
      const qrPayload = encodeQrPayload(participant.id, eventId);
      const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 400 });
      const qrImg = await FabricImage.fromURL(qrDataUrl, { crossOrigin: "anonymous" });

      // Restore exact position and size from the serialised placeholder
      const origWidth  = (dynObj.width  || 1) * (dynObj.scaleX || 1);
      const origHeight = (dynObj.height || 1) * (dynObj.scaleY || 1);
      qrImg.set({
        left:   dynObj.left  ?? 0,
        top:    dynObj.top   ?? 0,
        angle:  dynObj.angle ?? 0,
        scaleX: origWidth  / (qrImg.width  || 1),
        scaleY: origHeight / (qrImg.height || 1),
      });
      sc.add(qrImg);

    } else {
      // Fresh Textbox with real participant value — created from scratch so
      // Fabric v6 initialises its text buffer correctly (no stale cache)
      const value = String(participant[fieldKey] ?? "");

      const freshText = new Textbox(value, {
        left:            dynObj.left            ?? 0,
        top:             dynObj.top             ?? 0,
        width:           dynObj.width           ?? 300,
        fontSize:        dynObj.fontSize        ?? 24,
        fontWeight:      dynObj.fontWeight      ?? "normal",
        fontStyle:       dynObj.fontStyle       ?? "normal",
        underline:       dynObj.underline       ?? false,
        fill:            dynObj.fill            ?? "#000000",
        fontFamily:      dynObj.fontFamily      ?? "Arial",
        textAlign:       dynObj.textAlign       ?? "left",
        lineHeight:      dynObj.lineHeight      ?? 1.16,
        charSpacing:     dynObj.charSpacing     ?? 0,
        backgroundColor: dynObj.backgroundColor ?? "",
        opacity:         dynObj.opacity         ?? 1,
        scaleX:          dynObj.scaleX          ?? 1,
        scaleY:          dynObj.scaleY          ?? 1,
        angle:           dynObj.angle           ?? 0,
      });
      sc.add(freshText);
    }
  }

  sc.renderAll();
  const dataUrl = sc.toDataURL({ format: "png", multiplier: 1 });
  sc.dispose();
  return dataUrl;
};

// ── Main export ───────────────────────────────────────────────────────────────
export const generateDesignsForAll = async ({
  templateId,
  category,
  canvasJson,
  canvasWidth,
  canvasHeight,
  participants,
  eventId,
  listName,
  onProgress,
}: {
  templateId: string;
  category: string;
  canvasJson: any;
  canvasWidth: number;
  canvasHeight: number;
  participants: ParticipantLite[];
  eventId: string;
  listName: string;
  onProgress?: (done: number, total: number) => void;
}): Promise<GenerateResult[]> => {
  const results: GenerateResult[] = [];

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];

    // Generate the image data URL for this participant
    const dataUrl = await generateOne(
      canvasJson, p, eventId, canvasWidth, canvasHeight
    );

    // Upload to Supabase Storage "designs" bucket
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${eventId}/${listName}/${category}/${p.id}.png`;

    const { error: uploadErr } = await supabase.storage
      .from("designs")
      .upload(path, blob, { contentType: "image/png", upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from("designs").getPublicUrl(path);

    // Save record in design_outputs table
    await supabase.from("design_outputs").upsert(
      {
        template_id:    templateId,
        event_id:       eventId,
        participant_id: p.id,
        category,
        file_url:       urlData.publicUrl,
        updated_at:     new Date().toISOString(),
      },
      { onConflict: "template_id,participant_id" }
    );

    results.push({
      participantId:   p.id,
      participantName: p.name,
      fileUrl:         urlData.publicUrl,
    });

    onProgress?.(i + 1, participants.length);
  }

  return results;
};