import { useState } from "react";
import {
  Plus, Pencil, Trash2, Award, BadgeCheck, Mail, Send, Download, Upload, Users,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
}

interface Props {
  title: string;
  participants: Participant[];
  onUpdate: (participants: Participant[]) => void;
  isTechEvent: boolean;
  isCustomEvent?: boolean;
}

const ParticipantTable = ({ title, participants, onUpdate, isTechEvent, isCustomEvent }: Props) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", organization: "" });

  const resetForm = () => setForm({ name: "", email: "", phone: "", organization: "" });

  const handleAdd = () => {
    const newP: Participant = { id: crypto.randomUUID(), ...form };
    onUpdate([...participants, newP]);
    resetForm();
    setShowAdd(false);
    toast.success(`${form.name} added to ${title}`);
  };

  const handleEdit = () => {
    onUpdate(participants.map((p) => (p.id === editId ? { ...p, ...form } : p)));
    resetForm();
    setEditId(null);
    toast.success("Participant updated");
  };

  const handleDelete = (id: string) => {
    onUpdate(participants.filter((p) => p.id !== id));
    toast.success("Participant removed");
  };

  const startEdit = (p: Participant) => {
    setForm({ name: p.name, email: p.email, phone: p.phone, organization: p.organization });
    setEditId(p.id);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
        const imported: Participant[] = rows.map((r) => ({
          id: crypto.randomUUID(),
          name: r.Name || r.name || "",
          email: r.Email || r.email || "",
          phone: r.Phone || r.phone || "",
          organization: r.Organization || r.organization || "",
        }));
        onUpdate([...participants, ...imported]);
        toast.success(`${imported.length} participants imported`);
      } catch {
        toast.error("Failed to parse Excel file");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleExport = () => {
    const csv = ["Name,Email,Phone,Organization", ...participants.map((p) => `${p.name},${p.email},${p.phone},${p.organization}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const formDialog = (
    <Dialog open={showAdd || !!editId} onOpenChange={() => { setShowAdd(false); setEditId(null); resetForm(); }}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit" : "Add"} {title.replace(/s$/, "")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Organization</Label><Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowAdd(false); setEditId(null); resetForm(); }}>Cancel</Button>
          <Button onClick={editId ? handleEdit : handleAdd} className="bg-primary hover:bg-primary/90">
            {editId ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{title}</h3>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            {participants.length}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1 bg-primary hover:bg-primary/90">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
          <Button size="sm" variant="outline" className="gap-1" asChild>
            <label className="cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Import Excel
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            </label>
          </Button>
          {isTechEvent && !isCustomEvent && (
            <>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info("Select a certificate template")}>
                <Award className="w-3.5 h-3.5" /> Certificates
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info("Select a badge template")}>
                <BadgeCheck className="w-3.5 h-3.5" /> ID Badges
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info("Email templates opened")}>
                <Mail className="w-3.5 h-3.5" /> Bulk Email
              </Button>
            </>
          )}
          {!isTechEvent && !isCustomEvent && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info("Invitation card templates opened")}>
              <Send className="w-3.5 h-3.5" /> Invitations
            </Button>
          )}
          {!isCustomEvent && (
            <Button size="sm" variant="outline" className="gap-1" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {participants.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Phone</TableHead>
              <TableHead className="text-muted-foreground">Organization</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((p, i) => (
              <TableRow key={p.id} className="border-border hover:bg-muted/30">
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.email}</TableCell>
                <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                <TableCell className="text-muted-foreground">{p.organization}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(p)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No {title.toLowerCase()} yet. Click "Add" to get started.</p>
        </div>
      )}

      {formDialog}
    </div>
  );
};

export default ParticipantTable;
