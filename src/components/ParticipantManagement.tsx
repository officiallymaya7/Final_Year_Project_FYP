import { useState, useEffect } from "react";
import ParticipantTable, { type Participant } from "./ParticipantTable";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Check, X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

interface Props {
  eventType: string;
  eventData?: {
    id: string;
    name: string;
    type: string;
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  } | null;
}

const techCategories = ["Exhibitors", "Judges", "Volunteers", "Visitors"];

// ✅ List Delete Confirmation Modal
const DeleteListModal = ({
  listName,
  onConfirm,
  onCancel,
}: {
  listName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-lg font-bold text-center mb-1">Delete List?</h2>
      <p className="text-sm text-muted-foreground text-center mb-2">
        Are you sure you want to delete:
      </p>
      <p className="text-base font-semibold text-[#F9BB1E] text-center mb-3">
        "{listName}"
      </p>
      <p className="text-xs text-muted-foreground text-center bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 mb-5">
        ⚠️ All participants in this list will also be removed. This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>
    </div>
  </div>
);

const ParticipantManagement = ({ eventType, eventData }: Props) => {
  if (!eventData || !eventData.id) {
    return (
      <div className="p-10 text-center bg-card rounded-xl border border-border mt-10 mx-4">
        <p className="text-[#F9BB1E] italic font-medium animate-pulse">
          ✨ Loading event data...
        </p>
      </div>
    );
  }

  const [isEditingName, setIsEditingName] = useState(false);
  const [currentName, setCurrentName] = useState(eventData.name);

  const handleNameUpdate = async () => {
    if (!currentName.trim()) return;
    try {
      const { error } = await supabase
        .from('events')
        .update({ name: currentName })
        .eq('id', eventData.id);
      if (error) throw error;
      setIsEditingName(false);
      toast.success("Event name updated!");
    } catch (err: any) {
      toast.error("Error updating name");
    }
  };

  const isTech = eventType === "tech" || eventData.type === "tech";
  const [activeDay, setActiveDay] = useState(1);
  const [data, setData] = useState<Record<string, Record<string, Participant[]>>>({});

  // Custom lists per day
  const [customListsPerDay, setCustomListsPerDay] = useState<Record<string, string[]>>({});

  // ✅ List rename state
  const [editingList, setEditingList] = useState<{ dayName: string; oldName: string; newName: string } | null>(null);

  // ✅ List delete confirm state
  const [deleteListTarget, setDeleteListTarget] = useState<{ dayName: string; listName: string } | null>(null);

  const calculateDayNames = () => {
    const startRaw = eventData.startDate || eventData.start_date;
    const endRaw = eventData.endDate || eventData.end_date;
    if (!startRaw || !endRaw) return ["Day 1"];
    const start = new Date(startRaw);
    const end = new Date(endRaw);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const total = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Array.from({ length: total > 0 ? total : 1 }, (_, i) => `Day ${i + 1}`);
  };

  const dayNames = calculateDayNames();
  const currentDayName = dayNames[activeDay - 1] || "Day 1";
  const currentCustomLists = customListsPerDay[currentDayName] || [];

  useEffect(() => {
    const categories = isTech ? techCategories : ["Guest List"];
    const initialData: any = {};
    dayNames.forEach(day => {
      initialData[day] = Object.fromEntries(categories.map((c) => [c, []]));
    });
    setData(initialData);
  }, [isTech, eventData.startDate, eventData.endDate, eventData.start_date, eventData.end_date]);

  const updateCategory = (category: string) => (participants: Participant[]) => {
    setData((prev) => ({
      ...prev,
      [currentDayName]: {
        ...(prev[currentDayName] || {}),
        [category]: participants
      }
    }));
  };

  const handleAddList = () => {
    const name = window.prompt("Enter List Name (e.g. VIPs, Speakers):");
    if (name && name.trim()) {
      const listName = name.trim();
      setCustomListsPerDay((prev) => ({
        ...prev,
        [currentDayName]: [...(prev[currentDayName] || []), listName]
      }));
      setData((prev) => ({
        ...prev,
        [currentDayName]: {
          ...(prev[currentDayName] || {}),
          [listName]: []
        }
      }));
    }
  };

  // ✅ List Rename Handler
  const handleRenameList = (dayName: string, oldName: string) => {
    setEditingList({ dayName, oldName, newName: oldName });
  };

  const confirmRenameList = () => {
    if (!editingList) return;
    const { dayName, oldName, newName } = editingList;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingList(null);
      return;
    }

    // Update customListsPerDay
    setCustomListsPerDay((prev) => ({
      ...prev,
      [dayName]: (prev[dayName] || []).map((l) => (l === oldName ? trimmed : l))
    }));

    // Move data from old key to new key
    setData((prev) => {
      const dayData = { ...(prev[dayName] || {}) };
      dayData[trimmed] = dayData[oldName] || [];
      delete dayData[oldName];
      return { ...prev, [dayName]: dayData };
    });

    toast.success(`List renamed to "${trimmed}"`);
    setEditingList(null);
  };

  // ✅ List Delete Handler
  const confirmDeleteList = () => {
    if (!deleteListTarget) return;
    const { dayName, listName } = deleteListTarget;

    setCustomListsPerDay((prev) => ({
      ...prev,
      [dayName]: (prev[dayName] || []).filter((l) => l !== listName)
    }));

    setData((prev) => {
      const dayData = { ...(prev[dayName] || {}) };
      delete dayData[listName];
      return { ...prev, [dayName]: dayData };
    });

    toast.success(`"${listName}" list deleted`);
    setDeleteListTarget(null);
  };

  return (
    <div className="space-y-6 p-6 bg-card rounded-2xl border border-border shadow-xl animate-in fade-in duration-500">

      {/* Event Title */}
      <div className="mb-2">
        {isEditingName ? (
          <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
            <input
              className="text-3xl font-bold bg-transparent border-b-2 border-primary outline-none text-[#F9BB1E] min-w-[200px]"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleNameUpdate()}
              aria-label="Edit event name"
            />
            <button
              onClick={handleNameUpdate}
              className="p-2 hover:bg-success/20 rounded-full text-success"
              aria-label="Save name"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={() => { setIsEditingName(false); setCurrentName(eventData.name); }}
              className="p-2 hover:bg-destructive/20 rounded-full text-destructive"
              aria-label="Cancel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-[#F9BB1E] flex items-center gap-3 group">
            {currentName}
            <button
              onClick={() => setIsEditingName(true)}
              className="p-1.5 bg-muted/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/20 hover:text-primary"
              title="Edit event name"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <span className="text-sm font-normal text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
              ({eventType})
            </span>
          </h1>
        )}
      </div>

      {/* Day Selection + Add List */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div className="flex flex-wrap gap-2">
          {dayNames.map((name, i) => {
            const venue = eventData?.day_venues?.[i] || eventData?.venue || null;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <Button
                  variant={activeDay === i + 1 ? "default" : "outline"}
                  onClick={() => setActiveDay(i + 1)}
                  className={cn(
                    "transition-all",
                    activeDay === i + 1
                      ? "bg-primary text-primary-foreground shadow-lg scale-105"
                      : "hover:border-primary/50"
                  )}
                >
                  {name}
                </Button>
                {venue && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    📍 {venue}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddList}
          className="gap-2 border-[#F9BB1E]/50 text-[#F9BB1E] hover:bg-[#F9BB1E]/10 font-bold"
        >
          <Plus className="h-4 w-4" /> Add Custom List
        </Button>
      </div>

      {/* Participant Tables */}
      <div className="grid grid-cols-1 gap-6">
        {/* Default categories (no rename/delete for these) */}
        {(isTech ? techCategories : ["Guest List"]).map((cat) => (
          <ParticipantTable
            key={`${currentDayName}-${cat}`}
            title={cat}
            event_id={eventData.id}
            participants={data[currentDayName]?.[cat] || []}
            onUpdate={updateCategory(cat)}
            isTechEvent={isTech}
          />
        ))}

        {/* ✅ Custom lists with Rename + Delete buttons */}
        {currentCustomLists.map((list) => (
          <div key={`${currentDayName}-${list}`} className="relative group/listblock">
            
            {/* ✅ List Action Bar (Rename + Delete) */}
            <div className="flex items-center gap-2 mb-2 px-1">
              {editingList?.dayName === currentDayName && editingList?.oldName === list ? (
                // Inline rename input
                <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                  <input
                    className="text-sm font-semibold bg-transparent border-b border-primary outline-none text-foreground min-w-[150px] px-1"
                    value={editingList.newName}
                    autoFocus
                    title="Enter new list name"
                    placeholder="Enter new name..."
                    onChange={(e) =>
                      setEditingList((prev) => prev ? { ...prev, newName: e.target.value } : null)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRenameList();
                      if (e.key === 'Escape') setEditingList(null);
                    }}
                  />
                  <button
                    onClick={confirmRenameList}
                    className="p-1 rounded hover:bg-success/20 text-success"
                    title="Save"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingList(null)}
                    className="p-1 rounded hover:bg-destructive/20 text-destructive"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                // Action buttons shown on hover
                <div className="flex items-center gap-1 opacity-0 group-hover/listblock:opacity-100 transition-opacity ml-auto">
                  <button
                    onClick={() => handleRenameList(currentDayName, list)}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                    title="Rename list"
                  >
                    <Pencil className="h-3 w-3" /> Rename
                  </button>
                  <button
                    onClick={() => setDeleteListTarget({ dayName: currentDayName, listName: list })}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                    title="Delete list"
                  >
                    <Trash2 className="h-3 w-3" /> Delete List
                  </button>
                </div>
              )}
            </div>

            <ParticipantTable
              title={list}
              event_id={eventData.id}
              participants={data[currentDayName]?.[list] || []}
              onUpdate={updateCategory(list)}
              isCustomEvent={true}
              isTechEvent={isTech}
            />
          </div>
        ))}
      </div>

      {/* ✅ List Delete Modal */}
      {deleteListTarget && (
        <DeleteListModal
          listName={deleteListTarget.listName}
          onConfirm={confirmDeleteList}
          onCancel={() => setDeleteListTarget(null)}
        />
      )}
    </div>
  );
};

export default ParticipantManagement;