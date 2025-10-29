import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Edit, Copy, Trash2, Pause } from "lucide-react";

export interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "draft";
  nodeCount: number;
  executionCount: number;
  successRate: number;
}

interface WorkflowCardProps {
  workflow: WorkflowItem;
  onEdit?: () => void;
  onRun?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  paused: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

export function WorkflowCard({ workflow, onEdit, onRun, onDuplicate, onDelete }: WorkflowCardProps) {
  return (
    <Card data-testid={`card-workflow-${workflow.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base mb-2">{workflow.name}</CardTitle>
          <Badge variant="outline" className={statusColors[workflow.status]}>
            {workflow.status}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRun}
            data-testid={`button-run-workflow-${workflow.id}`}
          >
            {workflow.status === "active" ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
            data-testid={`button-edit-workflow-${workflow.id}`}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDuplicate}
            data-testid={`button-duplicate-workflow-${workflow.id}`}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDelete}
            data-testid={`button-delete-workflow-${workflow.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {workflow.description}
        </p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Nodes</div>
            <div className="font-semibold">{workflow.nodeCount}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Executions</div>
            <div className="font-semibold">{workflow.executionCount}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Success</div>
            <div className="font-semibold">{workflow.successRate}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
