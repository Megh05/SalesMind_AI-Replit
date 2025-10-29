import { EngagementChart, ChannelDistributionChart, ChannelPerformanceChart } from "../AnalyticsChart";

export default function AnalyticsChartExample() {
  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-2">
        <EngagementChart />
      </div>
      <ChannelDistributionChart />
      <ChannelPerformanceChart />
    </div>
  );
}
