import { useState } from "react";
import type { EventType } from "@/components/DashboardSidebar";
import ParticipantTable, { type Participant } from "@/components/ParticipantTable";

interface Props {
  eventType: EventType;
  isCustomEvent?: boolean;
}

const techCategories = ["Exhibitors", "Judges", "Volunteers", "Visitors", "Others"];
const guestCategories = ["Guest List", "Others"];

const ParticipantManagement = ({ eventType, isCustomEvent }: Props) => {
  const isTech = eventType === "tech";
  const categories = isTech ? techCategories : guestCategories;

  const [data, setData] = useState<Record<string, Participant[]>>(
    Object.fromEntries(categories.map((c) => [c, []]))
  );

  const updateCategory = (category: string) => (participants: Participant[]) => {
    setData((prev) => ({ ...prev, [category]: participants }));
  };

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <ParticipantTable
          key={cat}
          title={cat}
          participants={data[cat] || []}
          onUpdate={updateCategory(cat)}
          isTechEvent={isTech}
          isCustomEvent={isCustomEvent}
        />
      ))}
    </div>
  );
};

export default ParticipantManagement;
