import { StatCard } from "../StatCard";
import { Users, Mail, TrendingUp, Target } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Leads"
        value="2,543"
        change="+12% from last month"
        icon={Users}
        trend="up"
      />
      <StatCard
        title="Messages Sent"
        value="8,234"
        change="+23% from last month"
        icon={Mail}
        trend="up"
      />
      <StatCard
        title="Engagement Rate"
        value="42.3%"
        change="+5.2% from last month"
        icon={TrendingUp}
        trend="up"
      />
      <StatCard
        title="Conversion Rate"
        value="18.7%"
        change="-2.1% from last month"
        icon={Target}
        trend="down"
      />
    </div>
  );
}
