import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventType } from "@/components/DashboardSidebar";

interface Props {
  onClose: () => void;
  onSubmit: (event: EventFormData) => void;
}

export interface EventFormData {
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  dayVenues: string[];
  type: EventType;
  description: string;
}

const EventCreationForm = ({ onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<EventFormData & { otherType: string }>({
    name: "",
    startDate: "",
    endDate: "",
    venue: "",
    dayVenues: [],
    type: "tech",
    description: "",
    otherType: "",
  });

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const totalDays = calculateDays(form.startDate, form.endDate);
  const today = new Date().toISOString().split("T")[0];
  const isPastDate = form.startDate && form.startDate < today;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPastDate) return;

    // ✨ Modified submission logic to ensure dayVenues is always an array
    onSubmit({
      ...form,
      type: form.type === "others" ? (form.otherType as EventType) : form.type,
      dayVenues: totalDays > 1 ? form.dayVenues : [form.venue]
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      {/* 🔥 Poora dabba ab FORM ke andar hai taake button kaam kare */}
      <form 
        onSubmit={handleSubmit} 
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Create New Event</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div>
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter event name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                min={today}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                min={form.startDate || today}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {totalDays > 0 && (
            <div className="p-2 rounded-md bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-[#F9BB1E] italic">
                ✨ Event Duration: {totalDays} {totalDays === 1 ? "Day" : "Days"}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="type">Event Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v as EventType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tech">Tech Event</SelectItem>
                <SelectItem value="party">Party</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="others">Others +</SelectItem>
              </SelectContent>
            </Select>

            {form.type === "others" && (
              <div className="mt-3 p-3 bg-[#F9BB1E]/5 border-2 border-[#F9BB1E] rounded-lg">
                <Input
                  autoFocus
                  value={form.otherType}
                  onChange={(e) => setForm({ ...form, otherType: e.target.value })}
                  placeholder="Specify event type"
                  className="bg-transparent border-none focus-visible:ring-0 p-0"
                  required
                />
              </div>
            )}
          </div>

          {totalDays <= 1 ? (
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="Main Venue Location"
                required
              />
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
              <Label className="text-[#F9BB1E] font-bold text-xs uppercase tracking-widest">Daily Locations</Label>
              {Array.from({ length: totalDays }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Input
                    placeholder={`Venue for Day ${i + 1}`}
                    value={form.dayVenues[i] || ""}
                    onChange={(e) => {
                      const newDays = [...form.dayVenues];
                      newDays[i] = e.target.value;
                      setForm({ ...form, dayVenues: newDays });
                    }}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tell us about the event..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer Actions - Now safely inside the <form> */}
        <div className="p-6 border-t border-border flex gap-3 bg-card rounded-b-xl">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold">
            Next →
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventCreationForm;