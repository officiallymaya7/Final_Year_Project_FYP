import { useState } from "react";
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

export interface Participant {
  id: string;
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

  // ✅ UNIQUE COLUMNS (UNCHANGED)
  const columns = Array.from(
    new Set(
      participants.flatMap((p: any) =>
        Object.keys(p).filter((k) => k !== "id")
      )
    )
  );

  return (
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
          </div>

          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

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
      </div>
    </div>
  );
};

export default ParticipantTable;