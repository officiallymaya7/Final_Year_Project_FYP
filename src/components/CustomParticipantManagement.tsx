import { useState, useEffect } from "react";
import ParticipantTable, { type Participant } from "./ParticipantTable";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";

// 🔥 Strict Interface taake Index.tsx aur event_id ka error khatam ho jaye
interface Props {
  eventType: string; 
  eventData?: {
    id: string;
    name: string;
    type: string;
    startDate?: string;
    [key: string]: any;
  } | null;
}

const techCategories = ["Exhibitors", "Judges", "Volunteers", "Visitors"];

const ParticipantManagement = ({ eventType, eventData }: Props) => {
  const isTech = eventType === "tech";
  const [activeDay, setActiveDay] = useState(1);
  const [dayNames, setDayNames] = useState<string[]>(["Day 1"]);
  const [data, setData] = useState<Record<string, Record<string, Participant[]>>>({});
  const [customLists, setCustomLists] = useState<string[]>([]);

  // Setup initial categories and structure
  useEffect(() => {
    const categories = isTech ? techCategories : ["Guest List"];
    const initialData: any = {};
    initialData["Day 1"] = Object.fromEntries(categories.map((c) => [c, []]));
    setData(initialData);
  }, [isTech]);

  const currentDayName = dayNames[activeDay - 1];

  const updateCategory = (category: string) => (participants: Participant[]) => {
    setData((prev) => ({
      ...prev,
      [currentDayName]: { ...prev[currentDayName], [category]: participants }
    }));
  };

  const handleAddList = () => {
    const name = window.prompt("Enter List Name (e.g. VIPs, Speakers):");
    if (name && name.trim()) {
      setCustomLists((prev) => [...prev, name.trim()]);
      // Initialize empty data for this new list
      setData((prev) => ({
        ...prev,
        [currentDayName]: { ...prev[currentDayName], [name.trim()]: [] }
      }));
    }
  };

  return (
    <div className="space-y-6 p-6 bg-card rounded-2xl border border-border shadow-xl">
      {/* 🗓️ Header & Day Selection */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div className="flex gap-2">
          {dayNames.map((name, i) => (
            <Button
              key={i}
              variant={activeDay === i + 1 ? "default" : "outline"}
              onClick={() => setActiveDay(i + 1)}
              className={cn(activeDay === i + 1 && "bg-primary text-primary-foreground")}
            >
              {name}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleAddList} className="gap-2 border-primary/50 text-primary">
          <Plus className="h-4 w-4" /> Add Custom List
        </Button>
      </div>

      {/* 📋 Tables List */}
      <div className="grid grid-cols-1 gap-6">
        {/* Render Tech Categories (Exhibitors, etc.) or Default Guest List */}
        {(isTech ? techCategories : ["Guest List"]).map((cat) => (
          <ParticipantTable
            key={`${currentDayName}-${cat}`}
            title={cat}
            // 🔥 'as string' use kiya hai taake undefined ka error bilkul khatam ho jaye
            event_id={eventData?.id as string} 
            participants={data[currentDayName]?.[cat] || []}
            onUpdate={updateCategory(cat)}
            isTechEvent={isTech}
          />
        ))}

        {/* Render Any Custom Lists added by the user */}
        {customLists.map((list) => (
          <ParticipantTable
            key={`${currentDayName}-${list}`}
            title={list}
            event_id={eventData?.id as string}
            participants={data[currentDayName]?.[list] || []}
            onUpdate={updateCategory(list)}
            isCustomEvent={true}
          />
        ))}
      </div>
    </div>
  );
};

export default ParticipantManagement;