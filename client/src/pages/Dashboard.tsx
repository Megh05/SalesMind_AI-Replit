import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { WorkflowCard, WorkflowItem } from "@/components/WorkflowCard";
import { EngagementChart } from "@/components/AnalyticsChart";
import { Users, Mail, TrendingUp, Target, Plus } from "lucide-react";
import { useLocation } from "wouter";

//todo: remove mock functionality
const mockWorkflows: WorkflowItem[] = [
  {
    id: "1",
    name: "Cold Outreach Sequence",
    description: "AI-powered multi-channel outreach with automated follow-ups",
    status: "active",
    nodeCount: 7,
    executionCount: 342,
    successRate: 87,
  },
  {
    id: "2",
    name: "Lead Nurture Campaign",
    description: "Automated nurture sequence for warm leads",
    status: "active",
    nodeCount: 5,
    executionCount: 156,
    successRate: 92,
  },
  {
    id: "3",
    name: "Re-engagement Flow",
    description: "Win back dormant leads with personalized messaging",
    status: "paused",
    nodeCount: 4,
    executionCount: 89,
    successRate: 64,
  },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your sales automation.
          </p>
        </div>
        <Button onClick={() => setLocation("/workflows")} data-testid="button-create-workflow">
          <Plus className="h-4 w-4 mr-2" />
          New Workflow
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

      <EngagementChart />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Active Workflows</h2>
          <Button variant="outline" onClick={() => setLocation("/workflows")}>
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onEdit={() => setLocation(`/workflows/${workflow.id}`)}
              onRun={() => console.log("Run workflow:", workflow.id)}
              onDuplicate={() => console.log("Duplicate workflow:", workflow.id)}
              onDelete={() => console.log("Delete workflow:", workflow.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
