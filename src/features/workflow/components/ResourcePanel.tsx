import { type DragEvent, useState } from "react";
import { Search, ChevronRight, ChevronDown, Box, GripVertical, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useApplicationsMetadata,
  useApplicationServices,
  useServiceDetail,
} from "@/hooks/use-workflow-metadata";
import type { ApplicationMeta } from "@/services/workflow-metadata.service";

interface ResourcePanelProps {
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}

export function ResourcePanel({ collapsed, onCollapseToggle }: ResourcePanelProps) {
  const { data: apps = [], isLoading, error } = useApplicationsMetadata();
  const [search, setSearch] = useState("");

  const onDragStart = (event: DragEvent, nodeData: object) => {
    event.dataTransfer.setData("application/reactflow", "microapplication");
    event.dataTransfer.setData("application/nodedata", JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = "move";
  };

  const appList = Array.isArray(apps)
    ? apps.filter(a => !search || a.applicationName.toLowerCase().includes(search.toLowerCase()))
    : [];

  if (collapsed) {
    return (
      <div className="w-14 border-r border-border bg-card/60 flex flex-col items-center py-3 gap-2 flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onCollapseToggle}
              aria-label="Expand resource panel"
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand panel</TooltipContent>
        </Tooltip>
        {appList.slice(0, 8).map(app => (
          <Tooltip key={app.applicationName}>
            <TooltipTrigger asChild>
              <div className="h-7 w-7 flex items-center justify-center rounded bg-muted text-muted-foreground text-[10px] font-bold">
                {app.applicationName[0]?.toUpperCase() ?? "?"}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">{app.applicationName}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div className="w-64 flex-shrink-0 border-r border-border bg-card/60 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Services
        </span>
        <button
          onClick={onCollapseToggle}
          aria-label="Collapse resource panel"
          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Filter services…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-7 pl-7 text-xs bg-background/50"
          />
        </div>
      </div>

      {/* App tree */}
      <ScrollArea className="flex-1">
        {isLoading && (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
          </div>
        )}
        {error && (
          <div className="p-3 text-xs text-muted-foreground">Failed to load — is Nacos running?</div>
        )}
        {!isLoading && appList.length === 0 && (
          <div className="p-4 text-xs text-muted-foreground text-center">
            {search ? "No matches" : "No applications discovered"}
          </div>
        )}
        <div className="p-2">
          {appList.map(app => (
            <AppNode key={app.applicationName} app={app} onDragStart={onDragStart} />
          ))}
        </div>
      </ScrollArea>

      {/* Footer count */}
      <div className="px-3 py-2 border-t border-border/50 text-[10px] text-muted-foreground text-center">
        {appList.length} application{appList.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

/* ── App node (collapsible) ── */
function AppNode({
  app,
  onDragStart,
}: {
  app: ApplicationMeta;
  onDragStart: (e: DragEvent, data: object) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: services, isLoading } = useApplicationServices(open ? app.applicationName : "");
  const svcList = Array.isArray(services) ? services : [];

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors text-left"
      >
        {open
          ? <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
        <Box className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
        <span className="text-xs font-medium text-foreground truncate flex-1">{app.applicationName}</span>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">{app.serviceCount ?? 0}</span>
      </button>

      {open && (
        <div className="ml-4 border-l border-border/40 pl-2 mt-0.5 space-y-0.5">
          {isLoading && <div className="h-6 rounded bg-muted animate-pulse my-1" />}
          {svcList.map(svc => (
            <ServiceNode
              key={svc.serviceName}
              appName={app.applicationName}
              serviceName={svc.serviceName}
              methodCount={svc.methodCount ?? 0}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Service node (collapsible) ── */
function ServiceNode({
  appName,
  serviceName,
  methodCount,
  onDragStart,
}: {
  appName: string;
  serviceName: string;
  methodCount: number;
  onDragStart: (e: DragEvent, data: object) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: detail, isLoading } = useServiceDetail(open ? appName : "", open ? serviceName : "");

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 rounded px-2 py-1 hover:bg-accent transition-colors text-left"
      >
        {open
          ? <ChevronDown className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />}
        <span className="text-[11px] text-foreground/80 truncate flex-1">{serviceName}</span>
        <span className="text-[10px] text-muted-foreground">{methodCount}</span>
      </button>

      {open && (
        <div className="ml-3 border-l border-border/30 pl-2 mt-0.5 space-y-0.5">
          {isLoading && <div className="h-5 rounded bg-muted animate-pulse" />}
          {detail?.methods?.map(m => (
            <div
              key={m.methodName}
              draggable
              onDragStart={e =>
                onDragStart(e, {
                  label:       m.methodName,
                  appName,
                  serviceName,
                  methodName:  m.methodName,
                  description: m.description ?? "",
                })
              }
              className="flex items-center gap-1.5 rounded px-2 py-1 cursor-grab hover:bg-primary/10 hover:text-primary transition-colors group"
            >
              <GripVertical className="h-2.5 w-2.5 text-muted-foreground/50 flex-shrink-0 group-hover:text-primary/60" />
              <span className="text-[11px] font-mono truncate flex-1">{m.methodName}</span>
            </div>
          ))}
          {!isLoading && (!detail?.methods || detail.methods.length === 0) && (
            <p className="px-2 py-0.5 text-[10px] text-muted-foreground">No methods</p>
          )}
        </div>
      )}
    </div>
  );
}
