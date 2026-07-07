import {
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    XAxis,
    YAxis,
  } from "recharts";
  
  const COLORS = ["#7C3AED", "#A855F7", "#EC4899", "#06B6D4"];
  
  interface Props {
    managers: number;
    events: number;
    certificates: number;
    emails: number;
  }
  
  const DashboardCharts = ({
    managers,
    events,
    certificates,
    emails,
  }: Props) => {
    const cardData = [
      { name: "Managers", value: managers },
      { name: "Events", value: events },
      { name: "Certificates", value: certificates },
      { name: "Emails", value: emails },
    ];
  
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Platform Statistics</h2>
  
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cardData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#7C3AED" />
            </BarChart>
          </ResponsiveContainer>
        </div>
  
        {/* Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Distribution</h2>
  
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cardData}
                dataKey="value"
                outerRadius={100}
                label
              >
                {cardData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
  
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };
  
  export default DashboardCharts;