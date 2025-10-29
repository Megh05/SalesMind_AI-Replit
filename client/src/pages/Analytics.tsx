import { StatCard } from "@/components/StatCard";
import {
  EngagementChart,
  ChannelDistributionChart,
  ChannelPerformanceChart,
} from "@/components/AnalyticsChart";
import { Users, Mail, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track performance and insights across all channels
          </p>
        </div>
        <Button variant="outline" data-testid="button-date-range">
          <Calendar className="h-4 w-4 mr-2" />
          Last 30 Days
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <EngagementChart />
        </div>
        <ChannelDistributionChart />
        <ChannelPerformanceChart />
      </div>
    </div>
  );
}
