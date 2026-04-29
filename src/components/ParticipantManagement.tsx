import { useState, useEffect } from "react";
import ParticipantTable, { type Participant } from "./ParticipantTable";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Check, X } from "lucide-react";
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
  const [customLists, setCustomLists] = useState<string[]>([]);

  const calculateDayNames = () => {
    if (!eventData.startDate || !eventData.endDate) return ["Day 1"];
    const start = new Date(eventData.startDate);
    const end = new Date(eventData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const total = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Array.from({ length: total > 0 ? total : 1 }, (_, i) => `Day ${i + 1}`);
  };

  const dayNames = calculateDayNames();
  const currentDayName = dayNames[activeDay - 1] || "Day 1";

  useEffect(() => {
    const categories = isTech ? techCategories : ["Guest List"];
    const initialData: any = {};
    dayNames.forEach(day => {
      initialData[day] = Object.fromEntries(categories.map((c) => [c, []]));
    });
    setData(initialData);
  }, [isTech, eventData.startDate, eventData.endDate]);

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
      setCustomLists((prev) => [...prev, listName]);
      setData((prev) => ({
        ...prev,
        [currentDayName]: {
          ...(prev[currentDayName] || {}),
          [listName]: []
        }
      }));
    }
  };

  return (
    <div className="space-y-6 p-6 bg-card rounded-2xl border border-border shadow-xl animate-in fade-in duration-500">

      {/* ✅ SINGLE event title — sirf yahan, Index.tsx mein nahi */}
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
          {dayNames.map((name, i) => (
            <Button
              key={i}
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
          ))}
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

        {customLists.map((list) => (
          <ParticipantTable
            key={`${currentDayName}-${list}`}
            title={list}
            event_id={eventData.id}
            participants={data[currentDayName]?.[list] || []}
            onUpdate={updateCategory(list)}
            isCustomEvent={true}
            isTechEvent={isTech}
          />
        ))}
      </div>
    </div>
  );
};

export default ParticipantManagement;