import { StatCard } from "@/components/StatCard";
import {
  EngagementChart,
  ChannelDistributionChart,
  ChannelPerformanceChart,
} from "@/components/AnalyticsChart";
import { Users, Mail, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track performance and insights across all channels
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const leadStats = analytics?.leadStats || { total: 0, byStatus: {}, byChannel: {} };
  const messageStats = analytics?.messageStats || { total: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0 };
  
  const openRate = messageStats.sent > 0 
    ? ((messageStats.opened / messageStats.sent) * 100).toFixed(1)
    : "0.0";
  
  const replyRate = messageStats.sent > 0
    ? ((messageStats.replied / messageStats.sent) * 100).toFixed(1)
    : "0.0";

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
          value={leadStats.total.toLocaleString()}
          change=""
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Messages Sent"
          value={messageStats.sent.toLocaleString()}
          change=""
          icon={Mail}
          trend="up"
        />
        <StatCard
          title="Open Rate"
          value={`${openRate}%`}
          change=""
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Reply Rate"
          value={`${replyRate}%`}
          change=""
          icon={Target}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <EngagementChart data={analytics?.engagementData || []} />
        </div>
        <ChannelDistributionChart data={analytics?.channelDistribution || []} />
        <ChannelPerformanceChart data={analytics?.channelPerformance || []} />
      </div>
    </div>
  );
}
