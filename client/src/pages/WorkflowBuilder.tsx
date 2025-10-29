import { Button } from "@/components/ui/button";
import { WorkflowBuilder as Builder } from "@/components/WorkflowBuilder";
import { Save, Play, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function WorkflowBuilderPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/workflows")}
            data-testid="button-back-workflows"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Workflow Builder</h1>
            <p className="text-sm text-muted-foreground">
              Cold Outreach Sequence
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-save-workflow">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button data-testid="button-run-workflow">
            <Play className="h-4 w-4 mr-2" />
            Run Workflow
          </Button>
        </div>
      </div>
      <div className="flex-1">
        <Builder />
      </div>
    </div>
  );
}
