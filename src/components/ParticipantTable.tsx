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
  onTitleChange?: (newTitle: string) => void;
  editableTitle?: boolean;
  participants: Participant[];
  onUpdate: (participants: Participant[]) => void;
  isTechEvent: boolean;
  isCustomEvent?: boolean;
}

const ParticipantTable = ({
  title,
  onTitleChange,
  editableTitle,
  participants,
  onUpdate,
  isTechEvent,
  isCustomEvent,
}: Props) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
  });

  const resetForm = () =>
    setForm({ name: "", email: "", phone: "", organization: "" });

  const handleAdd = () => {
    const newP: Participant = { id: crypto.randomUUID(), ...form };
    onUpdate([...participants, newP]);
    resetForm();
    setShowAdd(false);
    toast.success(`${form.name} added to ${title}`);
  };

  const handleEdit = () => {
    onUpdate(
      participants.map((p) =>
        p.id === editId ? { ...p, ...form } : p
      )
    );
    resetForm();
    setEditId(null);
    toast.success("Participant updated");
  };

  const handleDelete = (id: string) => {
    onUpdate(participants.filter((p) => p.id !== id));
    toast.success("Participant removed");
  };

  const startEdit = (p: Participant) => {
    setForm({
      name: p.name,
      email: p.email,
      phone: p.phone,
      organization: p.organization,
    });
    setEditId(p.id);
  };

  // ✅ ONLY FIXED PART (IMPORT EXCEL + VALIDATION)
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

        const errors: string[] = [];

        const imported: Participant[] = rows.map((r, index) => {
          const name = r.Name || r.name || "";
          const email = r.Email || r.email || "";
          const phone = r.Phone || r.phone || "";
          const organization = r.Organization || r.organization || "";

          // validation only
          if (!/^[A-Za-z\s]{3,}$/.test(name)) {
            errors.push(`Row ${index + 1}: Invalid Name`);
          }

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push(`Row ${index + 1}: Invalid Email`);
          }

          if (!/^\d{11}$/.test(phone)) {
            errors.push(`Row ${index + 1}: Invalid Phone`);
          }

          return {
            id: crypto.randomUUID(),
            name,
            email,
            phone,
            organization,
          };
        });

        if (errors.length > 0) {
          toast.error(errors[0]);
          return;
        }

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
    const csv = [
      "Name,Email,Phone,Organization",
      ...participants.map(
        (p) => `${p.name},${p.email},${p.phone},${p.organization}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />

          {isEditingTitle ? (
            <input
              className="bg-transparent border-b border-primary font-semibold"
              value={title}
              onChange={(e) => onTitleChange?.(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              autoFocus
            />
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setIsEditingTitle(true)}
            >
              <h3 className="font-semibold">{title}</h3>
              <Pencil size={14} />
            </div>
          )}

          <Badge>{participants.length}</Badge>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>

          <label className="cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
          </label>

          <Button size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Organization</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {participants.map((p, i) => (
            <TableRow key={p.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.email}</TableCell>
              <TableCell>{p.phone}</TableCell>
              <TableCell>{p.organization}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ParticipantTable;