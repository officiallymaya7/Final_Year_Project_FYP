import { useState } from "react";
import ParticipantTable, { type Participant } from "./ParticipantTable";
import { type EventType } from "./DashboardSidebar";

interface Props {
  eventType: EventType;
  isCustomEvent?: boolean;
}

const ParticipantManagement = ({ eventType, isCustomEvent }: Props) => {
  // --- Titles کی State (Ab ye editable hain) ---
  const [titles, setTitles] = useState({
    exhibitors: "Exhibitors",
    judges: "Judges",
    volunteers: "Volunteers",
  });

  const [exhibitors, setExhibitors] = useState<Participant[]>([]);
  const [judges, setJudges] = useState<Participant[]>([]);
  const [volunteers, setVolunteers] = useState<Participant[]>([]);

  // Title update karne ka function
  const updateTitle = (key: keyof typeof titles, newTitle: string) => {
    setTitles((prev) => ({ ...prev, [key]: newTitle }));
  };

  return (
    <div className="space-y-8">
      {/* Exhibitors Section */}
      <ParticipantTable
        title={titles.exhibitors}
        onTitleChange={(newTitle) => updateTitle("exhibitors", newTitle)} // Naya Prop
        participants={exhibitors}
        onUpdate={setExhibitors}
        isTechEvent={eventType === "tech"}
        isCustomEvent={isCustomEvent}
        editableTitle // Editable feature enable karne ke liye
      />

      {/* Judges Section */}
      <ParticipantTable
        title={titles.judges}
        onTitleChange={(newTitle) => updateTitle("judges", newTitle)}
        participants={judges}
        onUpdate={setJudges}
        isTechEvent={eventType === "tech"}
        isCustomEvent={isCustomEvent}
        editableTitle
      />

      {/* Volunteers Section */}
      <ParticipantTable
        title={titles.volunteers}
        onTitleChange={(newTitle) => updateTitle("volunteers", newTitle)}
        participants={volunteers}
        onUpdate={setVolunteers}
        isTechEvent={eventType === "tech"}
        isCustomEvent={isCustomEvent}
        editableTitle
      />
    </div>
  );
};

export default ParticipantManagement;