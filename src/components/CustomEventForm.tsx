import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  onClose: () => void;
  onSubmit: (event: CustomEventFormData) => void;
}

export interface CustomEventFormData {
  name: string;
  customType: string;
  date: string;
  venue: string;
  description: string;
}

const CustomEventForm = ({ onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<CustomEventFormData>({
    name: "", customType: "", date: "", venue: "", description: "",
  });

  const today = new Date().toISOString().split("T")[0];
  const isPastDate = form.date && form.date < today;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPastDate) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Create Your Own Event</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="cname">Event Name</Label>
            <Input id="cname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter event name" required />
          </div>
          <div>
            <Label htmlFor="ctype">Your Event Type</Label>
            <Input id="ctype" value={form.customType} onChange={(e) => setForm({ ...form, customType: e.target.value })} placeholder="e.g. Conference, Meetup, Workshop" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cdate">Event Date</Label>
              <Input id="cdate" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} min={today} required />
              {isPastDate && <p className="text-xs text-destructive mt-1">Please select an upcoming date.</p>}
            </div>
            <div>
              <Label htmlFor="cvenue">Venue</Label>
              <Input id="cvenue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Event venue" required />
            </div>
          </div>
          <div>
            <Label htmlFor="cdesc">Description</Label>
            <Textarea id="cdesc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event description" rows={3} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">Next →</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomEventForm;
