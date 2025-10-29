import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkflowCard, WorkflowItem } from "@/components/WorkflowCard";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

//todo: remove mock functionality
const mockWorkflows: WorkflowItem[] = [
  {
    id: "1",
    name: "Cold Outreach Sequence",
    description: "AI-powered multi-channel outreach with automated follow-ups and engagement tracking",
    status: "active",
    nodeCount: 7,
    executionCount: 342,
    successRate: 87,
  },
  {
    id: "2",
    name: "Lead Nurture Campaign",
    description: "Automated nurture sequence for warm leads with personalized messaging",
    status: "active",
    nodeCount: 5,
    executionCount: 156,
    successRate: 92,
  },
  {
    id: "3",
    name: "Re-engagement Flow",
    description: "Win back dormant leads with personalized messaging and special offers",
    status: "paused",
    nodeCount: 4,
    executionCount: 89,
    successRate: 64,
  },
  {
    id: "4",
    name: "Product Demo Scheduler",
    description: "Automatically schedule product demos based on lead qualification",
    status: "active",
    nodeCount: 6,
    executionCount: 234,
    successRate: 95,
  },
  {
    id: "5",
    name: "LinkedIn Outreach",
    description: "Professional LinkedIn connection and messaging campaign",
    status: "active",
    nodeCount: 4,
    executionCount: 128,
    successRate: 73,
  },
  {
    id: "6",
    name: "Post-Demo Follow-up",
    description: "Automated follow-up sequence after product demonstrations",
    status: "draft",
    nodeCount: 3,
    executionCount: 0,
    successRate: 0,
  },
];

export default function Workflows() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [, setLocation] = useLocation();

  const filteredWorkflows = mockWorkflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Create and manage your automation workflows
          </p>
        </div>
        <Button onClick={() => setLocation("/workflows/new")} data-testid="button-create-workflow">
          <Plus className="h-4 w-4 mr-2" />
          New Workflow
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-workflows"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkflows.map((workflow) => (
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
  );
}
