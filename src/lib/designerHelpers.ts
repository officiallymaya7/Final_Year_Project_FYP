import { StaticCanvas, FabricImage } from "fabric";
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

// ── QR encode format: "creavator:participantId:eventId" ──────────────────────
// Scanner page will decode this and mark attendance
export const encodeQrPayload = (participantId: string, eventId: string): string => {
  return `creavator:${participantId}:${eventId}`;
};

export const decodeQrPayload = (
  payload: string
): { participantId: string; eventId: string } | null => {
  const parts = payload.split(":");
  if (parts.length === 3 && parts[0] === "creavator") {
    return { participantId: parts[1], eventId: parts[2] };
  }
  return null;
};

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
    const canvasEl = document.createElement("canvas");
    const staticCanvas = new StaticCanvas(canvasEl, {
      width: canvasWidth,
      height: canvasHeight,
    });
    await staticCanvas.loadFromJSON(canvasJson);

    const objects = staticCanvas.getObjects();
    for (const obj of objects) {
      const fieldKey = (obj as any).data?.dynamicField;
      if (!fieldKey) continue;

      if (fieldKey === "qr_id") {
        // Encode participantId + eventId so scanner can verify & mark attendance
        const qrPayload = encodeQrPayload(p.id, eventId);
        const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 400 });
        const qrImg = await FabricImage.fromURL(qrDataUrl);
        const origWidth = (obj.width || 1) * (obj.scaleX || 1);
        const origHeight = (obj.height || 1) * (obj.scaleY || 1);
        qrImg.set({
          left: obj.left,
          top: obj.top,
          angle: obj.angle,
          scaleX: origWidth / (qrImg.width || 1),
          scaleY: origHeight / (qrImg.height || 1),
        });
        staticCanvas.remove(obj);
        staticCanvas.add(qrImg);
      } else if (typeof (obj as any).set === "function") {
        (obj as any).set("text", String(p[fieldKey] ?? ""));
      }
    }
    staticCanvas.renderAll();

    const dataUrl = staticCanvas.toDataURL({ format: "png", multiplier: 1 });
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${eventId}/${listName}/${category}/${p.id}.png`;

    const { error: uploadErr } = await supabase.storage
      .from("designs")
      .upload(path, blob, { contentType: "image/png", upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from("designs").getPublicUrl(path);

    await supabase.from("design_outputs").upsert(
      {
        template_id: templateId,
        event_id: eventId,
        participant_id: p.id,
        category,
        file_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "template_id,participant_id" }
    );

    results.push({
      participantId: p.id,
      participantName: p.name,
      fileUrl: urlData.publicUrl,
    });
    onProgress?.(i + 1, participants.length);
    staticCanvas.dispose();
  }

  return results;
};