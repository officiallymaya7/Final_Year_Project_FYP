// src/design/designTemplates.ts
// All template definitions for the Creovator "Design Studio".
// Each template stores plain Fabric.js object data (canvas.toJSON() shape)
// so it can be loaded straight into a fabric.Canvas with canvas.loadFromJSON().
//
// To add a new template: copy an existing one, change the `id`, `name`,
// `category`, `width`/`height`, and the `objects` array.

import type { EventType } from "@/components/DashboardSidebar";


export type DesignCategory = EventType; // "tech" | "party" | "wedding" | "birthday" | "others"

export interface DesignTemplate {
  id: string;
  name: string;
  category: DesignCategory;
  kind: "Poster" | "Banner" | "Invitation" | "Flyer" | "Card";
  width: number;
  height: number;
  thumbBg: string; // quick CSS gradient used for the gallery card preview
  json: {
    background: string;
    objects: Record<string, unknown>[];
  };
}

/* ------------------------------------------------------------------ */
/*  TECH EVENT TEMPLATES                                              */
/* ------------------------------------------------------------------ */

const techPoster: DesignTemplate = {
  id: "tech-poster-1",
  name: "Tech Conference Poster",
  category: "tech",
  kind: "Poster",
  width: 800,
  height: 1000,
  thumbBg: "linear-gradient(135deg,#0f172a,#4f46e5)",
  json: {
    background: "#0f172a",
    objects: [
      { type: "rect", left: 0, top: 0, width: 800, height: 1000, fill: "#0f172a", selectable: false },
      { type: "rect", left: 0, top: 0, width: 800, height: 10, fill: "#6366f1", selectable: false },
      { type: "circle", left: 560, top: -80, radius: 220, fill: "#4f46e5", opacity: 0.25, selectable: true },
      { type: "circle", left: -100, top: 720, radius: 220, fill: "#22d3ee", opacity: 0.15, selectable: true },
      { type: "textbox", left: 60, top: 90, width: 680, text: "TECH SUMMIT 2026", fontSize: 58, fontWeight: "bold", fill: "#ffffff", fontFamily: "Arial" },
      { type: "textbox", left: 60, top: 175, width: 680, text: "Innovation • AI • The Future of Code", fontSize: 24, fill: "#a5b4fc", fontFamily: "Arial" },
      { type: "textbox", left: 60, top: 430, width: 680, text: "15th April 2026", fontSize: 40, fontWeight: "bold", fill: "#22d3ee", fontFamily: "Arial" },
      { type: "textbox", left: 60, top: 480, width: 680, text: "Main Auditorium, Jinnah University for Women", fontSize: 22, fill: "#e2e8f0", fontFamily: "Arial" },
      { type: "textbox", left: 60, top: 560, width: 680, text: "Keynotes • Workshops • Hackathon • Networking", fontSize: 20, fill: "#cbd5e1", fontFamily: "Arial" },
      { type: "rect", left: 60, top: 850, width: 260, height: 60, fill: "#4f46e5", rx: 8, ry: 8 },
      { type: "textbox", left: 90, top: 868, width: 220, text: "REGISTER NOW", fontSize: 20, fontWeight: "bold", fill: "#ffffff", fontFamily: "Arial" },
      { type: "textbox", left: 60, top: 940, width: 680, text: "Organized by Creovator", fontSize: 16, fill: "#94a3b8", fontFamily: "Arial" },
    ],
  },
};

const techBanner: DesignTemplate = {
  id: "tech-banner-1",
  name: "Hackathon Web Banner",
  category: "tech",
  kind: "Banner",
  width: 1200,
  height: 400,
  thumbBg: "linear-gradient(135deg,#020617,#0891b2)",
  json: {
    background: "#020617",
    objects: [
      { type: "rect", left: 0, top: 0, width: 1200, height: 400, fill: "#020617", selectable: false },
      { type: "rect", left: 0, top: 0, width: 12, height: 400, fill: "#22d3ee", selectable: false },
      { type: "circle", left: 950, top: -60, radius: 180, fill: "#0891b2", opacity: 0.3 },
      { type: "textbox", left: 70, top: 90, width: 800, text: "24-HOUR HACKATHON", fontSize: 52, fontWeight: "bold", fill: "#ffffff", fontFamily: "Arial" },
      { type: "textbox", left: 70, top: 170, width: 800, text: "Build. Break. Ship. — June 20, 2026", fontSize: 26, fill: "#67e8f9", fontFamily: "Arial" },
      { type: "textbox", left: 70, top: 260, width: 800, text: "Tech Center | Teams of 4 | Cash Prizes", fontSize: 22, fill: "#cbd5e1", fontFamily: "Arial" },
      { type: "rect", left: 900, top: 300, width: 220, height: 55, fill: "#22d3ee", rx: 6, ry: 6 },
      { type: "textbox", left: 925, top: 316, width: 180, text: "JOIN NOW", fontSize: 20, fontWeight: "bold", fill: "#022c22", fontFamily: "Arial" },
    ],
  },
};

const techInvite: DesignTemplate = {
  id: "tech-invite-1",
  name: "Tech Meetup Invitation",
  category: "tech",
  kind: "Invitation",
  width: 600,
  height: 800,
  thumbBg: "linear-gradient(135deg,#111827,#7c3aed)",
  json: {
    background: "#111827",
    objects: [
      { type: "rect", left: 0, top: 0, width: 600, height: 800, fill: "#111827", selectable: false },
      { type: "rect", left: 30, top: 30, width: 540, height: 740, fill: "transparent", stroke: "#7c3aed", strokeWidth: 2, rx: 12, ry: 12, selectable: false },
      { type: "textbox", left: 70, top: 100, width: 460, text: "YOU'RE INVITED", fontSize: 22, fill: "#c4b5fd", fontFamily: "Arial", textAlign: "center" },
      { type: "textbox", left: 70, top: 150, width: 460, text: "AI & Robotics Meetup", fontSize: 40, fontWeight: "bold", fill: "#ffffff", fontFamily: "Arial", textAlign: "center" },
      { type: "textbox", left: 70, top: 320, width: 460, text: "Friday, 8th May 2026\n6:00 PM Onwards", fontSize: 22, fill: "#e5e7eb", fontFamily: "Arial", textAlign: "center", lineHeight: 1.4 },
      { type: "textbox", left: 70, top: 430, width: 460, text: "Innovation Hub, Block 5", fontSize: 20, fill: "#a78bfa", fontFamily: "Arial", textAlign: "center" },
      { type: "textbox", left: 70, top: 630, width: 460, text: "RSVP: creovator.app/rsvp", fontSize: 18, fill: "#9ca3af", fontFamily: "Arial", textAlign: "center" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  WEDDING TEMPLATES                                                 */
/* ------------------------------------------------------------------ */

const weddingInvite: DesignTemplate = {
  id: "wedding-invite-1",
  name: "Elegant Wedding Invitation",
  category: "wedding",
  kind: "Invitation",
  width: 600,
  height: 800,
  thumbBg: "linear-gradient(135deg,#fdf2f8,#fbcfe8)",
  json: {
    background: "#fdf2f8",
    objects: [
      { type: "rect", left: 0, top: 0, width: 600, height: 800, fill: "#fdf2f8", selectable: false },
      { type: "rect", left: 25, top: 25, width: 550, height: 750, fill: "transparent", stroke: "#d97aa8", strokeWidth: 2, rx: 4, ry: 4, selectable: false },
      { type: "textbox", left: 70, top: 90, width: 460, text: "Together with their families", fontSize: 18, fill: "#9d174d", fontFamily: "Georgia", textAlign: "center" },
      { type: "textbox", left: 70, top: 160, width: 460, text: "Ayesha & Hamza", fontSize: 46, fontWeight: "bold", fill: "#831843", fontFamily: "Georgia", textAlign: "center" },
      { type: "textbox", left: 70, top: 250, width: 460, text: "request the pleasure of your company\non their wedding day", fontSize: 18, fill: "#701a45", fontFamily: "Georgia", textAlign: "center", lineHeight: 1.4 },
      { type: "textbox", left: 70, top: 400, width: 460, text: "Saturday, 12th December 2026", fontSize: 24, fontWeight: "bold", fill: "#9d174d", fontFamily: "Georgia", textAlign: "center" },
      { type: "textbox", left: 70, top: 445, width: 460, text: "7:00 PM Onwards", fontSize: 20, fill: "#701a45", fontFamily: "Georgia", textAlign: "center" },
      { type: "textbox", left: 70, top: 510, width: 460, text: "Grand Ballroom, Karachi", fontSize: 20, fill: "#9d174d", fontFamily: "Georgia", textAlign: "center" },
      { type: "textbox", left: 70, top: 680, width: 460, text: "With love & blessings", fontSize: 16, fill: "#be185d", fontFamily: "Georgia", textAlign: "center" },
    ],
  },
};

const weddingBanner: DesignTemplate = {
  id: "wedding-banner-1",
  name: "Wedding Save-the-Date Banner",
  category: "wedding",
  kind: "Banner",
  width: 1200,
  height: 400,
  thumbBg: "linear-gradient(135deg,#fbcfe8,#f9a8d4)",
  json: {
    background: "#fdf2f8",
    objects: [
      { type: "rect", left: 0, top: 0, width: 1200, height: 400, fill: "#fdf2f8", selectable: false },
      { type: "circle", left: 950, top: 60, radius: 160, fill: "#f9a8d4", opacity: 0.4 },
      { type: "textbox", left: 80, top: 110, width: 800, text: "SAVE THE DATE", fontSize: 30, fill: "#be185d", fontFamily: "Georgia", charSpacing: 200 },
      { type: "textbox", left: 80, top: 160, width: 800, text: "Ayesha & Hamza", fontSize: 56, fontWeight: "bold", fill: "#831843", fontFamily: "Georgia" },
      { type: "textbox", left: 80, top: 260, width: 800, text: "12th December 2026  •  Grand Ballroom, Karachi", fontSize: 22, fill: "#701a45", fontFamily: "Georgia" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  PARTY / FUN GALA TEMPLATES                                        */
/* ------------------------------------------------------------------ */

const partyFlyer: DesignTemplate = {
  id: "party-flyer-1",
  name: "Fun Party Flyer",
  category: "party",
  kind: "Flyer",
  width: 700,
  height: 900,
  thumbBg: "linear-gradient(135deg,#f97316,#db2777)",
  json: {
    background: "#1e1b4b",
    objects: [
      { type: "rect", left: 0, top: 0, width: 700, height: 900, fill: "#1e1b4b", selectable: false },
      { type: "circle", left: -60, top: -60, radius: 180, fill: "#f97316", opacity: 0.5 },
      { type: "circle", left: 520, top: 700, radius: 220, fill: "#db2777", opacity: 0.5 },
      { type: "textbox", left: 60, top: 130, width: 580, text: "SPRING GALA", fontSize: 66, fontWeight: "bold", fill: "#fde047", fontFamily: "Arial", textAlign: "center" },
      { type: "textbox", left: 60, top: 220, width: 580, text: "NIGHT PARTY", fontSize: 44, fontWeight: "bold", fill: "#ffffff", fontFamily: "Arial", textAlign: "center" },
      { type: "textbox", left: 60, top: 420, width: 580, text: "10th May 2026 | 8 PM Onwards", fontSize: 26, fill: "#fbcfe8", fontFamily: "Arial", textAlign: "center" },
      { type: "textbox", left: 60, top: 470, width: 580, text: "Grand Ballroom, Karachi", fontSize: 24, fill: "#e9d5ff", fontFamily: "Arial", textAlign: "center" },
      { type: "textbox", left: 60, top: 560, width: 580, text: "Music • Dance • Food • Prizes", fontSize: 22, fill: "#fde047", fontFamily: "Arial", textAlign: "center" },
      { type: "rect", left: 235, top: 720, width: 230, height: 60, fill: "#f97316", rx: 30, ry: 30 },
      { type: "textbox", left: 260, top: 738, width: 180, text: "GET TICKETS", fontSize: 20, fontWeight: "bold", fill: "#1e1b4b", fontFamily: "Arial" },
    ],
  },
};

const galaBanner: DesignTemplate = {
  id: "gala-banner-1",
  name: "Fun Gala Banner",
  category: "party",
  kind: "Banner",
  width: 1200,
  height: 400,
  thumbBg: "linear-gradient(135deg,#7c3aed,#ec4899)",
  json: {
    background: "#312e81",
    objects: [
      { type: "rect", left: 0, top: 0, width: 1200, height: 400, fill: "#312e81", selectable: false },
      { type: "circle", left: 1000, top: -80, radius: 220, fill: "#ec4899", opacity: 0.35 },
      { type: "textbox", left: 70, top: 100, width: 800, text: "ANNUAL FUN GALA", fontSize: 54, fontWeight: "bold", fill: "#fde047", fontFamily: "Arial" },
      { type: "textbox", left: 70, top: 185, width: 800, text: "An evening of music, laughter & celebration", fontSize: 24, fill: "#f5d0fe", fontFamily: "Arial" },
      { type: "textbox", left: 70, top: 260, width: 800, text: "20th June 2026 • Open Lawn, Karachi", fontSize: 22, fill: "#e9d5ff", fontFamily: "Arial" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  BIRTHDAY TEMPLATE                                                  */
/* ------------------------------------------------------------------ */

const birthdayPoster: DesignTemplate = {
  id: "birthday-poster-1",
  name: "Birthday Celebration Poster",
  category: "birthday",
  kind: "Poster",
  width: 800,
  height: 1000,
  thumbBg: "linear-gradient(135deg,#fb7185,#facc15)",
  json: {
    background: "#fff1f2",
    objects: [
      { type: "rect", left: 0, top: 0, width: 800, height: 1000, fill: "#fff1f2", selectable: false },
      { type: "circle", left: -80, top: -80, radius: 200, fill: "#facc15", opacity: 0.5 },
      { type: "circle", left: 600, top: 780, radius: 220, fill: "#fb7185", opacity: 0.4 },
      { type: "textbox", left: 60, top: 200, width: 680, text: "HAPPY BIRTHDAY!", fontSize: 60, fontWeight: "bold", fill: "#be123c", fontFamily: "Arial", textAlign: "center" },
      { type: "textbox", left: 60, top: 300, width: 680, text: "Join us to celebrate", fontSize: 26, fill: "#9f1239", fontFamily: "Arial", textAlign: "center" },
      { type: "textbox", left: 60, top: 500, width: 680, text: "Saturday, 6th June 2026", fontSize: 30, fontWeight: "bold", fill: "#be123c", fontFamily: "Arial", textAlign: "center" },
      { type: "textbox", left: 60, top: 545, width: 680, text: "5:00 PM • Sunset Lawn", fontSize: 24, fill: "#9f1239", fontFamily: "Arial", textAlign: "center" },
      { type: "textbox", left: 60, top: 650, width: 680, text: "Cake • Games • Music • Fun", fontSize: 22, fill: "#e11d48", fontFamily: "Arial", textAlign: "center" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  OTHERS / GENERIC TEMPLATE                                         */
/* ------------------------------------------------------------------ */

const genericBanner: DesignTemplate = {
  id: "others-banner-1",
  name: "General Event Banner",
  category: "others",
  kind: "Banner",
  width: 1200,
  height: 400,
  thumbBg: "linear-gradient(135deg,#0f766e,#14b8a6)",
  json: {
    background: "#134e4a",
    objects: [
      { type: "rect", left: 0, top: 0, width: 1200, height: 400, fill: "#134e4a", selectable: false },
      { type: "textbox", left: 70, top: 130, width: 900, text: "YOUR EVENT TITLE HERE", fontSize: 50, fontWeight: "bold", fill: "#ffffff", fontFamily: "Arial" },
      { type: "textbox", left: 70, top: 210, width: 900, text: "Date  •  Venue  •  Details go here", fontSize: 24, fill: "#99f6e4", fontFamily: "Arial" },
    ],
  },
};

export const designTemplates: DesignTemplate[] = [
  techPoster,
  techBanner,
  techInvite,
  weddingInvite,
  weddingBanner,
  partyFlyer,
  galaBanner,
  birthdayPoster,
  genericBanner,
];

export const getTemplateById = (id: string) =>
  designTemplates.find((t) => t.id === id);

export const categoryLabels: Record<DesignCategory, string> = {
  tech: "Tech Events",
  party: "Party / Fun Gala",
  wedding: "Weddings",
  birthday: "Birthday Parties",
  others: "Others",
};
