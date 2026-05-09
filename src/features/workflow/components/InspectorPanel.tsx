import { AnimatePresence, motion } from "framer-motion";
import { type Node, type Edge } from "@xyflow/react";
import {
  Info, ArrowRight, ChevronDown, ChevronRight,
  PanelRightClose, Settings2,
} from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useMethodDetail } from "@/hooks/use-workflow-metadata";
import type { MicroserviceNodeData, NodeStatus } from "../types";

interface InspectorPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  nodes: Node[];
  onEditMapping: (edgeId: string) => void;
  onClose: () => void;
}

const panelVariants = {
  hidden: { opacity: 0, x: 16 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit:   { opacity: 0, x: 16, transition: { duration: 0.15 } },
};

export function InspectorPanel({
  selectedNode,
  selectedEdge,
  nodes,
  onEditMapping,
  onClose,
}: InspectorPanelProps) {
  return (
    <div className="w-72 flex-shrink-0 border-l border-border bg-card/60 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Inspector
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClose}
              aria-label="Close inspector"
              className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Close inspector</TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="flex-1">
        <AnimatePresence mode="wait">
          {selectedNode ? (
            <motion.div key="node" variants={panelVariants} initial="hidden" animate="show" exit="exit">
              <NodeInspector node={selectedNode} />
            </motion.div>
          ) : selectedEdge ? (
            <motion.div key="edge" variants={panelVariants} initial="hidden" animate="show" exit="exit">
              <EdgeInspector edge={selectedEdge} nodes={nodes} onEditMapping={onEditMapping} />
            </motion.div>
          ) : (
            <motion.div key="empty" variants={panelVariants} initial="hidden" animate="show" exit="exit">
              <EmptyInspector />
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}

/* ── Empty state ── */
function EmptyInspector() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Info className="h-8 w-8 text-muted-foreground/30 mb-3" />
        <p className="text-xs font-medium text-foreground/60">Nothing selected</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Click a node or edge to inspect it
        </p>
      </div>
      <Separator />
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Canvas Tips</p>
        <p className="text-[11px] text-muted-foreground">• Drag methods from the left panel</p>
        <p className="text-[11px] text-muted-foreground">• Connect nodes by dragging handles</p>
        <p className="text-[11px] text-muted-foreground">• Right-click a node for options</p>
        <p className="text-[11px] text-muted-foreground">• Click edge ⚙ to configure mapping</p>
      </div>
    </div>
  );
}

/* ── Node inspector ── */
function NodeInspector({ node }: { node: Node }) {
  const d = node.data as unknown as MicroserviceNodeData;
  const status = (d.status ?? "idle") as NodeStatus;

  const { data: methodDetail, isLoading } = useMethodDetail(
    d.appName ?? "",
    d.serviceName ?? "",
    d.methodName ?? ""
  );

  return (
    <div className="p-4 space-y-4">
      {/* Identity */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} size="sm" />
          <span className="text-xs text-muted-foreground">{d.appName}</span>
        </div>
        <p className="text-sm font-semibold text-foreground">{d.label ?? d.methodName}</p>
        {d.serviceName && (
          <p className="text-[11px] text-muted-foreground font-mono">{d.serviceName}</p>
        )}
        {d.description && (
          <p className="text-[11px] text-muted-foreground mt-1">{d.description}</p>
        )}
      </div>
      <Separator />

      {/* Parameters */}
      {isLoading && <div className="h-16 rounded bg-muted animate-pulse" />}
      {methodDetail && (
        <>
          <FieldTree label="Input Parameters" nodes={methodDetail.parameters ?? []} />
          <FieldTree label="Return Type" nodes={methodDetail.responses ?? []} />
        </>
      )}
      {!isLoading && !methodDetail && d.appName && d.serviceName && d.methodName && (
        <p className="text-[11px] text-muted-foreground">Could not load method details</p>
      )}

      {/* DB bindings */}
      {(() => {
        const dbArr = Array.isArray(d.db) ? d.db : (d.db ? [d.db] : []);
        return dbArr.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                DB Bindings
              </p>
              <div className="flex flex-wrap gap-1">
                {dbArr.map(db => (
                  <span key={db} className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5">
                    {db}
                  </span>
                ))}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

/* ── Edge inspector ── */
function EdgeInspector({
  edge,
  nodes,
  onEditMapping,
}: {
  edge: Edge;
  nodes: Node[];
  onEditMapping: (id: string) => void;
}) {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  const mappings = (edge.data as any)?.mappings ?? [];
  const explanation = (edge.data as any)?.explanation ?? "";

  const srcLabel = (sourceNode?.data as any)?.label ?? edge.source;
  const tgtLabel = (targetNode?.data as any)?.label ?? edge.target;

  return (
    <div className="p-4 space-y-4">
      {/* Connection */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Connection
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground truncate max-w-[100px]">{srcLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="font-medium text-foreground truncate max-w-[100px]">{tgtLabel}</span>
        </div>
        {explanation && (
          <p className="text-[11px] text-muted-foreground mt-1 italic">"{explanation}"</p>
        )}
      </div>
      <Separator />

      {/* Mappings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Field Mappings ({mappings.length})
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[10px] gap-1"
            onClick={() => onEditMapping(edge.id)}
          >
            <Settings2 className="h-2.5 w-2.5" />
            Edit
          </Button>
        </div>
        {mappings.length === 0 ? (
          <div className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5">
            <p className="text-[11px] text-amber-400">No mappings configured</p>
          </div>
        ) : (
          <div className="space-y-1">
            {mappings.map((m: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 rounded bg-muted/40 px-2 py-1">
                <span className="text-[10px] font-mono text-foreground/70 truncate flex-1">{m.sourceField}</span>
                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
                <span className="text-[10px] font-mono text-primary/80 truncate flex-1">{m.targetField}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Field tree ── */
function FieldTree({ label, nodes }: { label: string; nodes: unknown[] }) {
  if (!nodes || nodes.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {nodes.map((node: any, i) => (
          <FieldNode key={i} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}

function FieldNode({ node, depth }: { node: any; depth: number }) {
  const [open, setOpen] = useState(false);
  const name = node.name ?? node.fieldName ?? node.returnTypeName ?? `field_${depth}`;
  const type = typeof node.type === "string" ? node.type.split(".").slice(-1)[0] : "";
  const hasChildren = Array.isArray(node.fields) && node.fields.length > 0;

  return (
    <div className={cn("", depth > 0 && "ml-3 border-l border-border/30 pl-2")}>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px]",
          hasChildren && "cursor-pointer hover:bg-accent"
        )}
        onClick={() => hasChildren && setOpen(o => !o)}
      >
        {hasChildren && (
          open
            ? <ChevronDown className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
        )}
        {!hasChildren && <span className="w-2.5 flex-shrink-0" />}
        <span className="font-mono text-foreground/80">{name}</span>
        {type && type !== name && (
          <span className="text-muted-foreground/60 ml-auto flex-shrink-0">{type}</span>
        )}
      </div>
      {hasChildren && open && (
        <div className="mt-0.5">
          {node.fields.map((child: any, i: number) => (
            <FieldNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
