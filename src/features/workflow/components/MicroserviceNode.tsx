import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Copy, Settings, Trash2, Search, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MicroserviceNodeData, NodeStatus } from "../types";

const statusRingMap: Record<NodeStatus, string> = {
  idle:    "border-border",
  ready:   "border-primary/50",
  running: "border-secondary/70",
  success: "border-emerald-500/60",
  warning: "border-amber-500/60",
  error:   "border-red-500/60",
};

const statusBgMap: Record<NodeStatus, string> = {
  idle:    "",
  ready:   "",
  running: "bg-secondary/5",
  success: "bg-emerald-500/5",
  warning: "bg-amber-500/5",
  error:   "bg-red-500/5",
};

const statusDotMap: Record<NodeStatus, string> = {
  idle:    "bg-slate-500",
  ready:   "bg-primary",
  running: "bg-secondary animate-pulse",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error:   "bg-red-400",
};

export const MicroserviceNode = memo(function MicroserviceNode({
  data,
  selected,
}: NodeProps) {
  const d = data as unknown as MicroserviceNodeData;
  const status: NodeStatus = (d.status as NodeStatus) ?? "idle";
  const [hovered, setHovered] = useState(false);

  const handleNodeAction = (type: string) => {
    window.dispatchEvent(new CustomEvent("nodeAction", { detail: { type } }));
  };

  return (
    <div
      className={cn(
        "relative w-52 rounded-lg border bg-card/95 backdrop-blur-sm shadow-md transition-all duration-150 overflow-hidden select-none",
        statusRingMap[status],
        statusBgMap[status],
        selected && "ring-1 ring-primary shadow-[0_0_0_1.5px_hsl(189_85%_52%),_0_0_16px_hsl(189_85%_52%_/_0.2)]",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Scan-line for running state */}
      {status === "running" && (
        <div className="node-scanning" aria-hidden="true" />
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!h-3 !w-3 !rounded-full !border-2 !bg-card transition-all duration-150",
          selected || hovered ? "!border-primary !scale-125" : "!border-muted-foreground/40"
        )}
      />

      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start gap-2">
          <span className={cn("mt-1 h-2 w-2 rounded-full flex-shrink-0", statusDotMap[status])} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground truncate leading-tight">{d.appName ?? "—"}</p>
            <p className="text-xs font-semibold text-foreground leading-tight truncate mt-0.5">
              {d.label ?? d.methodName ?? "Node"}
            </p>
            {d.serviceName && (
              <p className="text-[10px] text-muted-foreground/70 truncate leading-tight mt-0.5">{d.serviceName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/60 mx-3" />

      {/* Body */}
      <div className="px-3 py-2">
        {d.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">{d.description}</p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ChevronRight className="h-2.5 w-2.5 rotate-180" />
            {d.inputs?.length ?? 0} in
          </span>
          <span className="flex items-center gap-1">
            <ChevronRight className="h-2.5 w-2.5" />
            {d.outputs?.length ?? 0} out
          </span>
          {(() => {
            const dbArr = Array.isArray(d.db) ? d.db : (d.db ? [d.db] : []);
            return dbArr.length > 0 && (
              <span className="ml-auto text-primary/70">{dbArr.length} db</span>
            );
          })()}
        </div>
      </div>

      {/* Action bar — visible on hover/selected */}
      <div
        className={cn(
          "flex items-center justify-center border-t border-border/60 transition-all duration-150 overflow-hidden",
          hovered || selected ? "h-8 opacity-100" : "h-0 opacity-0"
        )}
      >
        {([
          { icon: Settings, label: "Configure", action: "configure" },
          { icon: Copy,     label: "Copy",      action: "copy" },
          { icon: Search,   label: "Inspect",   action: "inspect" },
          { icon: Trash2,   label: "Delete",    action: "delete", danger: true },
        ] as const).map(({ icon: Icon, label, action, danger }) => (
          <Tooltip key={action}>
            <TooltipTrigger asChild>
              <button
                aria-label={label}
                onClick={e => { e.stopPropagation(); handleNodeAction(action); }}
                className={cn(
                  "flex h-8 flex-1 items-center justify-center transition-colors nodrag",
                  (danger as boolean | undefined)
                    ? "text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!h-3 !w-3 !rounded-full !border-2 !bg-primary transition-all duration-150",
          selected || hovered ? "!border-primary !scale-125 !bg-primary" : "!border-primary/50 !bg-primary/40"
        )}
      />
    </div>
  );
});
