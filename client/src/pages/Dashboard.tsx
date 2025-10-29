import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { WorkflowCard } from "@/components/WorkflowCard";
import { EngagementChart } from "@/components/AnalyticsChart";
import { Users, Mail, TrendingUp, Target, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Workflow } from "@shared/schema";

interface WorkflowWithStats extends Workflow {
  nodeCount: number;
  successRate: number;
}

interface DashboardStats {
  stats: {
    totalLeads: number;
    messagesSent: number;
    engagementRate: string;
    conversionRate: string;
  };
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: dashboardData } = useQuery<DashboardStats>({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: workflows = [] } = useQuery<WorkflowWithStats[]>({
    queryKey: ["/api/workflows"],
  });

  const activeWorkflows = workflows.filter((w) => w.status === "active").slice(0, 3);

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
          value={dashboardData?.stats.totalLeads.toLocaleString() || "0"}
          change="+12% from last month"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Messages Sent"
          value={dashboardData?.stats.messagesSent.toLocaleString() || "0"}
          change="+23% from last month"
          icon={Mail}
          trend="up"
        />
        <StatCard
          title="Engagement Rate"
          value={dashboardData?.stats.engagementRate || "0%"}
          change="+5.2% from last month"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Conversion Rate"
          value={dashboardData?.stats.conversionRate || "0%"}
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
        {activeWorkflows.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">No active workflows. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={{
                  id: workflow.id,
                  name: workflow.name,
                  description: workflow.description,
                  status: workflow.status as any,
                  nodeCount: workflow.nodeCount,
                  executionCount: workflow.executionCount,
                  successRate: workflow.successRate,
                }}
                onEdit={() => setLocation(`/workflows/${workflow.id}`)}
                onRun={() => console.log("Run workflow:", workflow.id)}
                onDuplicate={() => console.log("Duplicate workflow:", workflow.id)}
                onDelete={() => console.log("Delete workflow:", workflow.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
