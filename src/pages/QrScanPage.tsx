/**
 * QrScanPage.tsx
 *
 * Route: /qr-scan?event_id=xxx   (or opened directly from a QR scanner app)
 *
 * This page:
 *  1. Reads the scanned QR payload (JSON: { participantId, eventId }) — either
 *     from the live device camera (html5-qrcode) or pasted/typed manually.
 *  2. Marks attendance in Supabase (attendance table)
 *  3. Shows participant details + success / already-checked-in / error state
 *
 * The page can also be used as a manual lookup — staff type / paste the raw
 * QR string into the input field.
 *
 * Supabase table assumed:
 *   attendance (
 *     id uuid primary key default gen_random_uuid(),
 *     participant_id uuid references participants(id),
 *     event_id uuid references events(id),
 *     checked_in_at timestamptz default now(),
 *     checked_in_by text,          -- optional: staff name / device
 *     unique(participant_id, event_id)
 *   )
 */

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  QrCode, CheckCircle2, AlertCircle, Loader2, ArrowLeft,
  User, Building2, Tag, Mail, Phone, Clock, RefreshCw, Camera, CameraOff,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface QrPayload {
  participantId: string;
  eventId: string;
}

interface ParticipantDetail {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  category?: string;
  list_name?: string;
}

type ScanState = "idle" | "loading" | "success" | "already" | "error";

// ─── Parse QR payload ─────────────────────────────────────────────────────────
const parseQrPayload = (raw: string): QrPayload | null => {
  try {
    // New format: JSON string
    const parsed = JSON.parse(raw);
    if (parsed.participantId && parsed.eventId) return parsed;
  } catch {
    // Legacy format: "creavator:participantId:eventId"
    const parts = raw.split(":");
    if (parts[0] === "creavator" && parts.length >= 3) {
      return { participantId: parts[1], eventId: parts[2] };
    }
  }
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────
const QrScanPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Allow pre-filling from URL: /qr-scan?payload=<encoded>&event_id=<id>
  const urlPayload = params.get("payload") || "";

  const [inputValue, setInputValue]     = useState(urlPayload);
  const [scanState, setScanState]       = useState<ScanState>("idle");
  const [participant, setParticipant]   = useState<ParticipantDetail | null>(null);
  const [checkedInAt, setCheckedInAt]   = useState<string>("");
  const [eventName, setEventName]       = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Auto-process if payload came in via URL
  useEffect(() => {
    if (urlPayload) handleScan(urlPayload);
  }, []);

  // Make sure the camera is released if the user leaves the page mid-scan
  useEffect(() => {
    return () => {
      const s = scannerRef.current;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const handleScan = async (raw = inputValue) => {
    const trimmed = raw.trim();
    if (!trimmed) { toast.error("Please enter or paste a QR payload."); return; }

    const payload = parseQrPayload(trimmed);
    if (!payload) {
      toast.error("Invalid QR code format.");
      setScanState("error");
      return;
    }

    setScanState("loading");
    setParticipant(null);

    try {
      // 1. Fetch event name
      const { data: ev } = await supabase
        .from("events").select("name").eq("id", payload.eventId).single();
      if (ev) setEventName(ev.name);

      // 2. Fetch participant details
      const { data: pData, error: pErr } = await supabase
        .from("participants")
        .select("id,name,email,phone,organization,category,list_name")
        .eq("id", payload.participantId)
        .single();

      if (pErr || !pData) {
        setScanState("error");
        toast.error("Participant not found.");
        return;
      }
      setParticipant(pData);

      // 3. Try to insert attendance record (unique constraint prevents duplicates)
      const { error: attErr } = await supabase
        .from("attendance")
        .insert({
          participant_id: payload.participantId,
          event_id: payload.eventId,
          checked_in_at: new Date().toISOString(),
        });

      if (attErr) {
        if (attErr.code === "23505") {
          // Unique violation — already checked in
          // Fetch the existing record to show time
          const { data: existing } = await supabase
            .from("attendance")
            .select("checked_in_at")
            .eq("participant_id", payload.participantId)
            .eq("event_id", payload.eventId)
            .single();

          if (existing) {
            const dt = new Date(existing.checked_in_at);
            setCheckedInAt(dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          }
          setScanState("already");
        } else {
          throw attErr;
        }
      } else {
        setScanState("success");
        setCheckedInAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }
    } catch (err: any) {
      console.error(err);
      setScanState("error");
      toast.error("Error: " + err.message);
    }
  };

  const stopCamera = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    setCameraOn(false);
    if (s) {
      try { await s.stop(); } catch { /* already stopped */ }
      try { s.clear(); } catch { /* nothing to clear */ }
    }
  };

  const startCamera = async () => {
    setScanState("idle");
    setParticipant(null);
    setCameraOn(true);
    // Wait a tick for the #qr-reader container to mount before attaching the camera
    await new Promise((r) => setTimeout(r, 60));
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setInputValue(decodedText);
          stopCamera();
          handleScan(decodedText);
        },
        () => { /* ignore per-frame decode misses */ }
      );
    } catch (err) {
      toast.error("Unable to access the camera. You can paste the QR data instead.");
      scannerRef.current = null;
      setCameraOn(false);
    }
  };

  const reset = () => {
    setScanState("idle");
    setParticipant(null);
    setInputValue("");
    setCheckedInAt("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── UI helpers ──
  const stateConfig = {
    success: {
      icon: <CheckCircle2 className="h-12 w-12 text-emerald-500" />,
      title: "Attendance Marked!",
      subtitle: `Checked in at ${checkedInAt}`,
      bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700",
      titleColor: "text-emerald-700 dark:text-emerald-300",
    },
    already: {
      icon: <AlertCircle className="h-12 w-12 text-amber-500" />,
      title: "Already Checked In",
      subtitle: `Previously checked in at ${checkedInAt}`,
      bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700",
      titleColor: "text-amber-700 dark:text-amber-300",
    },
    error: {
      icon: <AlertCircle className="h-12 w-12 text-red-500" />,
      title: "Verification Failed",
      subtitle: "Invalid or unrecognised QR code.",
      bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
      titleColor: "text-red-700 dark:text-red-300",
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-bold text-violet-500 flex items-center gap-2">
          <QrCode className="h-4 w-4" /> QR Attendance Scanner
        </h1>
        <div className="w-20" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-start p-6 gap-6 max-w-lg mx-auto w-full pt-10">

        {/* Camera scanner */}
        <div className="w-full bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Scan with camera
          </p>
          {cameraOn && (
            <div id="qr-reader" className="w-full overflow-hidden rounded-xl mb-3" />
          )}
          {!cameraOn ? (
            <button onClick={startCamera}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
              <Camera className="h-4 w-4" /> Start Camera
            </button>
          ) : (
            <button onClick={stopCamera}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-background text-sm font-semibold hover:bg-accent/30 transition-colors">
              <CameraOff className="h-4 w-4" /> Stop Camera
            </button>
          )}
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Point the camera at a participant's ID card QR code.
          </p>
        </div>

        {/* Input area — always visible so staff can scan next */}
        <div className="w-full bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Or paste / type QR payload
          </p>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleScan(); } }}
            rows={3}
            placeholder='Paste QR data here, e.g. {"participantId":"...","eventId":"..."}'
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <button onClick={() => handleScan()} disabled={scanState === "loading"}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50">
            {scanState === "loading"
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
              : <><QrCode className="h-4 w-4" /> Verify & Mark Attendance</>}
          </button>
        </div>

        {/* Result card */}
        {(scanState === "success" || scanState === "already" || scanState === "error") && (
          <div className={`w-full border rounded-2xl p-5 shadow-sm ${stateConfig[scanState].bg}`}>
            <div className="flex flex-col items-center gap-2 mb-4">
              {stateConfig[scanState].icon}
              <h2 className={`text-lg font-bold ${stateConfig[scanState].titleColor}`}>
                {stateConfig[scanState].title}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {stateConfig[scanState].subtitle}
              </p>
              {eventName && (
                <span className="text-xs px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-800 text-violet-600 dark:text-violet-300 font-medium">
                  {eventName}
                </span>
              )}
            </div>

            {participant && (
              <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 font-semibold text-base">
                  <User className="h-4 w-4 text-violet-500" />
                  {participant.name}
                </div>
                {participant.organization && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" /> {participant.organization}
                  </div>
                )}
                {participant.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-violet-400" />
                    <span className="text-violet-600 dark:text-violet-300 font-medium">{participant.category}</span>
                  </div>
                )}
                {participant.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> {participant.email}
                  </div>
                )}
                {participant.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" /> {participant.phone}
                  </div>
                )}
                {participant.list_name && (
                  <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                    List: <span className="font-medium">{participant.list_name}</span>
                  </div>
                )}
              </div>
            )}

            <button onClick={reset}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white/50 dark:bg-black/20 text-sm font-medium hover:bg-white/80 dark:hover:bg-black/30 transition-colors">
              <RefreshCw className="h-4 w-4" /> Scan Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrScanPage;