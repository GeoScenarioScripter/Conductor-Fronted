import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, FolderGit2, ChevronRight, Layers, Server,
  GitMerge, PackageCheck, Rocket, AlertTriangle,
  CheckCircle2, Clock, Database,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProjects, useMergeAnalysis, useMergeStatus, useDeployProject } from "@/hooks/use-projects";
import type { ProjectItem, MergeAnalysisResult, MergeStatus } from "@/services/projects.service";

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

type Stage = "services" | "conflicts" | "merge" | "deploy";

const STAGES: { key: Stage; label: string; icon: React.ElementType; description: string }[] = [
  { key: "services",  label: "Service Aggregation", icon: Server,       description: "Add services & workflows" },
  { key: "conflicts", label: "Conflict Analysis",   icon: GitMerge,     description: "Analyze DB schema conflicts" },
  { key: "merge",     label: "Merge Planning",      icon: Database,     description: "Configure DB layout" },
  { key: "deploy",    label: "Deploy & Package",    icon: PackageCheck, description: "Deploy containers & export" },
];

function inferStage(project: ProjectItem): number {
  const s = (project.status ?? "").toUpperCase();
  if (s === "DEPLOYED") return 3;
  if (s === "READY")    return 2;
  return 0;
}

export default function ProjectsPage() {
  const { data: raw, isLoading, error } = useProjects();
  const [selected, setSelected] = useState<ProjectItem | null>(null);
  const [activeStage, setActiveStage] = useState<Stage>("services");

  const projects: ProjectItem[] = Array.isArray(raw) ? raw :
    Array.isArray((raw as any)?.data) ? (raw as any).data :
    Array.isArray((raw as any)?.list) ? (raw as any).list : [];

  const stageIndex = selected ? inferStage(selected) : -1;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="h-full flex flex-col gap-6">
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Projects"
          subtitle="Orchestrate services, data, and deployments into deliverable sub-applications"
          actions={<Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" />New Project</Button>}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="flex-1 flex gap-4 min-h-0">
        {/* Left: project list */}
        <GlassPanel className="w-72 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Projects</p>
          </div>
          <ScrollArea className="flex-1">
            {isLoading && <div className="p-3 space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded bg-muted animate-pulse" />)}</div>}
            {error && <p className="p-4 text-xs text-muted-foreground">Failed to load projects</p>}
            {!isLoading && projects.length === 0 && (
              <div className="p-6 text-center">
                <FolderGit2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No projects yet</p>
              </div>
            )}
            <div className="p-2 space-y-1">
              {projects.map(p => {
                const isActive = selected?.id === p.id;
                const stage = inferStage(p);
                return (
                  <button key={p.id} onClick={() => { setSelected(p); setActiveStage("services"); }}
                    className={cn("w-full text-left flex items-start gap-2.5 rounded-md px-2.5 py-2.5 border transition-colors",
                      isActive ? "bg-primary/10 border-primary/30" : "border-transparent hover:bg-accent")}>
                    <div className={cn("mt-0.5 flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0", isActive ? "bg-primary/15" : "bg-muted")}>
                      <FolderGit2 className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium truncate", isActive ? "text-primary" : "text-foreground")}>{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusBadge
                          status={p.status === "DEPLOYED" ? "deployed" : p.status === "READY" ? "ready" : "draft"}
                          size="sm"
                        />
                        <span className="text-[10px] text-muted-foreground">Stage {stage + 1}/4</span>
                      </div>
                    </div>
                    {isActive && <ChevronRight className="h-3 w-3 text-primary mt-1 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </GlassPanel>

        {/* Right: detail */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <GlassPanel className="h-full flex flex-col items-center justify-center text-center p-8">
              <FolderGit2 className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-foreground">Select a project</p>
              <p className="text-xs text-muted-foreground mt-1">Click a project to manage its lifecycle</p>
            </GlassPanel>
          ) : (
            <ProjectDetail project={selected} stageIndex={stageIndex} activeStage={activeStage} setActiveStage={setActiveStage} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Project detail ── */
function ProjectDetail({ project, stageIndex, activeStage, setActiveStage }: {
  project: ProjectItem;
  stageIndex: number;
  activeStage: Stage;
  setActiveStage: (s: Stage) => void;
}) {
  const deployMutation = useDeployProject();

  return (
    <GlassPanel className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
          <FolderGit2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{project.name}</h2>
            <StatusBadge status={project.status === "DEPLOYED" ? "deployed" : project.status === "READY" ? "ready" : "draft"} size="sm" />
          </div>
          {project.description && <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>}
        </div>
        <Button size="sm" className="h-7 px-3 text-xs gap-1.5 flex-shrink-0"
          onClick={() => deployMutation.mutate(project.id)}
          disabled={deployMutation.isPending}>
          <Rocket className="h-3 w-3" />
          {deployMutation.isPending ? "Deploying…" : "Deploy"}
        </Button>
      </div>

      {/* Stage progress */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-0">
          {STAGES.map((stage, i) => {
            const isDone    = i < stageIndex;
            const isCurrent = i === stageIndex;
            return (
              <div key={stage.key} className="flex items-center flex-1">
                <button onClick={() => setActiveStage(stage.key)}
                  className={cn("flex flex-col items-center gap-1 flex-1 transition-all", activeStage === stage.key ? "opacity-100" : "opacity-60 hover:opacity-80")}>
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-full border transition-all",
                    isDone    ? "bg-emerald-400/20 border-emerald-400/50 text-emerald-400" :
                    isCurrent ? "bg-primary/20 border-primary/50 text-primary" :
                                "bg-muted border-border text-muted-foreground")}>
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <stage.icon className="h-3.5 w-3.5" />}
                  </div>
                  <p className={cn("text-[10px] font-medium text-center leading-tight", isDone ? "text-emerald-400" : isCurrent ? "text-primary" : "text-muted-foreground")}>
                    {stage.label}
                  </p>
                </button>
                {i < STAGES.length - 1 && <div className={cn("h-px w-6 flex-shrink-0 transition-colors", isDone ? "bg-emerald-400/40" : "bg-border")} />}
              </div>
            );
          })}
        </div>
        <Progress value={((stageIndex + 1) / STAGES.length) * 100} className="mt-3 h-1" />
      </div>

      {/* Stage content */}
      <ScrollArea className="flex-1">
        <Tabs value={activeStage} onValueChange={v => setActiveStage(v as Stage)} className="p-5">
          <TabsList className="mb-4 w-full">
            {STAGES.map(s => <TabsTrigger key={s.key} value={s.key} className="flex-1 text-[11px]">{s.label}</TabsTrigger>)}
          </TabsList>

          <TabsContent value="services">
            <ServiceAggregationTab project={project} />
          </TabsContent>
          <TabsContent value="conflicts">
            <ConflictAnalysisTab projectId={project.id} />
          </TabsContent>
          <TabsContent value="merge">
            <MergePlanTab projectId={project.id} />
          </TabsContent>
          <TabsContent value="deploy">
            <DeployTab projectId={project.id} />
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </GlassPanel>
  );
}

function ServiceAggregationTab({ project }: { project: ProjectItem }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-muted/20 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Services</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{project.serviceCount ?? "—"}</p>
        </div>
        <div className="rounded-md border border-border bg-muted/20 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Workflows</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{project.workflowCount ?? "—"}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Server className="h-3.5 w-3.5" />Add Service</Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Layers className="h-3.5 w-3.5" />Add Workflow</Button>
      </div>
      <Separator />
      <p className="text-xs text-muted-foreground">No services configured yet. Add services or workflows to aggregate.</p>
    </div>
  );
}

function ConflictAnalysisTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useMergeAnalysis(projectId);

  if (isLoading) return <div className="h-24 rounded bg-muted animate-pulse" />;
  if (!data) return <p className="text-xs text-muted-foreground">Run conflict analysis to see results here.</p>;

  const analysis = data as MergeAnalysisResult;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-center">
          <p className="text-lg font-semibold text-emerald-400">{analysis.noConflict?.length ?? 0}</p>
          <p className="text-[10px] text-muted-foreground">No Conflict</p>
        </div>
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5 text-center">
          <p className="text-lg font-semibold text-amber-400">{analysis.scenarioA?.length ?? 0}</p>
          <p className="text-[10px] text-muted-foreground">Scenario A</p>
        </div>
        <div className="rounded-md border border-red-500/20 bg-red-500/5 p-2.5 text-center">
          <p className="text-lg font-semibold text-red-400">{analysis.scenarioB?.length ?? 0}</p>
          <p className="text-[10px] text-muted-foreground">Scenario B</p>
        </div>
      </div>
      {(analysis.scenarioB?.length ?? 0) > 0 && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <p className="text-xs font-medium text-red-400">Scenario B Conflicts (DDL Mismatch)</p>
          </div>
          {analysis.scenarioB.map((item, i) => (
            <div key={i} className="rounded border border-border bg-muted/20 p-2 mb-1.5 last:mb-0">
              <p className="text-xs font-mono font-medium">{item.tableName}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Modules: {Object.keys(item.hashes || {}).join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MergePlanTab({ projectId }: { projectId: string }) {
  const { data } = useMergeStatus(projectId);
  const status = data as MergeStatus | undefined;
  return (
    <div className="space-y-4">
      {!status ? (
        <p className="text-xs text-muted-foreground">Submit a merge plan to configure the DB layout.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Databases</p>
          {status.targetDatabases?.map((db, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-2.5">
              <span className="text-xs font-mono">{db.dbName}</span>
              <StatusBadge status={db.status?.toLowerCase() as any ?? "pending"} size="sm" />
            </div>
          ))}
          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Module Data Status</p>
          {status.moduleDataStatus?.map((mod, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-2.5">
              <span className="text-xs font-mono">{mod.appName}</span>
              <div className="flex items-center gap-1.5">
                {mod.hasData ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Clock className="h-3.5 w-3.5 text-amber-400" />}
                <span className="text-[10px] text-muted-foreground">{mod.hasData ? "Ready" : "Awaiting"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeployTab({ projectId }: { projectId: string }) {
  const { data: instances, isLoading } = useProjectInstances?.(projectId) ?? { data: null, isLoading: false };
  const instanceList = Array.isArray(instances) ? instances : [];
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => alert("Deploy — integrate with API")}>
          <Rocket className="h-3.5 w-3.5" /> Deploy Project
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => alert("Package — open package wizard")}>
          <PackageCheck className="h-3.5 w-3.5" /> Package
        </Button>
      </div>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Instances</p>
      {isLoading && <div className="h-12 rounded bg-muted animate-pulse" />}
      {!isLoading && instanceList.length === 0 && <p className="text-xs text-muted-foreground">No instances deployed yet.</p>}
      {instanceList.map((inst: any, i: number) => (
        <div key={i} className="rounded-md border border-border bg-muted/20 p-2.5 text-xs">
          {JSON.stringify(inst)}
        </div>
      ))}
    </div>
  );
}
