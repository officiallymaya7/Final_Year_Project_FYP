export interface CertificateData {
  participantName: string;
  eventName: string;
  date: string;
  organizerName?: string;
  category?: string;
}

export interface CertificateTemplate {
  key: string;
  name: string;
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, data: CertificateData) => void;
}

// ── 1. Elegant Gold ───────────────────────────────────────────────────────────
const drawElegantGold = (ctx: CanvasRenderingContext2D, data: CertificateData) => {
  const W = 1200, H = 850;
  ctx.fillStyle = "#FFFDF6";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#C9A227";
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 55, W - 110, H - 110);

  const corners = [[55, 55], [W - 55, 55], [55, H - 55], [W - 55, H - 55]] as [number, number][];
  ctx.fillStyle = "#C9A227";
  corners.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 14); ctx.lineTo(x + 14, y); ctx.lineTo(x, y + 14); ctx.lineTo(x - 14, y);
    ctx.closePath(); ctx.fill();
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#2B2B2B";
  ctx.font = "bold 46px Georgia, serif";
  ctx.fillText("CERTIFICATE OF PARTICIPATION", W / 2, 190);

  ctx.font = "italic 22px Georgia, serif";
  ctx.fillStyle = "#6B6B6B";
  ctx.fillText("This certificate is proudly presented to", W / 2, 250);

  ctx.font = "italic bold 54px Georgia, serif";
  ctx.fillStyle = "#C9A227";
  ctx.fillText(data.participantName, W / 2, 340);

  const nameWidth = ctx.measureText(data.participantName).width;
  ctx.strokeStyle = "#C9A227";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameWidth / 2 - 20, 360);
  ctx.lineTo(W / 2 + nameWidth / 2 + 20, 360);
  ctx.stroke();

  ctx.font = "20px Georgia, serif";
  ctx.fillStyle = "#2B2B2B";
  const roleText = data.category ? `for participating as ${data.category} in` : "for participating in";
  ctx.fillText(roleText, W / 2, 420);

  ctx.font = "bold 30px Georgia, serif";
  ctx.fillText(data.eventName, W / 2, 460);

  ctx.font = "18px Georgia, serif";
  ctx.fillStyle = "#6B6B6B";
  ctx.fillText(data.date, W / 2, 500);

  ctx.strokeStyle = "#999";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(180, 740); ctx.lineTo(420, 740); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - 420, 740); ctx.lineTo(W - 180, 740); ctx.stroke();

  ctx.font = "16px Georgia, serif";
  ctx.fillStyle = "#444";
  ctx.fillText("Organizer", 300, 765);
  ctx.fillText(data.organizerName || "Event Coordinator", W - 300, 765);
};

// ── 2. Modern Blue ────────────────────────────────────────────────────────────
const drawModernBlue = (ctx: CanvasRenderingContext2D, data: CertificateData) => {
  const W = 1200, H = 850;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#1E3A8A";
  ctx.fillRect(0, 0, 40, H);
  ctx.fillStyle = "#2563EB";
  ctx.fillRect(40, 0, W - 40, 14);

  ctx.textAlign = "center";
  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 44px Arial, sans-serif";
  ctx.fillText("CERTIFICATE OF ACHIEVEMENT", W / 2 + 20, 180);

  ctx.font = "20px Arial, sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.fillText("This certificate is awarded to", W / 2 + 20, 230);

  ctx.font = "bold 52px Arial, sans-serif";
  ctx.fillStyle = "#2563EB";
  ctx.fillText(data.participantName, W / 2 + 20, 320);

  const nameWidth = ctx.measureText(data.participantName).width;
  ctx.strokeStyle = "#2563EB";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 + 20 - nameWidth / 2 - 20, 340);
  ctx.lineTo(W / 2 + 20 + nameWidth / 2 + 20, 340);
  ctx.stroke();

  ctx.font = "20px Arial, sans-serif";
  ctx.fillStyle = "#1E293B";
  const roleText = data.category ? `for participating as ${data.category} in` : "for successfully participating in";
  ctx.fillText(roleText, W / 2 + 20, 400);

  ctx.font = "bold 30px Arial, sans-serif";
  ctx.fillText(data.eventName, W / 2 + 20, 440);

  ctx.font = "16px Arial, sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.fillText(data.date, W / 2 + 20, 480);

  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(200, 740); ctx.lineTo(440, 740); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - 440, 740); ctx.lineTo(W - 200, 740); ctx.stroke();

  ctx.font = "14px Arial, sans-serif";
  ctx.fillStyle = "#334155";
  ctx.fillText("Organizer", 320, 765);
  ctx.fillText(data.organizerName || "Event Coordinator", W - 320, 765);
};

// ── 3. Royal Purple ───────────────────────────────────────────────────────────
const drawRoyalPurple = (ctx: CanvasRenderingContext2D, data: CertificateData) => {
  const W = 1200, H = 850;

  // Background gradient effect
  ctx.fillStyle = "#F5F0FF";
  ctx.fillRect(0, 0, W, H);

  // Top and bottom bars
  ctx.fillStyle = "#6D28D9";
  ctx.fillRect(0, 0, W, 12);
  ctx.fillRect(0, H - 12, W, 12);

  // Left accent bar
  ctx.fillStyle = "#7C3AED";
  ctx.fillRect(0, 0, 8, H);

  // Inner border
  ctx.strokeStyle = "#7C3AED";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // Decorative corners
  const drawCorner = (x: number, y: number, flip: boolean) => {
    ctx.strokeStyle = "#A78BFA";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + (flip ? -40 : 40));
    ctx.lineTo(x, y);
    ctx.lineTo(x + (flip ? -40 : 40), y);
    ctx.stroke();
  };
  drawCorner(60, 60, false);
  drawCorner(W - 60, 60, true);
  drawCorner(60, H - 60, false);
  drawCorner(W - 60, H - 60, true);

  ctx.textAlign = "center";
  ctx.fillStyle = "#4C1D95";
  ctx.font = "bold 42px Georgia, serif";
  ctx.fillText("CERTIFICATE OF EXCELLENCE", W / 2, 185);

  ctx.font = "italic 20px Georgia, serif";
  ctx.fillStyle = "#7C3AED";
  ctx.fillText("This certificate is proudly presented to", W / 2, 240);

  ctx.font = "italic bold 56px Georgia, serif";
  ctx.fillStyle = "#6D28D9";
  ctx.fillText(data.participantName, W / 2, 335);

  ctx.font = "20px Georgia, serif";
  ctx.fillStyle = "#374151";
  ctx.fillText(data.category ? `for outstanding participation as ${data.category} in` : "for outstanding participation in", W / 2, 400);

  ctx.font = "bold 28px Georgia, serif";
  ctx.fillStyle = "#1F2937";
  ctx.fillText(data.eventName, W / 2, 440);

  ctx.font = "17px Georgia, serif";
  ctx.fillStyle = "#6B7280";
  ctx.fillText(data.date, W / 2, 480);

  ctx.strokeStyle = "#A78BFA";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(160, 730); ctx.lineTo(400, 730); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - 400, 730); ctx.lineTo(W - 160, 730); ctx.stroke();

  ctx.font = "15px Georgia, serif";
  ctx.fillStyle = "#4B5563";
  ctx.fillText("Organizer", 280, 755);
  ctx.fillText(data.organizerName || "Event Coordinator", W - 280, 755);
};

// ── 4. Emerald Green ─────────────────────────────────────────────────────────
const drawEmeraldGreen = (ctx: CanvasRenderingContext2D, data: CertificateData) => {
  const W = 1200, H = 850;
  ctx.fillStyle = "#F0FDF4";
  ctx.fillRect(0, 0, W, H);

  // Green side panel
  ctx.fillStyle = "#065F46";
  ctx.fillRect(0, 0, 60, H);

  // Top accent
  ctx.fillStyle = "#10B981";
  ctx.fillRect(60, 0, W - 60, 10);

  // Decorative circles on left panel
  ctx.fillStyle = "#10B981";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(30, 150 + i * 130, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#064E3B";
  ctx.font = "bold 44px Georgia, serif";
  ctx.fillText("CERTIFICATE OF PARTICIPATION", W / 2 + 30, 175);

  // Decorative line
  ctx.strokeStyle = "#10B981";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(200, 195); ctx.lineTo(W - 100, 195);
  ctx.stroke();

  ctx.font = "italic 21px Georgia, serif";
  ctx.fillStyle = "#059669";
  ctx.fillText("With great pride, this certificate is awarded to", W / 2 + 30, 245);

  ctx.font = "italic bold 54px Georgia, serif";
  ctx.fillStyle = "#065F46";
  ctx.fillText(data.participantName, W / 2 + 30, 340);

  ctx.font = "20px Georgia, serif";
  ctx.fillStyle = "#1F2937";
  ctx.fillText(data.category ? `for participating as ${data.category} in` : "for participating in", W / 2 + 30, 405);

  ctx.font = "bold 30px Georgia, serif";
  ctx.fillText(data.eventName, W / 2 + 30, 448);

  ctx.font = "17px Georgia, serif";
  ctx.fillStyle = "#6B7280";
  ctx.fillText(data.date, W / 2 + 30, 490);

  ctx.strokeStyle = "#6EE7B7";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(180, 730); ctx.lineTo(420, 730); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - 320, 730); ctx.lineTo(W - 100, 730); ctx.stroke();

  ctx.font = "15px Georgia, serif";
  ctx.fillStyle = "#374151";
  ctx.fillText("Organizer", 300, 755);
  ctx.fillText(data.organizerName || "Event Coordinator", W - 210, 755);
};

// ── 5. Classic Red ────────────────────────────────────────────────────────────
const drawClassicRed = (ctx: CanvasRenderingContext2D, data: CertificateData) => {
  const W = 1200, H = 850;
  ctx.fillStyle = "#FFFBFB";
  ctx.fillRect(0, 0, W, H);

  // Red header band
  ctx.fillStyle = "#991B1B";
  ctx.fillRect(0, 0, W, 100);

  // Red footer band
  ctx.fillStyle = "#991B1B";
  ctx.fillRect(0, H - 70, W, 70);

  // Gold border
  ctx.strokeStyle = "#B91C1C";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 110, W - 40, H - 185);

  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 42px Georgia, serif";
  ctx.fillText("CERTIFICATE OF RECOGNITION", W / 2, 62);

  ctx.fillStyle = "#FEF2F2";
  ctx.font = "italic 16px Georgia, serif";
  ctx.fillText("Excellence in Participation", W / 2, 88);

  ctx.font = "italic 21px Georgia, serif";
  ctx.fillStyle = "#B91C1C";
  ctx.fillText("This is to certify that", W / 2, 190);

  ctx.font = "italic bold 56px Georgia, serif";
  ctx.fillStyle = "#7F1D1D";
  ctx.fillText(data.participantName, W / 2, 285);

  ctx.strokeStyle = "#EF4444";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 260, 305); ctx.lineTo(W / 2 + 260, 305);
  ctx.stroke();

  ctx.font = "20px Georgia, serif";
  ctx.fillStyle = "#1F2937";
  ctx.fillText(data.category ? `has participated as ${data.category} in` : "has successfully participated in", W / 2, 365);

  ctx.font = "bold 30px Georgia, serif";
  ctx.fillText(data.eventName, W / 2, 408);

  ctx.font = "17px Georgia, serif";
  ctx.fillStyle = "#6B7280";
  ctx.fillText(data.date, W / 2, 450);

  ctx.strokeStyle = "#FECACA";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(150, 680); ctx.lineTo(390, 680); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - 390, 680); ctx.lineTo(W - 150, 680); ctx.stroke();

  ctx.font = "15px Georgia, serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Organizer", 270, 750);
  ctx.fillText(data.organizerName || "Event Coordinator", W - 270, 750);
};

// ── 6. Navy & Silver ─────────────────────────────────────────────────────────
const drawNavySilver = (ctx: CanvasRenderingContext2D, data: CertificateData) => {
  const W = 1200, H = 850;
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(0, 0, W, H);

  // Silver border
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 4;
  ctx.strokeRect(25, 25, W - 50, H - 50);
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // Top accent line
  ctx.strokeStyle = "#F1F5F9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 120); ctx.lineTo(W - 100, 120);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#F1F5F9";
  ctx.font = "bold 44px Arial, sans-serif";
  ctx.fillText("CERTIFICATE OF DISTINCTION", W / 2, 95);

  ctx.font = "italic 20px Arial, sans-serif";
  ctx.fillStyle = "#94A3B8";
  ctx.fillText("This certificate is proudly presented to", W / 2, 180);

  ctx.font = "italic bold 54px Georgia, serif";
  ctx.fillStyle = "#E2E8F0";
  ctx.fillText(data.participantName, W / 2, 280);

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(250, 300); ctx.lineTo(W - 250, 300);
  ctx.stroke();

  ctx.font = "20px Arial, sans-serif";
  ctx.fillStyle = "#CBD5E1";
  ctx.fillText(data.category ? `for participating as ${data.category} in` : "for participating in", W / 2, 360);

  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillStyle = "#F8FAFC";
  ctx.fillText(data.eventName, W / 2, 400);

  ctx.font = "17px Arial, sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.fillText(data.date, W / 2, 440);

  // Bottom accent line
  ctx.strokeStyle = "#F1F5F9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, H - 120); ctx.lineTo(W - 100, H - 120);
  ctx.stroke();

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(160, H - 80); ctx.lineTo(380, H - 80); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - 380, H - 80); ctx.lineTo(W - 160, H - 80); ctx.stroke();

  ctx.font = "14px Arial, sans-serif";
  ctx.fillStyle = "#94A3B8";
  ctx.fillText("Organizer", 270, H - 58);
  ctx.fillText(data.organizerName || "Event Coordinator", W - 270, H - 58);
};

// ── 7. Sunrise Orange ────────────────────────────────────────────────────────
const drawSunriseOrange = (ctx: CanvasRenderingContext2D, data: CertificateData) => {
  const W = 1200, H = 850;
  ctx.fillStyle = "#FFFBEB";
  ctx.fillRect(0, 0, W, H);

  // Orange header
  ctx.fillStyle = "#D97706";
  ctx.fillRect(0, 0, W, 90);

  // Thin accent
  ctx.fillStyle = "#FCD34D";
  ctx.fillRect(0, 90, W, 6);

  // Right decorative block
  ctx.fillStyle = "#FDE68A";
  ctx.fillRect(W - 120, 96, 120, H - 96);

  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 40px Georgia, serif";
  ctx.fillText("CERTIFICATE OF APPRECIATION", W / 2, 58);

  ctx.fillStyle = "#FEF3C7";
  ctx.font = "italic 16px Georgia, serif";
  ctx.fillText("In recognition of dedicated participation", W / 2, 82);

  ctx.font = "italic 21px Georgia, serif";
  ctx.fillStyle = "#92400E";
  ctx.fillText("This certificate is presented to", W / 2 - 60, 175);

  ctx.font = "italic bold 56px Georgia, serif";
  ctx.fillStyle = "#B45309";
  ctx.fillText(data.participantName, W / 2 - 60, 275);

  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 320, 295); ctx.lineTo(W / 2 + 200, 295);
  ctx.stroke();

  ctx.font = "19px Georgia, serif";
  ctx.fillStyle = "#1F2937";
  ctx.fillText(data.category ? `for participating as ${data.category} in` : "for participating in", W / 2 - 60, 355);

  ctx.font = "bold 29px Georgia, serif";
  ctx.fillText(data.eventName, W / 2 - 60, 398);

  ctx.font = "17px Georgia, serif";
  ctx.fillStyle = "#6B7280";
  ctx.fillText(data.date, W / 2 - 60, 440);

  ctx.strokeStyle = "#FCD34D";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(140, 720); ctx.lineTo(360, 720); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(560, 720); ctx.lineTo(780, 720); ctx.stroke();

  ctx.font = "15px Georgia, serif";
  ctx.fillStyle = "#374151";
  ctx.fillText("Organizer", 250, 745);
  ctx.fillText(data.organizerName || "Event Coordinator", 670, 745);
};

// ── 8. Minimalist White ───────────────────────────────────────────────────────
const drawMinimalistWhite = (ctx: CanvasRenderingContext2D, data: CertificateData) => {
  const W = 1200, H = 850;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // Thin top line
  ctx.fillStyle = "#111827";
  ctx.fillRect(80, 60, W - 160, 3);

  // Thin bottom line
  ctx.fillRect(80, H - 60, W - 160, 3);

  ctx.textAlign = "center";
  ctx.fillStyle = "#111827";
  ctx.font = "300 18px Arial, sans-serif";
  ctx.fillText("C E R T I F I C A T E   O F   P A R T I C I P A T I O N", W / 2, 120);

  ctx.strokeStyle = "#E5E7EB";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, 145); ctx.lineTo(W - 200, 145);
  ctx.stroke();

  ctx.font = "italic 20px Georgia, serif";
  ctx.fillStyle = "#6B7280";
  ctx.fillText("This certificate is proudly presented to", W / 2, 230);

  ctx.font = "italic 64px Georgia, serif";
  ctx.fillStyle = "#111827";
  ctx.fillText(data.participantName, W / 2, 340);

  ctx.strokeStyle = "#D1D5DB";
  ctx.lineWidth = 1;
  const nw = ctx.measureText(data.participantName).width;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nw / 2, 358); ctx.lineTo(W / 2 + nw / 2, 358);
  ctx.stroke();

  ctx.font = "19px Arial, sans-serif";
  ctx.fillStyle = "#374151";
  ctx.fillText(data.category ? `for participating as ${data.category} in` : "for participating in", W / 2, 415);

  ctx.font = "bold 26px Arial, sans-serif";
  ctx.fillStyle = "#111827";
  ctx.fillText(data.eventName, W / 2, 455);

  ctx.font = "16px Arial, sans-serif";
  ctx.fillStyle = "#9CA3AF";
  ctx.fillText(data.date, W / 2, 495);

  ctx.strokeStyle = "#E5E7EB";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(160, 720); ctx.lineTo(380, 720); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - 380, 720); ctx.lineTo(W - 160, 720); ctx.stroke();

  ctx.font = "13px Arial, sans-serif";
  ctx.fillStyle = "#6B7280";
  ctx.fillText("Organizer", 270, 745);
  ctx.fillText(data.organizerName || "Event Coordinator", W - 270, 745);
};

// ── 9. Rose Gold ─────────────────────────────────────────────────────────────
const drawRoseGold = (ctx: CanvasRenderingContext2D, data: CertificateData) => {
  const W = 1200, H = 850;
  ctx.fillStyle = "#FFF1F2";
  ctx.fillRect(0, 0, W, H);

  // Rose gold border
  ctx.strokeStyle = "#E11D48";
  ctx.lineWidth = 5;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  ctx.strokeStyle = "#FDA4AF";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // Corner ornaments
  const ornament = (x: number, y: number) => {
    ctx.fillStyle = "#E11D48";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FDA4AF";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  };
  ornament(48, 48); ornament(W - 48, 48);
  ornament(48, H - 48); ornament(W - 48, H - 48);

  ctx.textAlign = "center";
  ctx.fillStyle = "#881337";
  ctx.font = "bold 44px Georgia, serif";
  ctx.fillText("CERTIFICATE OF PARTICIPATION", W / 2, 185);

  ctx.font = "italic 20px Georgia, serif";
  ctx.fillStyle = "#E11D48";
  ctx.fillText("This certificate is presented with honor to", W / 2, 240);

  ctx.font = "italic bold 54px Georgia, serif";
  ctx.fillStyle = "#BE123C";
  ctx.fillText(data.participantName, W / 2, 335);

  ctx.strokeStyle = "#FDA4AF";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const nw = ctx.measureText(data.participantName).width;
  ctx.moveTo(W / 2 - nw / 2 - 20, 355); ctx.lineTo(W / 2 + nw / 2 + 20, 355);
  ctx.stroke();

  ctx.font = "19px Georgia, serif";
  ctx.fillStyle = "#1F2937";
  ctx.fillText(data.category ? `for participating as ${data.category} in` : "for participating in", W / 2, 415);

  ctx.font = "bold 28px Georgia, serif";
  ctx.fillText(data.eventName, W / 2, 455);

  ctx.font = "16px Georgia, serif";
  ctx.fillStyle = "#6B7280";
  ctx.fillText(data.date, W / 2, 492);

  ctx.strokeStyle = "#FDA4AF";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(160, 720); ctx.lineTo(380, 720); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - 380, 720); ctx.lineTo(W - 160, 720); ctx.stroke();

  ctx.font = "15px Georgia, serif";
  ctx.fillStyle = "#4B5563";
  ctx.fillText("Organizer", 270, 745);
  ctx.fillText(data.organizerName || "Event Coordinator", W - 270, 745);
};

// ── 10. Teal Wave ────────────────────────────────────────────────────────────
const drawTealWave = (ctx: CanvasRenderingContext2D, data: CertificateData) => {
  const W = 1200, H = 850;
  ctx.fillStyle = "#F0FDFA";
  ctx.fillRect(0, 0, W, H);

  // Top wave band
  ctx.fillStyle = "#0F766E";
  ctx.fillRect(0, 0, W, 80);

  // Wave shape at bottom of top band
  ctx.fillStyle = "#F0FDFA";
  ctx.beginPath();
  ctx.moveTo(0, 80);
  for (let x = 0; x <= W; x += 60) {
    ctx.quadraticCurveTo(x + 30, 110, x + 60, 80);
  }
  ctx.lineTo(W, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  // Bottom accent
  ctx.fillStyle = "#0F766E";
  ctx.fillRect(0, H - 60, W, 60);

  // Teal left bar
  ctx.fillStyle = "#14B8A6";
  ctx.fillRect(0, 80, 10, H - 140);

  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 36px Arial, sans-serif";
  ctx.fillText("CERTIFICATE OF PARTICIPATION", W / 2, 52);

  ctx.font = "italic 20px Georgia, serif";
  ctx.fillStyle = "#0F766E";
  ctx.fillText("This certificate is proudly presented to", W / 2, 165);

  ctx.font = "italic bold 54px Georgia, serif";
  ctx.fillStyle = "#134E4A";
  ctx.fillText(data.participantName, W / 2, 265);

  ctx.strokeStyle = "#2DD4BF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const nw = ctx.measureText(data.participantName).width;
  ctx.moveTo(W / 2 - nw / 2 - 20, 285); ctx.lineTo(W / 2 + nw / 2 + 20, 285);
  ctx.stroke();

  ctx.font = "19px Georgia, serif";
  ctx.fillStyle = "#1F2937";
  ctx.fillText(data.category ? `for participating as ${data.category} in` : "for participating in", W / 2, 345);

  ctx.font = "bold 28px Georgia, serif";
  ctx.fillText(data.eventName, W / 2, 385);

  ctx.font = "16px Georgia, serif";
  ctx.fillStyle = "#6B7280";
  ctx.fillText(data.date, W / 2, 425);

  ctx.strokeStyle = "#99F6E4";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(150, 670); ctx.lineTo(380, 670); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - 380, 670); ctx.lineTo(W - 150, 670); ctx.stroke();

  ctx.font = "14px Georgia, serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Organizer", 265, H - 25);
  ctx.fillText(data.organizerName || "Event Coordinator", W - 265, H - 25);
};

export const certificateTemplates: CertificateTemplate[] = [
  { key: "elegant-gold",    name: "Elegant Gold",      width: 1200, height: 850, draw: drawElegantGold },
  { key: "modern-blue",     name: "Modern Blue",       width: 1200, height: 850, draw: drawModernBlue },
  { key: "royal-purple",    name: "Royal Purple",      width: 1200, height: 850, draw: drawRoyalPurple },
  { key: "emerald-green",   name: "Emerald Green",     width: 1200, height: 850, draw: drawEmeraldGreen },
  { key: "classic-red",     name: "Classic Red",       width: 1200, height: 850, draw: drawClassicRed },
  { key: "navy-silver",     name: "Navy & Silver",     width: 1200, height: 850, draw: drawNavySilver },
  { key: "sunrise-orange",  name: "Sunrise Orange",    width: 1200, height: 850, draw: drawSunriseOrange },
  { key: "minimalist-white",name: "Minimalist White",  width: 1200, height: 850, draw: drawMinimalistWhite },
  { key: "rose-gold",       name: "Rose Gold",         width: 1200, height: 850, draw: drawRoseGold },
  { key: "teal-wave",       name: "Teal Wave",         width: 1200, height: 850, draw: drawTealWave },
];