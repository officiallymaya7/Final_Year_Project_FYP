export type DesignCategoryKey =
  | "certificate" | "id_card" | "poster" | "banner"
  | "flyer" | "social_post" | "invitation" | "standee" | "backdrop";

export interface DesignCategoryInfo {
  key: DesignCategoryKey;
  label: string;
  icon: string;
  bulk: boolean; // true = generated per-participant (Certificate/ID Card)
}

export const DESIGN_CATEGORIES: DesignCategoryInfo[] = [
  { key: "certificate",  label: "Certificate",       icon: "Award",       bulk: true },
  { key: "id_card",      label: "ID Card",           icon: "CreditCard",  bulk: true },
  { key: "poster",       label: "Poster",             icon: "Image",       bulk: false },
  { key: "banner",       label: "Banner",             icon: "RectangleHorizontal", bulk: false },
  { key: "flyer",        label: "Flyer",              icon: "FileText",    bulk: false },
  { key: "social_post",  label: "Social Media Post",  icon: "Share2",      bulk: false },
  { key: "invitation",   label: "Invitation Card",    icon: "Mail",        bulk: false },
  { key: "standee",      label: "Standee",            icon: "PanelTop",    bulk: false },
  { key: "backdrop",     label: "Backdrop",           icon: "PanelsTopLeft", bulk: false },
];

// Matches event_brand_kit table columns 1:1 (minus id/event_id/user_id)
export interface PackageBrandKit {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  pattern: "none" | "dots" | "waves" | "geometric" | "diagonal";
  logo_url: string | null;
}

export interface DesignPackage {
  key: string;
  name: string;
  description: string;
  thumbnailGradient: string;
  brandKit: PackageBrandKit;
}

export const DESIGN_PACKAGES: DesignPackage[] = [
  {
    key: "modern-blue",
    name: "Modern Blue Theme",
    description: "Clean, professional, tech-conference feel.",
    thumbnailGradient: "linear-gradient(135deg,#1E3A8A,#2563EB,#93C5FD)",
    brandKit: {
      primary_color: "#1E3A8A",
      secondary_color: "#2563EB",
      accent_color: "#93C5FD",
      font_heading: "Poppins",
      font_body: "Inter",
      pattern: "geometric",
      logo_url: null,
    },
  },
  {
    key: "corporate-purple",
    name: "Corporate Purple Theme",
    description: "Elegant, formal, enterprise events.",
    thumbnailGradient: "linear-gradient(135deg,#4C1D95,#6D28D9,#C4B5FD)",
    brandKit: {
      primary_color: "#4C1D95",
      secondary_color: "#6D28D9",
      accent_color: "#C4B5FD",
      font_heading: "Playfair Display",
      font_body: "Inter",
      pattern: "diagonal",
      logo_url: null,
    },
  },
  {
    key: "minimal-black",
    name: "Minimal Black Theme",
    description: "Bold, minimal, high-contrast.",
    thumbnailGradient: "linear-gradient(135deg,#111827,#374151,#9CA3AF)",
    brandKit: {
      primary_color: "#111827",
      secondary_color: "#374151",
      accent_color: "#F9BB1E",
      font_heading: "Montserrat",
      font_body: "Inter",
      pattern: "dots",
      logo_url: null,
    },
  },
  {
    key: "nature-green",
    name: "Nature Green Theme",
    description: "Fresh, organic, sustainability-themed events.",
    thumbnailGradient: "linear-gradient(135deg,#065F46,#10B981,#6EE7B7)",
    brandKit: {
      primary_color: "#065F46",
      secondary_color: "#10B981",
      accent_color: "#6EE7B7",
      font_heading: "Poppins",
      font_body: "Inter",
      pattern: "waves",
      logo_url: null,
    },
  },
];

export const getPackageByKey = (key: string) =>
  DESIGN_PACKAGES.find((p) => p.key === key) || DESIGN_PACKAGES[0];