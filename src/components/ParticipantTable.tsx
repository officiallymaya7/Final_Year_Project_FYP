import { useState, useEffect } from "react";
import { Search, UserPlus, FileDown, Upload, Pencil, Trash2, AlertTriangle, X, Check, Loader2 } from "lucide-react";
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
  email: string;
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
  participant, isTechEvent, isCustomEvent, onSave, onCancel, isSaving,
}: {
  participant: Participant; isTechEvent?: boolean; isCustomEvent?: boolean;
  onSave: (updated: Participant) => void; onCancel: () => void; isSaving: boolean;
}) => {
  const [form, setForm] = useState({ name: participant.name || "", email: participant.email || "", phone: participant.phone || "", organization: participant.organization || "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    const nameVal = form.name.trim();
    if (!nameVal || nameVal.length < 3) errs.name = "Name must be at least 3 characters";
    if (/^\d+$/.test(nameVal)) errs.name = "Name cannot be only numbers";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email is required";
    if (isTechEvent && !/^\d{11}$/.test(form.phone)) errs.phone = "Phone must be exactly 11 digits";
    if (form.phone && !/^\d+$/.test(form.phone)) errs.phone = "Phone must contain only numbers";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...participant, name: form.name.trim(), email: form.email.trim(), phone: form.phone || undefined, organization: form.organization.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#F9BB1E]">Edit Participant</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"  title="Close"
          
          >
            <X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
            <Input value={form.name} onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: "" })); }}
              className={errors.name ? "border-destructive" : ""} placeholder="Full Name" />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Email *</label>
            <Input type="email" value={form.email} onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: "" })); }}
              className={errors.email ? "border-destructive" : ""} placeholder="Email" />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          {/* Phone (tech only) */}
          {isTechEvent && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Phone * (11 digits)</label>
              <Input value={form.phone} onChange={(e) => { setForm(f => ({ ...f, phone: e.target.value })); setErrors(er => ({ ...er, phone: "" })); }}
                className={errors.phone ? "border-destructive" : ""} placeholder="03001234567" maxLength={11} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
          )}
          {/* Organization (custom) */}
          {isCustomEvent && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Organization</label>
              <Input value={form.organization} onChange={(e) => setForm(f => ({ ...f, organization: e.target.value }))} placeholder="Organization (optional)" />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50">Cancel</button>
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit state
  const [editTarget, setEditTarget] = useState<Participant | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load participants from Supabase on mount ──────────────────────────────
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
    const name = (p.name || "").toLowerCase();
    const email = (p.email || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errs: Record<string, string> = {};
    const nameVal = form.name.trim();

    if (!nameVal || nameVal.length < 3)
      errs.name = "Name must be at least 3 characters";
    if (/^\d+$/.test(nameVal))
      errs.name = "Name cannot be only numbers";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Valid email is required";
    if (isTechEvent) {
      if (!/^\d{11}$/.test(form.phone))
        errs.phone = "Phone must be exactly 11 digits";
    }
    if (form.phone && !/^\d+$/.test(form.phone))
      errs.phone = "Phone must contain only numbers";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Add Participant → Supabase INSERT ─────────────────────────────────────
  const handleAdd = async () => {
    if (!validateForm()) return;
    setIsAdding(true);
    try {
      const insertData: any = {
        event_id,
        day_number,
        list_name: title,
        name: form.name.trim(),
        email: form.email.trim(),
      };
      if (form.phone) insertData.phone = form.phone;
      if (form.organization) insertData.organization = form.organization.trim();

      const { data, error } = await supabase
        .from('participants')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      onUpdate([...participants, data as Participant]);
      toast.success("Participant added successfully!");
      setForm({ name: "", email: "", phone: "", organization: "" });
      setFormErrors({});
    } catch (err: any) {
      toast.error("Failed to add: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  // ── Edit Participant → Supabase UPDATE ────────────────────────────────────
  const handleEditSave = async (updated: Participant) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('participants')
        .update({
          name: updated.name,
          email: updated.email,
          ...(updated.phone !== undefined && { phone: updated.phone }),
          ...(updated.organization !== undefined && { organization: updated.organization }),
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

  // ── Delete Participant → Supabase DELETE ──────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', deleteTarget.id);

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
          const phone = String(r.Phone || r.phone || "");

          if (!name || name.length < 3 || /^\d+$/.test(name))
            errors.push(`Row ${index + 1}: Invalid Name`);
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push(`Row ${index + 1}: Invalid Email`);
          if (phone && !/^\d{11}$/.test(phone))
            errors.push(`Row ${index + 1}: Invalid Phone (must be 11 digits)`);

          toInsert.push({ event_id, day_number, list_name: title, name, email, ...(phone && { phone }) });
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
  const defaultColumns = isCustomEvent
    ? ["name", "email", "organization"]
    : isTechEvent
    ? ["name", "email", "phone", "organization"]
    : ["name", "email"];

  const dynamicColumns = Array.from(
    new Set(participants.flatMap(p => Object.keys(p).filter(k => !["id", "event_id", "day_number", "list_name", "created_at"].includes(k))))
  );
  const displayColumns = dynamicColumns.length > 0 ? dynamicColumns : defaultColumns;

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
      <div className="p-4 border-b border-border bg-muted/10 grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <Input placeholder="Full Name *" value={form.name}
            onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(er => ({ ...er, name: "" })); }}
            className={formErrors.name ? "border-destructive" : ""}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
        </div>
        {/* Email */}
        <div className="flex flex-col gap-1">
          <Input placeholder="Email *" type="email" value={form.email}
            onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(er => ({ ...er, email: "" })); }}
            className={formErrors.email ? "border-destructive" : ""}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
        </div>
        {/* Phone / Organization */}
        {(isTechEvent || isCustomEvent) && (
          <div className="flex flex-col gap-1">
            <Input
              placeholder={isTechEvent ? "Phone (11 digits) *" : "Organization"}
              value={isTechEvent ? form.phone : form.organization}
              maxLength={isTechEvent ? 11 : undefined}
              onChange={(e) => {
                const field = isTechEvent ? "phone" : "organization";
                setForm(f => ({ ...f, [field]: e.target.value }));
                setFormErrors(er => ({ ...er, [field]: "" }));
              }}
              className={(isTechEvent ? formErrors.phone : formErrors.organization) ? "border-destructive" : ""}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            {isTechEvent && formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
          </div>
        )}
        {/* Add Button */}
        <Button size="sm" className="h-10 gap-2 self-start" onClick={handleAdd} disabled={isAdding}>
          {isAdding ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : <><UserPlus className="h-4 w-4" /> Add</>}
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              {displayColumns.map(col => (
                <TableHead key={col}>{col.charAt(0).toUpperCase() + col.slice(1)}</TableHead>
              ))}
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.length > 0 ? (
              filteredParticipants.map((p, i) => (
                <TableRow key={p.id} className="group hover:bg-muted/20">
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  {displayColumns.map(col => (
                    <TableCell key={col}>{p[col] ?? "-"}</TableCell>
                  ))}
                  {/* Edit + Delete */}
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
                <TableCell colSpan={displayColumns.length + 2}
                  className="text-center py-8 text-muted-foreground italic">
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
          isTechEvent={isTechEvent}
          isCustomEvent={isCustomEvent}
          onSave={handleEditSave}
          onCancel={() => !isSaving && setEditTarget(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default ParticipantTable;