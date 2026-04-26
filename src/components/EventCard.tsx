import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";

interface EventCardProps {
  image: string;
  title: string;
  venue: string;
  day: string;
  month: string;
  published: boolean;
  closed?: boolean;
  onTogglePublish?: () => void;
}

const EventCard = ({ image, title, venue, day, month, published, closed, onTogglePublish }: EventCardProps) => {

  const [eventTitle, setEventTitle] = useState(title);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="event-card">
      <div className="relative">
        <img src={image} alt={eventTitle} className="w-full h-48 object-cover" loading="lazy" width={640} height={512} />
        <div className="date-badge absolute top-3 right-3 px-2.5 py-1.5 text-center leading-tight">
          <span className="block text-lg font-bold">{day}</span>
          <span className="block text-[10px] uppercase tracking-wider">{month}</span>
        </div>
      </div>

      <div className="p-4">

        {/* 🔹 Editable Title */}
        {isEditing ? (
          <input
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="border px-2 py-1 rounded w-full mb-2"
          />
        ) : (
          <h3 className="font-semibold text-card-foreground hover:text-primary cursor-pointer transition-colors text-base mb-1 line-clamp-1">
            {eventTitle}
          </h3>
        )}

        <p className="text-xs text-muted-foreground mb-4">{venue}</p>

        <div className="flex items-center gap-2">
          {closed ? (
            <button className="btn-publish" onClick={onTogglePublish}>Publish</button>
          ) : (
            <button
              className={published ? "btn-unpublish" : "btn-publish"}
              onClick={onTogglePublish}
            >
              {published ? "Unpublish" : "Publish"}
            </button>
          )}

          {/* 🔹 Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1"
          >
            <Edit className="w-3 h-3" />
            {isEditing ? "Save" : "Edit"}
          </button>

          {/* 🔹 Delete Button */}
          <button
            onClick={() => setEventTitle("")}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
