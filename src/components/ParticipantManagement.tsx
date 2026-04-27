import { useState, useEffect } from "react";
import type { EventType } from "@/components/DashboardSidebar";
import ParticipantTable, { type Participant } from "@/components/ParticipantTable";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface Props {
  eventType: EventType;
  eventData?: any; // Index.tsx se event details lene ke liye
}

const techCategories = ["Exhibitors", "Judges", "Volunteers", "Visitors", "Others"];
const guestCategories: string[] = [];

const ParticipantManagement = ({ eventType, eventData }: Props) => {
  const isTech = eventType === "tech";
  const categories = isTech ? techCategories : guestCategories;

  // --- Multi-Day Logic ---
  const [activeDay, setActiveDay] = useState(1);
  const [dayNames, setDayNames] = useState<string[]>([]);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);

  // Participant data ab din ke hisaab se store hoga: { "Day 1": { "Exhibitors": [] } }
  const [data, setData] = useState<Record<string, Record<string, Participant[]>>>({});
  const [customLists, setCustomLists] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (eventData?.startDate && eventData?.endDate) {
      const s = new Date(eventData.startDate);
      const e = new Date(eventData.endDate);
      const diff = Math.abs(e.getTime() - s.getTime());
      const total = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; //

      const names = Array.from({ length: total }, (_, i) => `Day ${i + 1}`);
      setDayNames(names);
      
      // Initial data structure setup for each day
      const initialData: any = {};
      const initialCustom: any = {};
      names.forEach(name => {
        initialData[name] = Object.fromEntries(categories.map((c) => [c, []]));
        initialCustom[name] = [];
      });
      setData(initialData);
      setCustomLists(initialCustom);
    }
  }, [eventData]);

  const currentDayName = dayNames[activeDay - 1];

  // Functions for current active day
  const updateCategory = (category: string) => (participants: Participant[]) => {
    setData((prev) => ({
      ...prev,
      [currentDayName]: { ...prev[currentDayName], [category]: participants }
    }));
  };

  const addCustomList = () => {
    const name = window.prompt("Enter List Name (e.g. Sponsors, VIPs)");
    if (!name || !currentDayName) return;
    setCustomLists((prev) => ({
      ...prev,
      [currentDayName]: [...(prev[currentDayName] || []), name]
    }));
  };

  const renameDay = (index: number, newName: string) => {
    const oldName = dayNames[index];
    const updatedNames = [...dayNames];
    updatedNames[index] = newName;
    setDayNames(updatedNames);

    // Data ko naye naam par shift karna
    setData((prev) => {
      const newData = { ...prev };
      newData[newName] = newData[oldName];
      delete newData[oldName];
      return newData;
    });
    setEditingDayIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* 🗓️ MULTI-DAY TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border scrollbar-hide">
        {dayNames.map((name, index) => (
          <div key={index} className="relative group">
            <button
              onClick={() => setActiveDay(index + 1)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-2",
                activeDay === index + 1 
                  ? "bg-primary/20 border-[#F9BB1E] text-[#F9BB1E]" // Yellow highlight for active
                  : "bg-card border-border text-muted-foreground hover:border-primary/50"
              )}
            >

              {editingDayIndex === index ? (
                <input
                  autoFocus
                  className="bg-transparent outline-none w-24 border-b border-[#F9BB1E]"
                  value={name}
                  onChange={(e) => {
                    const updated = [...dayNames];
                    updated[index] = e.target.value;
                    setDayNames(updated);
                  }}
                  onBlur={() => setEditingDayIndex(null)}
                  aria-label="Day name"
                />

              ) : (
                <>
                  {name}
                  <Pencil 
                    className="h-3 w-3 opacity-0 group-hover:opacity-100 cursor-pointer" 
                    onClick={(e) => { e.stopPropagation(); setEditingDayIndex(index); }}
                  />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#F9BB1E]">{currentDayName} Management</h3>
        <button
          onClick={addCustomList}
          className="px-3 py-1 text-sm border border-primary/50 rounded-lg hover:bg-primary/10 text-primary transition-colors"
        >
          + Add Custom List
        </button>
      </div>

      {/* 🔹 CATEGORIES FOR ACTIVE DAY */}
      {currentDayName && data[currentDayName] && (
        <div className="space-y-8">
          {categories.map((cat) => (
            <ParticipantTable
              key={`${currentDayName}-${cat}`}
              title={cat}
              participants={data[currentDayName][cat] || []}
              onUpdate={updateCategory(cat)}
              isTechEvent={isTech}
            />
          ))}

          {/* 🔥 CUSTOM LISTS FOR ACTIVE DAY */}
          {(customLists[currentDayName] || []).map((list) => (
            <ParticipantTable
              key={`${currentDayName}-${list}`}
              title={list}
              participants={data[currentDayName][list] || []}
              onUpdate={updateCategory(list)}
              editableTitle={true}
              isCustomEvent={true}
              isTechEvent={isTech}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParticipantManagement;