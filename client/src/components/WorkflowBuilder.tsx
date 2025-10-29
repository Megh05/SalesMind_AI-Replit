import { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Linkedin, Calendar, Clock, GitBranch, Sparkles } from "lucide-react";

// Custom node component
function WorkflowNode({ data }: { data: any }) {
  const icons = {
    email: Mail,
    sms: MessageSquare,
    linkedin: Linkedin,
    calendar: Calendar,
    wait: Clock,
    decision: GitBranch,
    ai: Sparkles,
  };

  const Icon = icons[data.type as keyof typeof icons] || Mail;

  return (
    <Card className="p-3 min-w-[160px] shadow-md hover-elevate">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="font-semibold text-sm">{data.label}</div>
          <div className="text-xs text-muted-foreground">{data.type}</div>
        </div>
      </div>
    </Card>
  );
}

const nodeTypes: NodeTypes = {
  workflow: WorkflowNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "workflow",
    position: { x: 250, y: 50 },
    data: { label: "AI Generate Message", type: "ai" },
  },
  {
    id: "2",
    type: "workflow",
    position: { x: 250, y: 150 },
    data: { label: "Send Email", type: "email" },
  },
  {
    id: "3",
    type: "workflow",
    position: { x: 250, y: 250 },
    data: { label: "Wait 2 Days", type: "wait" },
  },
  {
    id: "4",
    type: "workflow",
    position: { x: 100, y: 350 },
    data: { label: "Send SMS", type: "sms" },
  },
  {
    id: "5",
    type: "workflow",
    position: { x: 400, y: 350 },
    data: { label: "LinkedIn Message", type: "linkedin" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4", label: "No reply" },
  { id: "e3-5", source: "3", target: "5", label: "No reply" },
];

interface WorkflowBuilderProps {
  readonly?: boolean;
}

export function WorkflowBuilder({ readonly = false }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);

  const nodeOptions = [
    { type: "ai", label: "AI Generate", icon: Sparkles },
    { type: "email", label: "Send Email", icon: Mail },
    { type: "sms", label: "Send SMS", icon: MessageSquare },
    { type: "linkedin", label: "LinkedIn", icon: Linkedin },
    { type: "calendar", label: "Schedule", icon: Calendar },
    { type: "wait", label: "Wait", icon: Clock },
    { type: "decision", label: "Decision", icon: GitBranch },
  ];

  const addNode = (type: string, label: string) => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: "workflow",
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: { label, type },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="h-full w-full flex gap-4">
      {!readonly && (
        <Card className="w-64 p-4 flex flex-col gap-2">
          <h3 className="font-semibold mb-2">Add Nodes</h3>
          {nodeOptions.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant="outline"
              className="justify-start gap-2"
              onClick={() => addNode(type, label)}
              data-testid={`button-add-node-${type}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </Card>
      )}
      <div className="flex-1 h-full rounded-lg border bg-card">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readonly ? undefined : onNodesChange}
          onEdgesChange={readonly ? undefined : onEdgesChange}
          onConnect={readonly ? undefined : onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
