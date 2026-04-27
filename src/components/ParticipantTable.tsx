import { useState } from "react";
import { Plus, Pencil, Download, Upload, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  participants,
  onUpdate,
  editableTitle,
}: Props) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editValue, setEditValue] = useState(title);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
  });

  const resetForm = () => setForm({ name: "", email: "", phone: "", organization: "" });

  const handleAdd = () => {
    const newP: Participant = { id: crypto.randomUUID(), ...form };
    onUpdate([...participants, newP]);
    resetForm();
    setShowAdd(false);
    toast.success(`${form.name} added to ${title}`);
  };

  const handleDelete = (id: string) => {
    onUpdate(participants.filter((p) => p.id !== id));
    toast.success("Participant removed");
  };

  // ✅ IMPORT WITH VALIDATION
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
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          {editableTitle && isEditingTitle ? (
            <input
              className="bg-transparent border-b border-primary text-xl font-bold outline-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                onTitleChange?.(editValue);
                setIsEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onTitleChange?.(editValue);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => editableTitle && setIsEditingTitle(true)}
            >
              <h2 className="text-xl font-bold">{title}</h2>
              {editableTitle && (
                <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
              )}
            </div>
          )}
          <Badge variant="secondary">{participants.length}</Badge>
        </div>

        {/* BUTTONS */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-1" /> Import
            </Button>
          </div>

          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
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
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell>{p.phone}</TableCell>
                <TableCell>{p.organization}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ParticipantTable;