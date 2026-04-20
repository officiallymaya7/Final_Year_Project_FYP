import { useState } from "react";
import { Filter, BarChart3 } from "lucide-react";

const categories = [
  "All Categories", "Music", "Dance", "Business", "Fine Arts", "Theatre",
  "Health", "Hospitality", "Fashion", "Sports", "Law", "Technical", "Literary",
];

const years = ["2026", "2025", "2024", "2023"];

const sampleReports = [
  { name: "Annual Music Fest", category: "Music", date: "Mar 15, 2026", attendees: 1200, status: "Completed" },
  { name: "Business Summit", category: "Business", date: "Feb 20, 2026", attendees: 450, status: "Completed" },
  { name: "Dance Championship", category: "Dance", date: "Jan 10, 2026", attendees: 800, status: "Completed" },
  { name: "Fine Arts Exhibition", category: "Fine Arts", date: "Dec 5, 2025", attendees: 320, status: "Completed" },
  { name: "Tech Hackathon", category: "Technical", date: "Nov 18, 2025", attendees: 600, status: "Completed" },
];

const ReportsTab = () => {
  const [year, setYear] = useState("2026");
  const [category, setCategory] = useState("All Categories");

  const filtered = sampleReports.filter((r) => {
    const matchYear = r.date.includes(year);
    const matchCat = category === "All Categories" || r.category === category;
    return matchYear && matchCat;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No reports found for the selected filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Event</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Attendees</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-card-foreground">{r.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">{r.category}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.attendees.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-success/10 text-success font-medium" style={{ color: 'hsl(142 71% 45%)' }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;
