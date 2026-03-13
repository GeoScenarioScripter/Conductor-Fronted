import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { MicroserviceNodeData } from "../types";
import {
  Database,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const statusColors = {
  idle: "border-muted-foreground/30 bg-card/50",
  running: "border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,240,255,0.3)]",
  success:
    "border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]",
  error:
    "border-destructive bg-destructive/10 shadow-[0_0_15px_rgba(255,0,60,0.3)]",
  warning:
    "border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]",
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "running":
      return <Activity className="h-4 w-4 text-primary animate-spin" />;
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "error":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return null;
  }
};

export const MicroserviceNode = memo(({ data, selected }: NodeProps) => {
  // Cast data to MicroserviceNodeData safely
  const nodeData = data as unknown as MicroserviceNodeData;

  return (
    <div
      className={cn(
        "min-w-[200px] rounded-lg border-2 backdrop-blur-md transition-all duration-300",
        statusColors[nodeData.status || "idle"],
        selected && "ring-2 ring-offset-2 ring-primary ring-offset-background"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-current opacity-70" />
          <div className="flex flex-col">
            {nodeData.serviceName && (
              <span className="text-[10px] text-primary/80 mb-0.5 font-medium uppercase tracking-wider">
                {nodeData.serviceName}
              </span>
            )}
            <span className="font-semibold text-sm tracking-wide leading-none">
              {nodeData.label}
            </span>
            {nodeData.description && (
              <span className="text-[10px] text-muted-foreground mt-1 font-normal max-w-[150px] truncate">
                {nodeData.description}
              </span>
            )}
          </div>
        </div>
        <StatusIcon status={nodeData.status || "idle"} />
      </div>

      {/* Body */}
      <div className="p-3 space-y-4">
        {/* DB Connection */}
        {nodeData.db && (Array.isArray(nodeData.db) ? nodeData.db.length > 0 : nodeData.db) && (
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground bg-background/50 p-2 rounded border border-border/30">
            {(Array.isArray(nodeData.db) ? nodeData.db : [nodeData.db]).map((dbName: string) => (
              <div key={dbName} className="flex items-center gap-2">
                <Database className="h-3 w-3 text-primary/70" />
                <span>{dbName}</span>
              </div>
            ))}
          </div>
        )}

        {/* Connection Points */}
        <div className="flex justify-between items-center">
          {/* Input Handle */}
          <div className="relative">
            <Handle
              type="target"
              position={Position.Left}
              id="input"
              className="!w-3 !h-3 !bg-primary !border-2 !border-background transition-transform hover:scale-125"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
              输入
            </span>
          </div>

          {/* Output Handle */}
          <div className="relative">
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
              输出
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id="output"
              className="!w-3 !h-3 !bg-secondary !border-2 !border-background transition-transform hover:scale-125"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
