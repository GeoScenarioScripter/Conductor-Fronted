import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit2,
  Info,
  Copy,
  Check,
  Plus,
  Layers,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkflowSummary, WorkflowStatus } from "./types";

const initialWorkflows: WorkflowSummary[] = [
  {
    id: "wf-a1b2c3d4",
    name: "User Auth Pipeline",
    description: "Handles login, token refresh, and session management flows.",
    status: "active",
    nodeCount: 5,
    createdAt: "2025-02-10",
    updatedAt: "2025-03-01",
    baseUrl: "http://localhost:8080/api/wf-a1b2c3d4",
    thumbnail: "bg-gradient-to-br from-cyan-500 to-blue-600",
  },
  {
    id: "wf-e5f6g7h8",
    name: "Order Processing",
    description: "Orchestrates inventory check, payment, and fulfillment.",
    status: "active",
    nodeCount: 8,
    createdAt: "2025-02-18",
    updatedAt: "2025-03-05",
    baseUrl: "http://localhost:8080/api/wf-e5f6g7h8",
    thumbnail: "bg-gradient-to-br from-violet-500 to-purple-700",
  },
  {
    id: "wf-i9j0k1l2",
    name: "Analytics Aggregator",
    description: "Collects metrics from services and routes to the dashboard.",
    status: "draft",
    nodeCount: 3,
    createdAt: "2025-03-01",
    updatedAt: "2025-03-10",
    baseUrl: "http://localhost:8080/api/wf-i9j0k1l2",
    thumbnail: "bg-gradient-to-br from-emerald-400 to-teal-600",
  },
  {
    id: "wf-m3n4o5p6",
    name: "Notification Dispatcher",
    description: "Routes push/email/SMS triggers across microservices.",
    status: "archived",
    nodeCount: 4,
    createdAt: "2025-01-15",
    updatedAt: "2025-02-28",
    baseUrl: "http://localhost:8080/api/wf-m3n4o5p6",
    thumbnail: "bg-gradient-to-br from-orange-400 to-rose-600",
  },
];

const statusColors: Record<WorkflowStatus, string> = {
  active: "bg-green-500/15 text-green-400 border border-green-500/30",
  draft: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  archived: "bg-muted/50 text-muted-foreground border border-border",
};

const statusLabels: Record<WorkflowStatus, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

export default function WorkflowListPage() {
  const [workflows] = useState<WorkflowSummary[]>(initialWorkflows);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [detailWorkflow, setDetailWorkflow] = useState<WorkflowSummary | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const navigate = useNavigate();

  const itemsPerPage = 5; // 5 data cards + 1 add card = 6 grid slots
  const totalPages = Math.ceil(workflows.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentWorkflows = workflows.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleCopyUrl = (wf: WorkflowSummary) => {
    navigator.clipboard.writeText(wf.baseUrl);
    setCopiedId(wf.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Workflow Management
        </h2>
        <p className="text-muted-foreground">
          Create and manage your microservice orchestration workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* New Workflow add card — always first */}
        <div
          onClick={() => navigate("/workflow/new")}
          className="flex flex-col items-center justify-center min-h-[280px] rounded-lg border-2 border-dashed border-border/60 hover:border-primary/70 hover:bg-primary/5 cursor-pointer transition-all duration-300 group"
        >
          <div className="h-12 w-12 rounded-full border-2 border-dashed border-border/60 group-hover:border-primary/70 flex items-center justify-center mb-3 transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="font-semibold text-muted-foreground group-hover:text-primary transition-colors">
            New Workflow
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Click to create</p>
        </div>

        {/* Paginated workflow cards */}
        {currentWorkflows.map((wf) => (
          <Card
            key={wf.id}
            className="group overflow-hidden border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,240,255,0.1)] bg-card/50 backdrop-blur-sm hover:-translate-y-1"
          >
            {/* Thumbnail */}
            <div className={`h-36 w-full ${wf.thumbnail} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500" />
              {/* Status badge */}
              <div className="absolute top-3 right-3 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[wf.status]}`}>
                  {statusLabels[wf.status]}
                </span>
              </div>
              {/* Name + ID overlay */}
              <div className="absolute bottom-0 left-0 p-4 w-full bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white font-bold text-lg tracking-tight drop-shadow-md">
                  {wf.name}
                </h3>
                <p className="font-mono text-xs text-white/60 mt-0.5">
                  {wf.id.slice(0, 14)}...
                </p>
              </div>
            </div>

            <CardContent className="p-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    <Layers className="h-3.5 w-3.5" />
                    Nodes
                  </div>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {wf.nodeCount} Services
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    <Clock className="h-3.5 w-3.5" />
                    Updated
                  </div>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {wf.updatedAt}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => navigate(`/workflow/${wf.id}/edit`)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => { setDetailWorkflow(wf); setIsDetailOpen(true); }}
                >
                  <Info className="h-3.5 w-3.5" />
                  Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 px-3"
                  onClick={() => handleCopyUrl(wf)}
                  title="Copy base URL"
                >
                  {copiedId === wf.id
                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                    : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{detailWorkflow?.name}</DialogTitle>
            <DialogDescription>{detailWorkflow?.description}</DialogDescription>
          </DialogHeader>

          {detailWorkflow && (
            <div className="space-y-3 py-2">
              <div className="rounded-md border bg-muted/30 p-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono text-xs">{detailWorkflow.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[detailWorkflow.status]}`}>
                    {statusLabels[detailWorkflow.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> Nodes
                  </span>
                  <span className="font-mono">{detailWorkflow.nodeCount} Services</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Created
                  </span>
                  <span className="font-mono">{detailWorkflow.createdAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Updated
                  </span>
                  <span className="font-mono">{detailWorkflow.updatedAt}</span>
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Base URL</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs flex-1 truncate text-foreground">
                    {detailWorkflow.baseUrl}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 shrink-0"
                    onClick={() => handleCopyUrl(detailWorkflow)}
                  >
                    {copiedId === detailWorkflow.id
                      ? <Check className="h-3.5 w-3.5 text-green-500" />
                      : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
