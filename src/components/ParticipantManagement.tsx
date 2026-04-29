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

// ─── List Delete Modal ────────────────────────────────────────────────────────
const DeleteListModal = ({ listName, onConfirm, onCancel, isDeleting }: {
  listName: string; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-lg font-bold text-center mb-1">Delete List?</h2>
      <p className="text-sm text-muted-foreground text-center mb-2">Deleting list:</p>
      <p className="text-base font-semibold text-[#F9BB1E] text-center mb-3">"{listName}"</p>
      <p className="text-xs text-muted-foreground text-center bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 mb-5">
        ⚠️ All participants in this list will be permanently deleted from the database.
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

// ─── Add List Modal ───────────────────────────────────────────────────────────
const AddListModal = ({ onConfirm, onCancel, isAdding }: {
  onConfirm: (name: string) => void; onCancel: () => void; isAdding: boolean;
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || name.trim().length < 2) { setError("List name must be at least 2 characters"); return; }
    onConfirm(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#F9BB1E]">Add Custom List</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
  title="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-col gap-1 mb-4">
          <input
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-border outline-none focus:border-primary text-sm"
            placeholder="e.g. VIPs, Speakers, Media..."
            value={name}
            autoFocus
            onChange={(e) => { setName(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={isAdding}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {isAdding ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : <><Plus className="h-4 w-4" /> Add List</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ParticipantManagement = ({ eventType, eventData }: Props) => {
  if (!eventData || !eventData.id) {
    return (
      <div className="p-10 text-center bg-card rounded-xl border border-border mt-10 mx-4">
        <p className="text-[#F9BB1E] italic font-medium animate-pulse">✨ Loading event data...</p>
      </div>
    );
  }

  const isTech = eventType === "tech" || eventData.type === "tech";
  const [activeDay, setActiveDay] = useState(1);
  const [data, setData] = useState<Record<string, Record<string, Participant[]>>>({});

  // Event name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [currentName, setCurrentName] = useState(eventData.name);

  // Custom lists per day — loaded from Supabase (event_days table)
  const [customListsPerDay, setCustomListsPerDay] = useState<Record<string, string[]>>({});
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  // Modals
  const [showAddList, setShowAddList] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [editingList, setEditingList] = useState<{ dayName: string; oldName: string; newName: string } | null>(null);
  const [deleteListTarget, setDeleteListTarget] = useState<{ dayName: string; listName: string; dayId: string } | null>(null);
  const [isDeletingList, setIsDeletingList] = useState(false);

  // ── Calculate days ────────────────────────────────────────────────────────
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

  // ── Load custom lists from event_days ─────────────────────────────────────
  useEffect(() => {
    const loadCustomLists = async () => {
      setIsLoadingLists(true);
      try {
        const { data: dayRows, error } = await supabase
          .from('event_days')
          .select('*')
          .eq('event_id', eventData.id)
          .order('day_number', { ascending: true });

        if (error) throw error;

        if (dayRows && dayRows.length > 0) {
          const listsMap: Record<string, string[]> = {};
          dayRows.forEach((row: any) => {
            const dName = `Day ${row.day_number}`;
            if (row.custom_lists && Array.isArray(row.custom_lists)) {
              listsMap[dName] = row.custom_lists;
            }
          });
          setCustomListsPerDay(listsMap);
        }
      } catch (err: any) {
        console.error("Load lists error:", err.message);
      } finally {
        setIsLoadingLists(false);
      }
    };
    loadCustomLists();
  }, [eventData.id]);

  // ── Init data state ───────────────────────────────────────────────────────
  useEffect(() => {
    const categories = isTech ? techCategories : ["Guest List"];
    const initialData: any = {};
    dayNames.forEach(day => {
      initialData[day] = Object.fromEntries(categories.map(c => [c, []]));
    });
    setData(initialData);
  }, [isTech, eventData.startDate, eventData.endDate, eventData.start_date, eventData.end_date]);

  const updateCategory = (category: string) => (participants: Participant[]) => {
    setData(prev => ({
      ...prev,
      [currentDayName]: { ...(prev[currentDayName] || {}), [category]: participants }
    }));
  };

  // ── Event name update ─────────────────────────────────────────────────────
  const handleNameUpdate = async () => {
    if (!currentName.trim()) return;
    try {
      const { error } = await supabase.from('events').update({ name: currentName }).eq('id', eventData.id);
      if (error) throw error;
      setIsEditingName(false);
      toast.success("Event name updated!");
    } catch {
      toast.error("Error updating name");
    }
  };

  // ── Save custom lists to event_days ───────────────────────────────────────
  const saveListsToDb = async (dayName: string, lists: string[]) => {
    const dayNum = parseInt(dayName.replace("Day ", ""));
    try {
      // Check if row exists
      const { data: existing } = await supabase
        .from('event_days')
        .select('id')
        .eq('event_id', eventData.id)
        .eq('day_number', dayNum)
        .single();

      if (existing) {
        await supabase.from('event_days').update({ custom_lists: lists }).eq('id', existing.id);
      } else {
        await supabase.from('event_days').insert([{
          event_id: eventData.id,
          day_number: dayNum,
          day_name: dayName,
          custom_lists: lists
        }]);
      }
    } catch (err: any) {
      console.error("Save lists error:", err.message);
    }
  };

  // ── Add Custom List ───────────────────────────────────────────────────────
  const handleAddList = async (listName: string) => {
    setIsAddingList(true);
    try {
      const updated = [...(customListsPerDay[currentDayName] || []), listName];
      await saveListsToDb(currentDayName, updated);

      setCustomListsPerDay(prev => ({ ...prev, [currentDayName]: updated }));
      setData(prev => ({
        ...prev,
        [currentDayName]: { ...(prev[currentDayName] || {}), [listName]: [] }
      }));
      toast.success(`"${listName}" list created!`);
      setShowAddList(false);
    } catch {
      toast.error("Failed to create list");
    } finally {
      setIsAddingList(false);
    }
  };

  // ── Rename List ───────────────────────────────────────────────────────────
  const confirmRenameList = async () => {
    if (!editingList) return;
    const { dayName, oldName, newName } = editingList;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) { setEditingList(null); return; }

    const updated = (customListsPerDay[dayName] || []).map(l => l === oldName ? trimmed : l);
    await saveListsToDb(dayName, updated);

    setCustomListsPerDay(prev => ({ ...prev, [dayName]: updated }));
    setData(prev => {
      const dayData = { ...(prev[dayName] || {}) };
      dayData[trimmed] = dayData[oldName] || [];
      delete dayData[oldName];
      return { ...prev, [dayName]: dayData };
    });

    // Also update participants list_name in DB
    await supabase.from('participants')
      .update({ list_name: trimmed })
      .eq('event_id', eventData.id)
      .eq('list_name', oldName)
      .eq('day_number', parseInt(dayName.replace("Day ", "")));

    toast.success(`List renamed to "${trimmed}"`);
    setEditingList(null);
  };

  // ── Delete List ───────────────────────────────────────────────────────────
  const confirmDeleteList = async () => {
    if (!deleteListTarget) return;
    setIsDeletingList(true);
    const { dayName, listName } = deleteListTarget;
    const dayNum = parseInt(dayName.replace("Day ", ""));

    try {
      // Delete participants of this list from DB
      await supabase.from('participants')
        .delete()
        .eq('event_id', eventData.id)
        .eq('list_name', listName)
        .eq('day_number', dayNum);

      const updated = (customListsPerDay[dayName] || []).filter(l => l !== listName);
      await saveListsToDb(dayName, updated);

      setCustomListsPerDay(prev => ({ ...prev, [dayName]: updated }));
      setData(prev => {
        const dayData = { ...(prev[dayName] || {}) };
        delete dayData[listName];
        return { ...prev, [dayName]: dayData };
      });

      toast.success(`"${listName}" deleted!`);
      setDeleteListTarget(null);
    } catch (err: any) {
      toast.error("Delete failed: " + err.message);
    } finally {
      setIsDeletingList(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-card rounded-2xl border border-border shadow-xl animate-in fade-in duration-500">

      {/* ── Event Title ── */}
      <div className="mb-2">
        {isEditingName ? (
          <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
            <input
              className="text-3xl font-bold bg-transparent border-b-2 border-primary outline-none text-[#F9BB1E] min-w-[200px]"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              autoFocus
              title="Enter event name"
              placeholder="Enter event name..."
              onKeyDown={(e) => e.key === 'Enter' && handleNameUpdate()}
            />
            <button onClick={handleNameUpdate} className="p-2 hover:bg-success/20 rounded-full text-success"
              title="Save name"
            >
              <Check className="h-5 w-5" />
            </button>
            <button onClick={() => { setIsEditingName(false); setCurrentName(eventData.name); }}
              className="p-2 hover:bg-destructive/20 rounded-full text-destructive"
              title="Cancel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-[#F9BB1E] flex items-center gap-3 group">
            {currentName}
            <button onClick={() => setIsEditingName(true)}
              className="p-1.5 bg-muted/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/20 hover:text-primary"
              title="Edit event name">
              <Pencil className="h-4 w-4" />
            </button>
            <span className="text-sm font-normal text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
              ({eventType})
            </span>
          </h1>
        )}
      </div>

      {/* ── Day Selection + Add List ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div className="flex flex-wrap gap-2">
          {dayNames.map((name, i) => {
            const venue = eventData?.day_venues?.[i] || eventData?.venue || null;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <Button
                  variant={activeDay === i + 1 ? "default" : "outline"}
                  onClick={() => setActiveDay(i + 1)}
                  className={cn("transition-all", activeDay === i + 1
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "hover:border-primary/50")}>
                  {name}
                </Button>
                {venue && <span className="text-[10px] text-muted-foreground flex items-center gap-1">📍 {venue}</span>}
              </div>
            );
          })}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddList(true)}
          className="gap-2 border-[#F9BB1E]/50 text-[#F9BB1E] hover:bg-[#F9BB1E]/10 font-bold">
          <Plus className="h-4 w-4" />
          {isLoadingLists ? "Loading..." : "Add Custom List"}
        </Button>
      </div>

      {/* ── Tables ── */}
      <div className="grid grid-cols-1 gap-6">
        {/* Default categories */}
        {(isTech ? techCategories : ["Guest List"]).map((cat) => (
          <ParticipantTable
            key={`${currentDayName}-${cat}`}
            title={cat}
            event_id={eventData.id}
            day_number={activeDay}
            participants={data[currentDayName]?.[cat] || []}
            onUpdate={updateCategory(cat)}
            isTechEvent={isTech}
          />
        ))}

        {/* Custom lists */}
        {currentCustomLists.map((list) => (
          <div key={`${currentDayName}-${list}`} className="relative group/listblock">
            {/* Action bar */}
            <div className="flex items-center gap-2 mb-2 px-1 min-h-[28px]">
              {editingList?.dayName === currentDayName && editingList?.oldName === list ? (
                <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                  <input
                    className="text-sm font-semibold bg-transparent border-b border-primary outline-none text-foreground min-w-[150px] px-1"
                    value={editingList.newName}
                    autoFocus
                    placeholder="New list name..."
                    onChange={(e) => setEditingList(prev => prev ? { ...prev, newName: e.target.value } : null)}
                    onKeyDown={(e) => { if (e.key === 'Enter') confirmRenameList(); if (e.key === 'Escape') setEditingList(null); }}
                  />
                  <button onClick={confirmRenameList} className="p-1 rounded hover:bg-success/20 text-success" title="Save">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingList(null)} className="p-1 rounded hover:bg-destructive/20 text-destructive" title="Cancel">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 opacity-0 group-hover/listblock:opacity-100 transition-opacity ml-auto">
                  <button
                    onClick={() => setEditingList({ dayName: currentDayName, oldName: list, newName: list })}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors">
                    <Pencil className="h-3 w-3" /> Rename
                  </button>
                  <button
                    onClick={() => setDeleteListTarget({ dayName: currentDayName, listName: list, dayId: "" })}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
                    <Trash2 className="h-3 w-3" /> Delete List
                  </button>
                </div>
              )}
            </div>

            <ParticipantTable
              title={list}
              event_id={eventData.id}
              day_number={activeDay}
              participants={data[currentDayName]?.[list] || []}
              onUpdate={updateCategory(list)}
              isCustomEvent={true}
              isTechEvent={isTech}
            />
          </div>
        ))}
      </div>

      {/* ── Modals ── */}
      {showAddList && (
        <AddListModal
          onConfirm={handleAddList}
          onCancel={() => setShowAddList(false)}
          isAdding={isAddingList}
        />
      )}

      {deleteListTarget && (
        <DeleteListModal
          listName={deleteListTarget.listName}
          onConfirm={confirmDeleteList}
          onCancel={() => !isDeletingList && setDeleteListTarget(null)}
          isDeleting={isDeletingList}
        />
      )}
    </div>
  );
};

export default ParticipantManagement;