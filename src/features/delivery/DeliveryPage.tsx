import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download, Package, GitBranch, Layers, Calendar,
  Rocket, Box, Cloud, CheckCircle2, ChevronLeft,
  ChevronRight, FileCode2, HardDrive, Database, Loader2,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/use-projects";
import { usePackagePreview, useStartPackage, usePackageTaskStatus } from "@/hooks/use-projects";
import type { ProjectItem } from "@/services/projects.service";

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } };

const gradients = [
  "from-sky-500 to-cyan-600",
  "from-violet-500 to-purple-700",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-700",
  "from-amber-500 to-orange-600",
  "from-indigo-500 to-blue-700",
];

const ITEMS_PER_PAGE = 6;

export default function DeliveryPage() {
  const { data: raw, isLoading } = useProjects();
  const [currentPage, setCurrentPage] = useState(1);
  const [deployProject, setDeployProject] = useState<ProjectItem | null>(null);

  const projects: ProjectItem[] = Array.isArray(raw) ? raw :
    Array.isArray((raw as any)?.data) ? (raw as any).data : [];

  // For demo: use mock data if no projects from API
  const displayProjects = projects.length > 0 ? projects : mockProjects;

  const totalPages = Math.max(1, Math.ceil(displayProjects.length / ITEMS_PER_PAGE));
  const slice = displayProjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Delivery"
          subtitle="Manage and deploy packaged sub-applications"
        />
      </motion.div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-72 rounded-lg bg-muted animate-pulse" />)}
        </div>
      )}

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {slice.map((project, idx) => (
            <DeliveryCard
              key={project.id}
              project={project}
              gradient={gradients[idx % gradients.length]}
              onDeploy={() => setDeployProject(project)}
            />
          ))}
        </div>
      </motion.div>

      {!isLoading && displayProjects.length === 0 && (
        <motion.div variants={itemVariants}>
          <GlassPanel className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium">No deliverable applications yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create and deploy a project to see it here</p>
          </GlassPanel>
        </motion.div>
      )}

      {totalPages > 1 && (
        <motion.div variants={itemVariants} className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Deploy dialog */}
      {deployProject && (
        <DeployDialog
          project={deployProject}
          onClose={() => setDeployProject(null)}
        />
      )}
    </motion.div>
  );
}

/* ── Delivery Card ── */
function DeliveryCard({ project, gradient, onDeploy }: {
  project: ProjectItem; gradient: string; onDeploy: () => void;
}) {
  const status = project.status === "DEPLOYED" ? "deployed" : project.status === "READY" ? "ready" : "draft";
  return (
    <motion.div whileHover={{ y: -4 }}>
      <GlassPanel className="overflow-hidden hover:border-primary/30 transition-all duration-200 flex flex-col">
        {/* Gradient cover */}
        <div className={`h-32 bg-gradient-to-br ${gradient} relative`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute top-3 right-3">
            <StatusBadge status={status} size="sm" />
          </div>
          <div className="absolute bottom-0 left-0 p-4 w-full bg-gradient-to-t from-black/70 to-transparent">
            <h3 className="text-white font-semibold text-base leading-tight truncate">{project.name}</h3>
            {project.description && (
              <p className="text-white/60 text-[11px] mt-0.5 line-clamp-1">{project.description}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{project.serviceCount ?? 0} services</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{project.updatedAt ? String(project.updatedAt).slice(0, 10) : "—"}</span>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Docker</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">K8s</span>
          </div>
          <Button size="sm" className="h-8 gap-1.5 mt-auto" onClick={onDeploy}>
            <Rocket className="h-3.5 w-3.5" />
            Deploy Application
          </Button>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

/* ── Deploy Dialog (two-step) ── */
function DeployDialog({ project, onClose }: { project: ProjectItem; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [env, setEnv] = useState<"docker" | "k8s">("docker");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const { data: preview, isLoading: previewLoading } = usePackagePreview(project.id);
  const startPackage = useStartPackage();

  const { data: taskStatus } = usePackageTaskStatus(project.id, activeTaskId ?? "");

  const handleStartPackage = async () => {
    const result = await startPackage.mutateAsync({ projectId: project.id, config: preview ?? undefined });
    setActiveTaskId(result.taskId);
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Deploy — {project.name}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Select deployment environment" : "Review delivery manifest and start packaging"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <EnvironmentCard
                icon={Box}
                label="Docker Compose"
                description="Single-host deployment with docker-compose.yml"
                selected={env === "docker"}
                onClick={() => setEnv("docker")}
              />
              <EnvironmentCard
                icon={Cloud}
                label="Kubernetes"
                description="Container orchestration with K8s manifests"
                selected={env === "k8s"}
                onClick={() => setEnv("k8s")}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {previewLoading ? (
              <div className="h-32 rounded bg-muted animate-pulse" />
            ) : (
              <DeliveryManifest preview={preview} env={env} />
            )}
            {activeTaskId && taskStatus && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Build progress</p>
                  <StatusBadge status={taskStatus.status === "RUNNING" ? "running" : taskStatus.status === "SUCCESS" ? "success" : "error"} size="sm" />
                </div>
                <Progress value={taskStatus.progress ?? (taskStatus.status === "RUNNING" ? 45 : taskStatus.status === "SUCCESS" ? 100 : 0)} className="h-1.5" />
                {taskStatus.logs && taskStatus.logs.length > 0 && (
                  <ScrollArea className="h-28 rounded border border-border bg-muted/30 p-2">
                    {taskStatus.logs.map((log, i) => (
                      <p key={i} className="text-[10px] font-mono text-muted-foreground leading-relaxed">{log}</p>
                    ))}
                  </ScrollArea>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 1 ? (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={() => setStep(2)}>
                Continue <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>
              {activeTaskId && taskStatus?.status === "SUCCESS" && taskStatus.downloadUrl ? (
                <Button size="sm" asChild>
                  <a href={taskStatus.downloadUrl} download>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download ZIP
                  </a>
                </Button>
              ) : (
                <Button size="sm" onClick={handleStartPackage} disabled={startPackage.isPending || !!activeTaskId}>
                  {startPackage.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Package className="h-3.5 w-3.5 mr-1.5" />}
                  {activeTaskId ? "Building…" : "Start Build"}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EnvironmentCard({ icon: Icon, label, description, selected, onClick }: {
  icon: React.ElementType; label: string; description: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all text-center", selected ? "border-primary bg-primary/10" : "border-border hover:border-border/80 hover:bg-accent")}>
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", selected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className={cn("text-sm font-semibold", selected ? "text-primary" : "text-foreground")}>{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{description}</p>
      </div>
      {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
    </button>
  );
}

function DeliveryManifest({ preview, env }: { preview: any; env: string }) {
  const moduleCount = Object.keys(preview?.modules ?? {}).length;
  const infra = preview?.infra ?? {};
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded border border-border bg-muted/20 p-2">
          <p className="text-lg font-semibold text-foreground">{moduleCount}</p>
          <p className="text-[10px] text-muted-foreground">Images</p>
        </div>
        <div className="rounded border border-border bg-muted/20 p-2">
          <p className="text-lg font-semibold text-foreground">7+</p>
          <p className="text-[10px] text-muted-foreground">Infra services</p>
        </div>
        <div className="rounded border border-border bg-muted/20 p-2">
          <p className="text-lg font-semibold text-foreground">1</p>
          <p className="text-[10px] text-muted-foreground">Compose file</p>
        </div>
      </div>
      <div className="rounded-md border border-border bg-muted/20 p-3 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Delivery Contents</p>
        {[
          { icon: Box,       label: `images/`,      desc: `${moduleCount + 7} .tar files` },
          { icon: Database,  label: `sql/mysql/`,   desc: "Database dumps" },
          { icon: HardDrive, label: `minio/`,       desc: "Object storage data" },
          { icon: FileCode2, label: `docker-compose.yml`, desc: env === "docker" ? "Compose definition" : "K8s manifests" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-mono text-foreground/80">{label}</span>
            <span className="text-muted-foreground ml-auto">{desc}</span>
          </div>
        ))}
      </div>
      {Object.keys(infra).length > 0 && (
        <div className="rounded-md border border-border bg-muted/20 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Host Ports</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(infra).filter(([k]) => k.endsWith("HostPort")).map(([k, v]) => (
              <div key={k} className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{k.replace("HostPort", "")}</span>
                <span className="font-mono text-foreground">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mock data for demo ── */
const mockProjects: ProjectItem[] = [
  { id: "1", name: "E-commerce Core",     description: "Core order processing and user management", status: "READY",    serviceCount: 4, updatedAt: "2025-01-05" },
  { id: "2", name: "Analytics Dashboard", description: "Real-time data visualization platform",       status: "DEPLOYED", serviceCount: 2, updatedAt: "2025-01-08" },
  { id: "3", name: "Geo Analysis Suite",  description: "GIS vector and raster data processing",       status: "DRAFT",    serviceCount: 6, updatedAt: "2025-01-10" },
];
