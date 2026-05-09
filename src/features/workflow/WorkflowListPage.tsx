import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Edit2, Info, Copy, Check, Plus,
  Layers, Clock, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GlassPanel } from "@/components/ui/glass-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import type { WorkflowSummary, WorkflowStatus } from "./types";
import { useWorkflows } from "@/hooks/use-workflow";

function extractWorkflowList(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown>;
  for (const key of ["definitions", "data", "list", "records", "content", "items", "result"]) {
    if (Array.isArray(r[key])) return r[key] as unknown[];
  }
  if (typeof r === "object" && (r.workflowDefId || r.workflowName || r.dagDefinition || r.id)) {
    return [r];
  }
  return [];
}

const gradientByStatus: Record<WorkflowStatus, string> = {
  active:   "from-sky-500 to-cyan-600",
  draft:    "from-violet-500 to-purple-700",
  archived: "from-slate-500 to-slate-700",
};

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function WorkflowListPage() {
  const { data, isLoading, error } = useWorkflows();
  const [currentPage,    setCurrentPage]    = useState(1);
  const [copiedId,       setCopiedId]       = useState<string | null>(null);
  const [detailWorkflow, setDetailWorkflow] = useState<WorkflowSummary | null>(null);
  const navigate = useNavigate();

  const workflows = useMemo<WorkflowSummary[]>(() => {
    return extractWorkflowList(data).filter(Boolean).map((wf: any) => {
      const raw = String(wf.status || "").toUpperCase();
      const status: WorkflowStatus =
        raw === "ACTIVE" ? "active" : raw === "ARCHIVED" ? "archived" : "draft";
      return {
        id:          String(wf.id ?? wf.workflowDefId ?? ""),
        name:        String(wf.name ?? wf.workflowName ?? "Untitled"),
        description: String(wf.description ?? wf.workflowDescription ?? ""),
        status,
        nodeCount:   Number(wf.nodeCount ?? wf.dagDefinition?.nodes?.length ?? 0),
        createdAt:   wf.createdAt ? String(wf.createdAt).slice(0, 10) : "—",
        updatedAt:   wf.updatedAt ? String(wf.updatedAt).slice(0, 10) : "—",
        baseUrl:     String(wf.baseUrl ?? wf.workflowDefId ?? ""),
        thumbnail:   "",
      } satisfies WorkflowSummary;
    });
  }, [data]);

  const ITEMS = 5;
  const totalPages = Math.max(1, Math.ceil(workflows.length / ITEMS));
  const slice = workflows.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);

  const handleCopy = (wf: WorkflowSummary) => {
    navigator.clipboard.writeText(wf.baseUrl);
    setCopiedId(wf.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Workflows"
          subtitle="Visual DAG orchestration for your microservices"
          actions={
            <Button size="sm" onClick={() => navigate("/workflow/new")}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Workflow
            </Button>
          }
        />
      </motion.div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />)}
        </div>
      )}

      {error && (
        <GlassPanel className="p-4 text-sm text-destructive">
          Failed to load workflows: {error instanceof Error ? error.message : "unknown error"}
        </GlassPanel>
      )}

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* New card */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => navigate("/workflow/new")}
            className="flex flex-col items-center justify-center min-h-[240px] rounded-lg border-2 border-dashed border-border/50 hover:border-primary/60 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
          >
            <div className="h-10 w-10 rounded-full border-2 border-dashed border-border/50 group-hover:border-primary/60 flex items-center justify-center mb-3 transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">
              New Workflow
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">Create from scratch</p>
          </motion.div>

          {slice.map(wf => (
            <motion.div key={wf.id} whileHover={{ y: -3 }}>
              <GlassPanel className="overflow-hidden hover:border-primary/30 transition-all duration-200 h-full flex flex-col">
                {/* Gradient header */}
                <div className={`h-28 bg-gradient-to-br ${gradientByStatus[wf.status]} relative`}>
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={wf.status} size="sm" />
                  </div>
                  <div className="absolute bottom-0 left-0 p-4 w-full bg-gradient-to-t from-black/70 to-transparent">
                    <h3 className="text-white font-semibold text-base leading-tight">{wf.name}</h3>
                    <p className="text-white/50 font-mono text-[10px] mt-0.5 truncate">{wf.id.slice(0, 16)}…</p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  {wf.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{wf.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Layers className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{wf.nodeCount} nodes</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{wf.updatedAt}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-auto">
                    <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={() => navigate(`/workflow/${wf.id}/edit`)}>
                      <Edit2 className="h-3 w-3" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDetailWorkflow(wf)}>
                      <Info className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleCopy(wf)}>
                      {copiedId === wf.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {!isLoading && !error && workflows.length === 0 && (
        <motion.div variants={itemVariants}>
          <GlassPanel className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No workflows yet. Create your first workflow to get started.</p>
          </GlassPanel>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div variants={itemVariants} className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detailWorkflow} onOpenChange={o => !o && setDetailWorkflow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{detailWorkflow?.name}</DialogTitle>
            <DialogDescription>{detailWorkflow?.description}</DialogDescription>
          </DialogHeader>
          {detailWorkflow && (
            <div className="space-y-3 py-1">
              <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
                {[
                  ["ID",      detailWorkflow.id],
                  ["Nodes",   `${detailWorkflow.nodeCount}`],
                  ["Created", detailWorkflow.createdAt],
                  ["Updated", detailWorkflow.updatedAt],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono text-xs">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
