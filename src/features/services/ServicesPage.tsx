import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Server, Upload, ChevronRight,
  Code2, Database, FileText, Layers,
  Activity, Box, RefreshCw,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useApplicationsMetadata,
  useApplicationServices,
  useServiceDetail,
} from "@/hooks/use-workflow-metadata";
import type { ApplicationMeta, ServiceMeta } from "@/services/workflow-metadata.service";
import { UploadWizard } from "./components/UploadWizard";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function ServicesPage() {
  const { data: apps, isLoading, error } = useApplicationsMetadata();
  const [search,      setSearch]      = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicationMeta | null>(null);
  const [uploadOpen,  setUploadOpen]  = useState(false);

  const appList: ApplicationMeta[] = Array.isArray(apps) ? apps : [];

  const filtered = appList.filter(a =>
    a.applicationName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="h-full flex flex-col gap-6">
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Services"
          subtitle="Manage discovered microapplication modules"
          actions={
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload JAR
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={itemVariants} className="flex-1 flex gap-4 min-h-0">
        {/* Left: App list */}
        <GlassPanel className="w-72 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background/50"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {isLoading && (
              <div className="p-3 space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />)}
              </div>
            )}
            {error && (
              <div className="p-4 text-xs text-muted-foreground text-center">
                <AlertIcon /> Failed to load applications
              </div>
            )}
            {!isLoading && !error && filtered.length === 0 && (
              <div className="p-6 text-xs text-muted-foreground text-center">
                {search ? "No matches found" : "No applications discovered yet"}
              </div>
            )}
            <div className="p-2 space-y-1">
              {filtered.map(app => {
                const isActive = selectedApp?.applicationName === app.applicationName;
                return (
                  <button
                    key={app.applicationName}
                    onClick={() => setSelectedApp(app)}
                    className={cn(
                      "w-full text-left flex items-center gap-3 rounded-md px-2.5 py-3 transition-colors border",
                      isActive
                        ? "bg-primary/10 border-primary/30"
                        : "border-transparent hover:bg-accent"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md flex-shrink-0",
                      isActive ? "bg-primary/15" : "bg-muted"
                    )}>
                      <Box className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium truncate", isActive ? "text-primary" : "text-foreground")}>
                        {app.applicationName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {app.serviceCount ?? 0} service{(app.serviceCount ?? 0) !== 1 ? "s" : ""}
                        {app.instances?.length ? ` · ${app.instances.length} instance${app.instances.length > 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {(app.instances?.length ?? 0) > 0
                        ? <StatusBadge status="online" size="sm" />
                        : <StatusBadge status="offline" size="sm" />}
                      {isActive && <ChevronRight className="h-3 w-3 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
          <div className="p-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              {appList.length} application{appList.length !== 1 ? "s" : ""} discovered
            </p>
          </div>
        </GlassPanel>

        {/* Right: Detail */}
        <div className="flex-1 min-w-0">
          {!selectedApp ? (
            <GlassPanel className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Server className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Select an application</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click any application on the left to view its services and methods
              </p>
            </GlassPanel>
          ) : (
            <AppDetail app={selectedApp} />
          )}
        </div>
      </motion.div>

      {/* Upload Sheet */}
      <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Upload JAR Package</SheetTitle>
          </SheetHeader>
          <Separator className="mt-4" />
          <div className="p-6">
            <UploadWizard />
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

/* ── App Detail ── */
function AppDetail({ app }: { app: ApplicationMeta }) {
  const { data: services, isLoading } = useApplicationServices(app.applicationName);
  const [selectedSvc, setSelectedSvc] = useState<ServiceMeta | null>(null);

  const svcList: ServiceMeta[] = Array.isArray(services) ? services : [];

  return (
    <GlassPanel className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-foreground">{app.applicationName}</h2>
            {(app.instances?.length ?? 0) > 0
              ? <StatusBadge status="online" size="sm" />
              : <StatusBadge status="offline" size="sm" />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{app.serviceCount ?? 0} services</span>
            {app.instances?.length ? (
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {app.instances.join(", ")}
              </span>
            ) : null}
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1 flex-shrink-0">
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      {/* Services + method detail */}
      <div className="flex flex-1 min-h-0">
        {/* Service list */}
        <div className="w-56 border-r border-border flex flex-col flex-shrink-0">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border">
            Services
          </p>
          <ScrollArea className="flex-1">
            {isLoading && (
              <div className="p-3 space-y-2">
                {[1,2].map(i => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
              </div>
            )}
            <div className="p-2 space-y-1">
              {svcList.map(svc => {
                const isSelected = selectedSvc?.serviceName === svc.serviceName;
                return (
                  <button
                    key={svc.serviceName}
                    onClick={() => setSelectedSvc(svc)}
                    className={cn(
                      "w-full text-left rounded-md px-2.5 py-2 text-xs transition-colors border",
                      isSelected
                        ? "bg-secondary/10 border-secondary/30 text-secondary"
                        : "border-transparent text-foreground/80 hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <p className="font-medium truncate">{svc.serviceName}</p>
                    <p className="text-[10px] text-muted-foreground">{svc.methodCount ?? 0} methods</p>
                  </button>
                );
              })}
              {!isLoading && svcList.length === 0 && (
                <p className="px-2.5 py-2 text-[11px] text-muted-foreground">No services found</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Service detail */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {!selectedSvc ? (
            <div className="flex h-full items-center justify-center text-center p-6">
              <div>
                <Code2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Select a service to view its methods</p>
              </div>
            </div>
          ) : (
            <ServiceMethodView
              appName={app.applicationName}
              service={selectedSvc}
            />
          )}
        </div>
      </div>
    </GlassPanel>
  );
}

/* ── Service method view ── */
function ServiceMethodView({ appName, service }: { appName: string; service: ServiceMeta }) {
  const { data: detail, isLoading } = useServiceDetail(appName, service.serviceName);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Service meta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{service.serviceName}</p>
            {service.version && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{service.version}</Badge>
            )}
          </div>
          {service.interfaceClass && (
            <p className="text-[10px] text-muted-foreground font-mono break-all">{service.interfaceClass}</p>
          )}
        </div>
        <Separator />

        {/* Methods */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Methods</p>
          {isLoading && (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}
            </div>
          )}
          <div className="space-y-2">
            {detail?.methods?.map(m => (
              <div key={m.methodName} className="rounded-md border border-border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground font-mono">{m.methodName}()</p>
                    {m.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{m.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {m.parameterCount ?? 0} params
                    </span>
                    {m.returnType && (
                      <span className="font-mono truncate max-w-24">{m.returnType.split(".").slice(-1)[0]}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!isLoading && (!detail?.methods || detail.methods.length === 0) && (
              <p className="text-xs text-muted-foreground">No methods found</p>
            )}
          </div>
        </div>

        {/* Schema placeholder */}
        <Separator />
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            DB Schema
          </p>
          <div className="rounded-md border border-border bg-muted/20 p-3 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Run module discovery to extract DDL schema
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function AlertIcon() {
  return <span className="inline-block mr-1">⚠</span>;
}
