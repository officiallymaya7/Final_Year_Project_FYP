import { useState } from "react";
<<<<<<< HEAD
import { Plus, Search, UserPlus, FileDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
=======
import { Plus, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
>>>>>>> 7919ea2a722e03c142fd0417766f07bc28a08ba7

// 1. Participant ki definition
export interface Participant {
  id: string;
<<<<<<< HEAD
  name: string;
  email: string;
  phone?: string;
  status: string;
  category: string;
}

// 2. Props Interface (Yahan event_id add karna zaroori tha)
interface Props {
  title: string;
  event_id: string; // 🔥 Yeh line add ki hai taake ParticipantManagement ka error khatam ho
  participants: Participant[];
  onUpdate: (participants: Participant[]) => void;
  isTechEvent?: boolean;
  isCustomEvent?: boolean;
}

const ParticipantTable = ({ 
  title, 
  event_id, // 🔥 Component mein receive kiya
  participants, 
  onUpdate, 
  isTechEvent,
  isCustomEvent 
}: Props) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Search logic
  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
=======
  [key: string]: any;
}

const ParticipantTable = ({ title, participants, onUpdate }: any) => {

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
  });

  const handleAdd = () => {
    const newP = { id: crypto.randomUUID(), ...form };
    onUpdate([...participants, newP]);
    toast.success("Added successfully");
  };

  // 🔥 IMPORT WITH VALIDATION (FIXED)
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const errors: string[] = [];

        const imported = rows.map((r: any, index: number) => {
          const name = r.Name || r.name || r["Full Name"] || "";
          const email = r.Email || r.email || "";
          const phone = r.Phone || r.phone || "";

          // ✅ VALIDATIONS (NOT REMOVED, ONLY ADDED BACK)
          if (!name || name.length < 3) {
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
            ...r,
          };
        });

        // ❌ STOP IMPORT IF ERROR
        if (errors.length > 0) {
          toast.error(errors[0]);
          return;
        }

        onUpdate([...participants, ...imported]);
        toast.success("Imported successfully");
      } catch {
        toast.error("Import failed");
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleExport = () => {
    const csv = [
      Object.keys(participants[0] || {}).join(","),
      ...participants.map((p: any) => Object.values(p).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.csv`;
    a.click();

    toast.success("Exported");
  };
>>>>>>> 7919ea2a722e03c142fd0417766f07bc28a08ba7

  // ✅ UNIQUE COLUMNS (UNCHANGED)
  const columns = Array.from(
    new Set(
      participants.flatMap((p: any) =>
        Object.keys(p).filter((k) => k !== "id")
      )
    )
  );

  return (
<<<<<<< HEAD
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            {title}
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {participants.length}
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-9 w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
=======
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">{title}</h2>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImport}
              className="absolute inset-0 opacity-0"
            />
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-1" /> Import File
            </Button>
>>>>>>> 7919ea2a722e03c142fd0417766f07bc28a08ba7
          </div>
          <Button size="sm" variant="outline" className="gap-2 border-primary/20 text-primary">
            <UserPlus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

<<<<<<< HEAD
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              {isTechEvent && <th className="px-4 py-3">Phone</th>}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredParticipants.length > 0 ? (
              filteredParticipants.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  {isTechEvent && <td className="px-4 py-3">{p.phone || "-"}</td>}
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                  No participants added to {title} yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
=======
      {/* TABLE */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>

              {columns.map((col) => (
                <TableHead key={col}>
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {participants.map((p: any, i: number) => (
              <TableRow key={p.id}>
                <TableCell>{i + 1}</TableCell>

                {columns.map((col) => (
                  <TableCell key={col}>
                    {p[col]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
>>>>>>> 7919ea2a722e03c142fd0417766f07bc28a08ba7
      </div>
    </div>
  );
};

export default ParticipantTable;