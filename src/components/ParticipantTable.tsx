import { useState } from "react";
import { Plus, Search, UserPlus, FileDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

// 1. Participant ki definition
export interface Participant {
  id: string;
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

  return (
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
          </div>
          <Button size="sm" variant="outline" className="gap-2 border-primary/20 text-primary">
            <UserPlus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

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
      </div>
    </div>
  );
};

export default ParticipantTable;