import { useState } from "react";
import { Plus, Search, UserPlus, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

// 1. Participant ki definition
export interface Participant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  category?: string;
  [key: string]: any; // For dynamic columns from import
}

// 2. Props Interface
interface Props {
  title: string;
  event_id: string; 
  participants: Participant[];
  onUpdate: (participants: Participant[]) => void;
  isTechEvent?: boolean;
  isCustomEvent?: boolean;
}

const ParticipantTable = ({ 
  title, 
  event_id, 
  participants, 
  onUpdate, 
  isTechEvent,
  isCustomEvent 
}: Props) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Search logic
  const filteredParticipants = participants.filter(p => 
    (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (p.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Dynamic columns for the table (excluding 'id')
  const columns = Array.from(
    new Set(
      participants.flatMap((p) =>
        Object.keys(p).filter((k) => k !== "id")
      )
    )
  );

  // --- IMPORT LOGIC ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const errors: string[] = [];
        const imported = data.map((r, index) => {
          const name = r.Name || r.name || r["Full Name"] || "";
          const email = r.Email || r.email || "";
          const phone = r.Phone || r.phone || "";

          if (!name || name.length < 3) errors.push(`Row ${index + 1}: Invalid Name`);
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(`Row ${index + 1}: Invalid Email`);

          return {
            id: crypto.randomUUID(),
            ...r,
          };
        });

        if (errors.length > 0) {
          toast.error(errors[0]);
          return;
        }

        onUpdate([...participants, ...imported]);
        toast.success("Imported successfully");
      } catch (err) {
        toast.error("Import failed");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    if (participants.length === 0) {
      toast.error("No data to export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(participants);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants");
    XLSX.writeFile(wb, `${title}.xlsx`);
    toast.success("Exported successfully");
  };

  return (
    <div className="space-y-4 bg-card p-4 rounded-xl border border-border">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              className="pl-9 h-9 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
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

          <Button size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              {columns.length > 0 ? (
                columns.map((col) => (
                  <TableHead key={col} className="capitalize">
                    {col.replace(/_/g, ' ')}
                  </TableHead>
                ))
              ) : (
                <>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.length > 0 ? (
              filteredParticipants.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell>{i + 1}</TableCell>
                  {columns.map((col) => (
                    <TableCell key={col}>{p[col] || "-"}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                  No participants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ParticipantTable;