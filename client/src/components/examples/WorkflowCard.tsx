import { WorkflowCard } from "../WorkflowCard";

const mockWorkflow = {
  id: "1",
  name: "Cold Outreach Sequence",
  description: "AI-powered multi-channel outreach with automated follow-ups and engagement tracking.",
  status: "active" as const,
  nodeCount: 7,
  executionCount: 342,
  successRate: 87,
};

export default function WorkflowCardExample() {
  return (
    <div className="p-8 max-w-md">
      <WorkflowCard
        workflow={mockWorkflow}
        onEdit={() => console.log("Edit workflow")}
        onRun={() => console.log("Run workflow")}
        onDuplicate={() => console.log("Duplicate workflow")}
        onDelete={() => console.log("Delete workflow")}
      />
    </div>
  );
}
