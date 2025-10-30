import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["hsl(221, 83%, 53%)", "hsl(262, 83%, 58%)", "hsl(291, 64%, 42%)", "hsl(199, 89%, 48%)"];

interface EngagementData {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
}

interface ChannelData {
  name: string;
  value: number;
}

interface ChannelPerformanceData {
  channel: string;
  count: number;
  openRate: number;
}

export function EngagementChart({ data }: { data: EngagementData[] }) {
  const displayData = data.length > 0 ? data : [
    { date: "No data", sent: 0, opened: 0, clicked: 0, replied: 0 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Line
              type="monotone"
              dataKey="sent"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))" }}
            />
            <Line
              type="monotone"
              dataKey="opened"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-2))" }}
            />
            <Line
              type="monotone"
              dataKey="replied"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-3))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ChannelDistributionChart({ data }: { data: ChannelData[] }) {
  const displayData = data.length > 0 ? data : [
    { name: "No data", value: 1 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ChannelPerformanceChart({ data }: { data: ChannelPerformanceData[] }) {
  const displayData = data.length > 0 ? data : [
    { channel: "No data", count: 0, openRate: 0 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="channel" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
