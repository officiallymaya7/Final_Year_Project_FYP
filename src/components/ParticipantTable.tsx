import { useState, useEffect } from "react";
import { Search, UserPlus, FileDown, Upload, Pencil, Trash2, AlertTriangle, X, Check, Loader2, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

export interface Participant {
  id: string;
  event_id?: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  category?: string;
  day_number?: number;
  list_name?: string;
  [key: string]: any;
}

interface Props {
  title: string;
  event_id: string;
  day_number: number;
  participants: Participant[];
  onUpdate: (participants: Participant[]) => void;
  isTechEvent?: boolean;
  isCustomEvent?: boolean;
}

// ─── Country Codes ────────────────────────────────────────────────────────────
const countryCodes = [
  { code: "+92", flag: "🇵🇰", name: "PK" },
  { code: "+1",  flag: "🇺🇸", name: "US" },
  { code: "+44", flag: "🇬🇧", name: "GB" },
  { code: "+91", flag: "🇮🇳", name: "IN" },
  { code: "+971", flag: "🇦🇪", name: "AE" },
  { code: "+966", flag: "🇸🇦", name: "SA" },
  { code: "+61", flag: "🇦🇺", name: "AU" },
  { code: "+49", flag: "🇩🇪", name: "DE" },
  { code: "+33", flag: "🇫🇷", name: "FR" },
  { code: "+86", flag: "🇨🇳", name: "CN" },
];

// ─── Phone Input with Country Code ───────────────────────────────────────────
const PhoneInput = ({
  value,
  countryCode,
  onPhoneChange,
  onCountryChange,
  hasError,
  placeholder,
}: {
  value: string;
  countryCode: string;
  onPhoneChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  hasError?: boolean;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const selected = countryCodes.find(c => c.code === countryCode) || countryCodes[0];

  return (
    <div className={`flex rounded-lg border ${hasError ? "border-destructive" : "border-border"} bg-background overflow-hidden focus-within:border-primary transition-colors`}>
      {/* Country picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 px-2 py-2 h-full text-sm bg-muted/40 hover:bg-muted/60 transition-colors border-r border-border"
        >
          <span>{selected.flag}</span>
          <span className="text-xs font-mono text-muted-foreground">{selected.code}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        {open && (
          <div className="absolute top-full left-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-xl min-w-[160px] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
            {countryCodes.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onCountryChange(c.code); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left ${c.code === countryCode ? "bg-primary/10 text-primary" : ""}`}
              >
                <span>{c.flag}</span>
                <span className="font-mono text-xs">{c.code}</span>
                <span className="text-muted-foreground text-xs">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Phone number input */}
      <input
        type="tel"
        value={value}
        onChange={e => onPhoneChange(e.target.value.replace(/\D/g, ""))}
        placeholder={placeholder || "Phone number"}
        className="flex-1 px-2 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
        maxLength={15}
      />
    </div>
  );
};

// ─── Delete Confirmation Modal ───────────────────────────────────────────────
const DeleteParticipantModal = ({
  name, onConfirm, onCancel, isDeleting,
}: { name: string; onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-lg font-bold text-center mb-1">Remove Participant?</h2>
      <p className="text-sm text-muted-foreground text-center mb-2">You are about to remove:</p>
      <p className="text-base font-semibold text-[#F9BB1E] text-center mb-4">"{name}"</p>
      <p className="text-xs text-muted-foreground text-center bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 mb-5">
        ⚠️ This participant will be permanently deleted from the database.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={isDeleting}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={isDeleting}
          className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : <><Trash2 className="h-4 w-4" /> Delete</>}
        </button>
      </div>
    </div>
  </div>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const EditParticipantModal = ({
  participant, onSave, onCancel, isSaving,
}: {
  participant: Participant;
  onSave: (updated: Participant) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [form, setForm] = useState({
    name: participant.name || "",
    email: participant.email || "",
    phone: participant.phone?.replace(/^\+\d+\s?/, "") || "",
    organization: participant.organization || "",
  });
  const [countryCode, setCountryCode] = useState("+92");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    const nameVal = form.name.trim();
    if (!nameVal || nameVal.length < 2) errs.name = "Name must be at least 2 characters";
    if (/^\d+$/.test(nameVal)) errs.name = "Name cannot be only numbers";
    // Email optional — validate only if filled
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email format";
    // Phone optional — validate only if filled
    if (form.phone && !/^\d{7,15}$/.test(form.phone))
      errs.phone = "Phone must be 7–15 digits";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const fullPhone = form.phone ? `${countryCode} ${form.phone}` : undefined;
    onSave({
      ...participant,
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: fullPhone,
      organization: form.organization.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#F9BB1E]">Edit Participant</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          {/* Name — required */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Full Name <span className="text-destructive">*</span></label>
            <Input
              value={form.name}
              onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: "" })); }}
              className={errors.name ? "border-destructive" : ""}
              placeholder="Full Name"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Email — optional */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Email <span className="text-muted-foreground/60 text-[10px]">(optional)</span></label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: "" })); }}
              className={errors.email ? "border-destructive" : ""}
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Phone — optional with country code */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Phone <span className="text-muted-foreground/60 text-[10px]">(optional)</span></label>
            <PhoneInput
              value={form.phone}
              countryCode={countryCode}
              onPhoneChange={(v) => { setForm(f => ({ ...f, phone: v })); setErrors(er => ({ ...er, phone: "" })); }}
              onCountryChange={setCountryCode}
              hasError={!!errors.phone}
              placeholder="Phone number"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          {/* Organization — optional */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Organization <span className="text-muted-foreground/60 text-[10px]">(optional)</span></label>
            <Input
              value={form.organization}
              onChange={(e) => setForm(f => ({ ...f, organization: e.target.value }))}
              placeholder="Organization"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Check className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ParticipantTable = ({ title, event_id, day_number, participants, onUpdate, isTechEvent, isCustomEvent }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", organization: "" });
  const [countryCode, setCountryCode] = useState("+92");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Participant | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load participants ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchParticipants = async () => {
      setIsLoadingData(true);
      try {
        const { data, error } = await supabase
          .from('participants')
          .select('*')
          .eq('event_id', event_id)
          .eq('day_number', day_number)
          .eq('list_name', title)
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (data) onUpdate(data as Participant[]);
      } catch (err: any) {
        console.error("Fetch error:", err.message);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchParticipants();
  }, [event_id, day_number, title]);

  // ── Search ────────────────────────────────────────────────────────────────
  const filteredParticipants = participants.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(term) ||
      (p.email || "").toLowerCase().includes(term)
    );
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  // Name: required
  // Email: optional, but if filled → valid format
  // Phone: optional, but if filled → digits only, 7-15
  // Organization: optional, no validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
    const nameVal = form.name.trim();
    if (!nameVal || nameVal.length < 2)
      errs.name = "Name must be at least 2 characters";
    if (/^\d+$/.test(nameVal))
      errs.name = "Name cannot be only numbers";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email format";
    if (form.phone && !/^\d{7,15}$/.test(form.phone))
      errs.phone = "Phone must be 7–15 digits";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Add Participant ───────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!validateForm()) return;
    setIsAdding(true);
    try {
      const fullPhone = form.phone ? `${countryCode} ${form.phone}` : undefined;
      const insertData: any = {
        event_id,
        day_number,
        list_name: title,
        name: form.name.trim(),
      };
      if (form.email.trim()) insertData.email = form.email.trim();
      if (fullPhone) insertData.phone = fullPhone;
      if (form.organization.trim()) insertData.organization = form.organization.trim();

      const { data, error } = await supabase
        .from('participants')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      onUpdate([...participants, data as Participant]);
      toast.success("Participant added successfully!");
      setForm({ name: "", email: "", phone: "", organization: "" });
      setCountryCode("+92");
      setFormErrors({});
    } catch (err: any) {
      toast.error("Failed to add: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  // ── Edit Save ─────────────────────────────────────────────────────────────
  const handleEditSave = async (updated: Participant) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('participants')
        .update({
          name: updated.name,
          email: updated.email ?? null,
          phone: updated.phone ?? null,
          organization: updated.organization ?? null,
        })
        .eq('id', updated.id);
      if (error) throw error;
      onUpdate(participants.map(p => p.id === updated.id ? updated : p));
      toast.success("Participant updated!");
      setEditTarget(null);
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('participants').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      onUpdate(participants.filter(p => p.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.name}" removed!`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error("Delete failed: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Import ────────────────────────────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        if (rows.length === 0) { toast.error("File is empty"); return; }

        const errors: string[] = [];
        const toInsert: any[] = [];

        rows.forEach((r: any, index: number) => {
          const name = String(r.Name || r.name || r["Full Name"] || "").trim();
          const email = String(r.Email || r.email || "").trim();
          const phone = String(r.Phone || r.phone || "").trim();

          if (!name || name.length < 2 || /^\d+$/.test(name))
            errors.push(`Row ${index + 1}: Invalid Name`);
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push(`Row ${index + 1}: Invalid Email format`);
          if (phone && !/^\d{7,15}$/.test(phone.replace(/\D/g, "")))
            errors.push(`Row ${index + 1}: Invalid Phone`);

          const row: any = { event_id, day_number, list_name: title, name };
          if (email) row.email = email;
          if (phone) row.phone = phone;
          toInsert.push(row);
        });

        if (errors.length > 0) { toast.error(errors[0]); return; }

        const { data, error } = await supabase.from('participants').insert(toInsert).select();
        if (error) throw error;
        onUpdate([...participants, ...(data as Participant[])]);
        toast.success(`${data.length} participants imported!`);
      } catch (err: any) {
        toast.error("Import failed: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (participants.length === 0) { toast.error("No participants to export"); return; }
    const exportData = participants.map(({ id, event_id, day_number, list_name, created_at, ...rest }) => rest);
    const csv = [
      Object.keys(exportData[0]).join(","),
      ...exportData.map(p => Object.values(p).map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title}_participants.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Exported successfully!");
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const staticColumns = ["name", "email", "phone", "organization"];
  const dynamicColumns = Array.from(
    new Set(
      participants.flatMap(p =>
        Object.keys(p).filter(k => !["id", "event_id", "day_number", "list_name", "created_at"].includes(k))
      )
    )
  );
  const displayColumns = dynamicColumns.length > 0
    ? dynamicColumns.filter(c => staticColumns.includes(c)) // keep consistent order
    : staticColumns;

  // Always show these 4 columns as headers (even if empty)
  const tableColumns = staticColumns;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* ── Header ── */}
      <div className="p-4 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          {title}
          <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {participants.length}
          </span>
          {isLoadingData && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-9 w-[200px] lg:w-[240px]"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="relative">
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Import" />
            <Button size="sm" variant="outline" className="gap-2">
              <Upload className="h-4 w-4" /> Import
            </Button>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={handleExport}>
            <FileDown className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* ── Add Form ── */}
      <div className="p-4 border-b border-border bg-muted/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Name — required */}
          <div className="flex flex-col gap-1">
            <Input
              placeholder="Full Name *"
              value={form.name}
              onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(er => ({ ...er, name: "" })); }}
              className={formErrors.name ? "border-destructive" : ""}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
          </div>

          {/* Email — optional */}
          <div className="flex flex-col gap-1">
            <Input
              placeholder="Email (optional)"
              type="email"
              value={form.email}
              onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(er => ({ ...er, email: "" })); }}
              className={formErrors.email ? "border-destructive" : ""}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
          </div>

          {/* Phone — optional with country code */}
          <div className="flex flex-col gap-1">
            <PhoneInput
              value={form.phone}
              countryCode={countryCode}
              onPhoneChange={(v) => { setForm(f => ({ ...f, phone: v })); setFormErrors(er => ({ ...er, phone: "" })); }}
              onCountryChange={setCountryCode}
              hasError={!!formErrors.phone}
              placeholder="Phone (optional)"
            />
            {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
          </div>

          {/* Organization — optional */}
          <div className="flex flex-col gap-1">
            <Input
              placeholder="Organization (optional)"
              value={form.organization}
              onChange={(e) => setForm(f => ({ ...f, organization: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
        </div>

        {/* Add Button */}
        <div className="mt-3 flex justify-end">
          <Button size="sm" className="h-9 gap-2 px-6" onClick={handleAdd} disabled={isAdding}>
            {isAdding
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
              : <><UserPlus className="h-4 w-4" /> Add</>}
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.length > 0 ? (
              filteredParticipants.map((p, i) => (
                <TableRow key={p.id} className="group hover:bg-muted/20">
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>{p.name ?? "-"}</TableCell>
                  <TableCell>{p.email ?? "-"}</TableCell>
                  <TableCell>{p.phone ?? "-"}</TableCell>
                  <TableCell>{p.organization ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditTarget(p)}
                        className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                        title="Edit participant">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(p)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                        title="Delete participant">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                  {isLoadingData ? "Loading participants..." :
                    searchTerm ? `No results for "${searchTerm}"` : `No participants in ${title} yet.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Modals ── */}
      {deleteTarget && (
        <DeleteParticipantModal
          name={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
      {editTarget && (
        <EditParticipantModal
          participant={editTarget}
          onSave={handleEditSave}
          onCancel={() => !isSaving && setEditTarget(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default ParticipantTable;