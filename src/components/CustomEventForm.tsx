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
  startDate: string;
  endDate: string;
  durationDays?: number;
  venue: string;
  description: string;
}

const CustomEventForm = ({ onClose, onSubmit }: Props) => {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<CustomEventFormData>({
    name: "",
    customType: "",
    startDate: "",
    endDate: "",
    venue: "",
    description: "",
  });

  // ✅ check past start date
  const isPastDate =
    form.startDate &&
    new Date(form.startDate) < new Date(today);

  // ✅ calculate duration
  const duration =
    form.startDate && form.endDate
      ? Math.ceil(
          (new Date(form.endDate).getTime() -
            new Date(form.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isPastDate) return;
    if (!form.startDate || !form.endDate) return;

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);

    if (end < start) {
      alert("End date start date se pehle nahi ho sakti");
      return;
    }

    const diffDays =
      Math.ceil(
        (end.getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    onSubmit({
      ...form,
      durationDays: diffDays,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4">

        {/* Header */}
// ...existing code...
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">
            Create Your Own Event
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
// ...existing code...

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Name */}
          <div>
            <Label>Event Name</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />
          </div>

          {/* Type */}
          <div>
            <Label>Event Type</Label>
            <Input
              value={form.customType}
              onChange={(e) =>
                setForm({
                  ...form,
                  customType: e.target.value,
                })
              }
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                min={today}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startDate: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                min={form.startDate || today}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endDate: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          {/* Duration */}
          {duration && (
            <p className="text-sm text-green-600">
              Event Duration: {duration} day
              {duration > 1 ? "s" : ""}
            </p>
          )}

          {/* Past date warning */}
          {isPastDate && (
            <p className="text-sm text-red-500">
              Start date past nahi ho sakti
            </p>
          )}

          {/* Venue */}
          <div>
            <Label>Venue</Label>
            <Input
              value={form.venue}
              onChange={(e) =>
                setForm({
                  ...form,
                  venue: e.target.value,
                })
              }
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button type="submit" className="flex-1">
              Create Event
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CustomEventForm;