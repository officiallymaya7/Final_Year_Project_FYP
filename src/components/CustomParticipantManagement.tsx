import { useState } from "react";
import { Plus, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ParticipantTable, { type Participant } from "@/components/ParticipantTable";

const CustomParticipantManagement = () => {
  const [lists, setLists] = useState<{ name: string; participants: Participant[] }[]>([
    { name: "Guest List", participants: [] },
  ]);
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState("");

  const handleAddList = () => {
    if (!newListName.trim()) return;
    if (lists.some((l) => l.name.toLowerCase() === newListName.trim().toLowerCase())) {
      toast.error("A list with this name already exists");
      return;
    }
    setLists((prev) => [...prev, { name: newListName.trim(), participants: [] }]);
    setNewListName("");
    setShowAddList(false);
    toast.success(`"${newListName.trim()}" list created`);
  };

  const updateList = (index: number) => (participants: Participant[]) => {
    setLists((prev) => prev.map((l, i) => (i === index ? { ...l, participants } : l)));
  };

  const handleConnectDesigning = (listName: string) => {
    toast.info(`Connecting "${listName}" to the Designing Portal...`);
  };

  const handleRemoveList = (index: number) => {
    const name = lists[index].name;
    if (name === "Guest List") {
      toast.error("Cannot remove the default Guest List");
      return;
    }
    setLists((prev) => prev.filter((_, i) => i !== index));
    toast.success(`"${name}" list removed`);
  };

  return (
    <div className="space-y-6">
      {/* Add New List */}
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => setShowAddList(true)} className="gap-1.5 bg-primary hover:bg-primary/90">
          <Plus className="w-3.5 h-3.5" /> Add Custom List
        </Button>
      </div>

      {/* Lists */}
      {lists.map((list, i) => (
        <div key={list.name} className="space-y-2">
          <ParticipantTable
            title={list.name}
            participants={list.participants}
            onUpdate={updateList(i)}
            isTechEvent={false}
            isCustomEvent={true}
          />
          <div className="flex gap-2 pl-1">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
              onClick={() => handleConnectDesigning(list.name)}
            >
              <Palette className="w-3.5 h-3.5" /> Connect to Designing Portal
            </Button>
            {list.name !== "Guest List" && (
              <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => handleRemoveList(i)}>
                Remove List
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Add List Dialog */}
      <Dialog open={showAddList} onOpenChange={setShowAddList}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create Custom List</DialogTitle>
          </DialogHeader>
          <div>
            <Label>List Name</Label>
            <Input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="e.g. VIP Guests, Speakers, Sponsors" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddList(false)}>Cancel</Button>
            <Button onClick={handleAddList} className="bg-primary hover:bg-primary/90">Create List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomParticipantManagement;
