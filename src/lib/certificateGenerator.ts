import { supabase } from "./supabase";
import type { CertificateTemplate, CertificateData } from "./certificateTemplates";

export const renderCertificateBlob = (
  template: CertificateTemplate,
  data: CertificateData
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = template.width;
    canvas.height = template.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) { reject(new Error("Canvas not supported")); return; }
    template.draw(ctx, data);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to render certificate"));
    }, "image/png");
  });
};

export const uploadCertificate = async (blob: Blob, path: string): Promise<string> => {
  const { error } = await supabase.storage.from("certificates").upload(path, blob, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("certificates").getPublicUrl(path);
  return data.publicUrl;
};

export interface GenerateResult {
  participantId: string;
  participantName: string;
  fileUrl: string;
}

export const generateCertificatesForList = async ({
  template,
  participants,
  eventId,
  eventName,
  listName,
  dayNumber,
  organizerName,
  onProgress,
  fabricOverlayJson,
  fabricCanvasWidth,
  fabricCanvasHeight,
}: {
  template: CertificateTemplate;
  participants: { id: string; name: string; category?: string }[];
  eventId: string;
  eventName: string;
  listName: string;
  dayNumber: number;
  organizerName?: string;
  onProgress?: (done: number, total: number) => void;
  /** If the user edited the template in the Fabric editor, pass the JSON here */
  fabricOverlayJson?: any;
  fabricCanvasWidth?: number;
  fabricCanvasHeight?: number;
}): Promise<GenerateResult[]> => {
  const results: GenerateResult[] = [];
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Dynamically import Fabric only when needed (avoids SSR issues)
  let StaticCanvas: any;
  let FabricImage: any;
  if (fabricOverlayJson) {
    const fabric = await import("fabric");
    StaticCanvas = fabric.StaticCanvas;
    FabricImage = fabric.FabricImage;
  }

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];

    // Step 1: render the base template onto a native canvas
    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = template.width;
    baseCanvas.height = template.height;
    const ctx = baseCanvas.getContext("2d")!;
    template.draw(ctx, {
      participantName: p.name,
      eventName,
      date: dateStr,
      organizerName,
      category: p.category,
    });

    let finalDataUrl: string;

    if (fabricOverlayJson && StaticCanvas && FabricImage) {
      // Step 2a: load Fabric overlay and composite it on top of the base render
      const fabricEl = document.createElement("canvas");
      const fabricCanvas = new StaticCanvas(fabricEl, {
        width: fabricCanvasWidth || template.width,
        height: fabricCanvasHeight || template.height,
      });
      await fabricCanvas.loadFromJSON(fabricOverlayJson);

      // Replace dynamic field placeholders with participant data
      const objects = fabricCanvas.getObjects();
      for (const obj of objects) {
        const fieldKey = (obj as any).data?.dynamicField;
        if (!fieldKey) continue;
        // Skip QR fields — certificates don't need QR
        if (fieldKey === "qr_id") {
          fabricCanvas.remove(obj);
          continue;
        }
        if (typeof (obj as any).set === "function") {
          const value = fieldKey === "name" ? p.name
            : fieldKey === "category" ? (p.category || "")
            : "";
          (obj as any).set("text", value);
        }
      }
      fabricCanvas.renderAll();

      // Composite: draw base first, then Fabric overlay on top
      const compositeCanvas = document.createElement("canvas");
      compositeCanvas.width = template.width;
      compositeCanvas.height = template.height;
      const compositeCtx = compositeCanvas.getContext("2d")!;
      compositeCtx.drawImage(baseCanvas, 0, 0);

      // Scale Fabric layer if dimensions differ
      const scaleX = template.width / (fabricCanvasWidth || template.width);
      const scaleY = template.height / (fabricCanvasHeight || template.height);
      compositeCtx.save();
      compositeCtx.scale(scaleX, scaleY);
      compositeCtx.drawImage(fabricEl, 0, 0);
      compositeCtx.restore();

      finalDataUrl = compositeCanvas.toDataURL("image/png");
      fabricCanvas.dispose();
    } else {
      // Step 2b: no overlay, just use the base canvas directly
      finalDataUrl = baseCanvas.toDataURL("image/png");
    }

    const blob = await (await fetch(finalDataUrl)).blob();
    const path = `${eventId}/${listName}/${p.id}.png`;
    const fileUrl = await uploadCertificate(blob, path);

    await supabase.from("certificates").upsert(
      {
        event_id: eventId,
        participant_id: p.id,
        template_key: template.key,
        list_name: listName,
        day_number: dayNumber,
        file_url: fileUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "participant_id" }
    );

    results.push({ participantId: p.id, participantName: p.name, fileUrl });
    onProgress?.(i + 1, participants.length);
  }

  return results;
};