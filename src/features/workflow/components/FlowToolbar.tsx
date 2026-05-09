import { useState } from "react";
import {
  Play, Save, Download, Archive,
  CheckCircle2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface FlowToolbarProps {
  workflowId?: string;
  workflowName?: string;
  isDirty?: boolean;
  isSimulating?: boolean;
  onRunSimulation: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onValidate: () => void;
}

export function FlowToolbar({
  workflowId,
  workflowName,
  isDirty,
  isSimulating,
  onRunSimulation,
  onSaveDraft,
  onPublish,
  onArchive,
  onValidate,
}: FlowToolbarProps) {
  const [validated, setValidated] = useState<boolean | null>(null);

  const handleValidate = () => {
    onValidate();
    setValidated(true);
    setTimeout(() => setValidated(null), 2500);
  };

  return (
    <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
      {/* Left: name + status */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <span className="text-sm font-medium text-foreground truncate block">
            {workflowName ?? (workflowId ? `Workflow ${workflowId.slice(0, 8)}` : "New Workflow")}
          </span>
        </div>
        <StatusBadge status={isDirty ? "draft" : "ready"} size="sm" />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "h-7 px-2.5 text-xs gap-1.5",
                validated === true && "text-emerald-400 border-emerald-500/40"
              )}
              onClick={handleValidate}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Validate
            </Button>
          </TooltipTrigger>
          <TooltipContent>Check all mappings are complete</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={onRunSimulation}
              disabled={isSimulating}
            >
              {isSimulating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {isSimulating ? "Simulating…" : "Simulate"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Run a visual simulation of the workflow</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-border mx-0.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={onSaveDraft}
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save as draft</TooltipContent>
        </Tooltip>

        <Button
          size="sm"
          className="h-7 px-3 text-xs gap-1.5"
          onClick={onPublish}
        >
          <Download className="h-3.5 w-3.5" />
          Publish
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={onArchive}
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Archive this workflow</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
