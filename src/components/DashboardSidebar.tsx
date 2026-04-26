import { useState } from "react";
import { Button } from "@/components/ui/button";

const eventOptions = ["tech", "party", "others"];

const CreateEventForm = ({ onSubmit }: { onSubmit?: (data: any) => void }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [eventType, setEventType] = useState("tech");
  const [customEventType, setCustomEventType] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalEventType =
      eventType === "others" ? customEventType : eventType;

    const formData = {
      title,
      description,
      eventType: finalEventType,
    };

    console.log("Event Created:", formData);

    if (onSubmit) {
      onSubmit(formData);
    }

    // reset form
    setTitle("");
    setDescription("");
    setEventType("tech");
    setCustomEventType("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Title */}
      <div>
        <label className="text-sm font-medium">Event Title</label>
        <input
          type="text"
          placeholder="Enter event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mt-1 p-2 border rounded-md"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          placeholder="Enter event description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mt-1 p-2 border rounded-md"
          rows={3}
        />
      </div>

      {/* Event Type Dropdown */}
      <div>
        <label className="text-sm font-medium">Event Type</label>

        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="w-full mt-1 p-2 border rounded-md"
        >
          {eventOptions.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Input for Others */}
      {eventType === "others" && (
        <div>
          <label className="text-sm font-medium">
            Specify Event Type
          </label>

          <input
            type="text"
            placeholder="e.g. Workshop, Seminar, Hackathon"
            value={customEventType}
            onChange={(e) => setCustomEventType(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md"
            required
          />
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full">
        Create Event
      </Button>
    </form>
  );
};

export default CreateEventForm;