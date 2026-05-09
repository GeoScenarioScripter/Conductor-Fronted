import { motion } from "framer-motion";
import {
  Server, Workflow, Database, Package,
  ArrowRight, CheckCircle2, Clock, AlertCircle,
  Activity, Cpu, HardDrive, Radio,
} from "lucide-react";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import { GlassPanel } from "@/components/ui/glass-panel";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useApplicationsMetadata } from "@/hooks/use-workflow-metadata";
import { useWorkflows } from "@/hooks/use-workflow";
import { useDatabases } from "@/hooks/use-databases";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// Pipeline steps
const pipelineSteps = [
  { label: "Data Sources",   icon: Database,  color: "text-sky-400",    desc: "Register connections" },
  { label: "Module Discovery", icon: Radio,   color: "text-violet-400", desc: "Discover JAR services" },
  { label: "Orchestration",  icon: Workflow,  color: "text-primary",    desc: "Visual DAG editor" },
  { label: "Project Setup",  icon: Server,    color: "text-amber-400",  desc: "Aggregate & merge DBs" },
  { label: "Deploy",         icon: Cpu,       color: "text-emerald-400",desc: "Launch containers" },
  { label: "Export",         icon: Package,   color: "text-rose-400",   desc: "Package & deliver" },
];

// Mock health data
const healthItems = [
  { label: "Nacos Registry",   status: "online"  as const },
  { label: "Redis Cache",      status: "online"  as const },
  { label: "RabbitMQ",         status: "online"  as const },
  { label: "MinIO Storage",    status: "online"  as const },
  { label: "MySQL (conductor)", status: "online"  as const },
];

// Mock recent activity
const recentActivity = [
  { id: 1, type: "workflow", name: "Auth Pipeline",   status: "success" as const, time: "2 min ago" },
  { id: 2, type: "deploy",   name: "geo-analyzer v2", status: "running" as const, time: "5 min ago" },
  { id: 3, type: "workflow", name: "Data Export Flow", status: "error"  as const, time: "12 min ago" },
  { id: 4, type: "module",   name: "vector-provider",  status: "success" as const, time: "1 hr ago" },
];

function extractDefinitions(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown>;
  for (const key of ["definitions", "data", "list", "records", "content", "items", "result"]) {
    if (Array.isArray(r[key])) return r[key] as unknown[];
  }
  return [];
}

export default function OverviewPage() {
  const { data: apps, isLoading: appsLoading }   = useApplicationsMetadata();
  const { data: workflows, isLoading: wfLoading } = useWorkflows();
  const { data: dbs, isLoading: dbLoading }       = useDatabases();

  const appCount      = (apps ?? []).length;
  const workflowCount = extractDefinitions(workflows).filter((w: any) => w?.status === "active" || !w?.status).length;
  const dbCount       = Array.isArray(dbs) ? dbs.length : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Overview"
          subtitle="Production orchestration at a glance"
        />
      </motion.div>

      {/* ── KPI Row ── */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Active Services"
            value={appsLoading ? "—" : appCount}
            icon={Server}
            description="Discovered microservices"
            variant="cyan"
            loading={appsLoading}
          />
          <MetricCard
            label="Data Sources"
            value={dbLoading ? "—" : dbCount}
            icon={Database}
            description="Registered connections"
            variant="violet"
            loading={dbLoading}
          />
          <MetricCard
            label="Workflows"
            value={wfLoading ? "—" : workflowCount}
            icon={Workflow}
            description="Published workflows"
            variant="success"
            loading={wfLoading}
          />
          <MetricCard
            label="Deliverable Apps"
            value="—"
            icon={Package}
            description="Ready to export"
            variant="warning"
          />
        </div>
      </motion.div>

      {/* ── Pipeline Overview ── */}
      <motion.div variants={itemVariants}>
        <GlassPanel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Production Pipeline
          </p>
          <div className="flex items-center gap-0 overflow-x-auto pb-1">
            {pipelineSteps.map((step, i) => (
              <div key={step.label} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-2 px-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border`}>
                    <step.icon className={`h-4 w-4 ${step.color}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-medium text-foreground whitespace-nowrap">{step.label}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{step.desc}</p>
                  </div>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-border flex-shrink-0 mx-1" />
                )}
              </div>
            ))}
          </div>
        </GlassPanel>
      </motion.div>

      {/* ── Activity + Health ── */}
      <motion.div variants={itemVariants}>
        <BentoGrid cols={3} className="items-start">
          {/* Recent Activity (2 cols) */}
          <BentoItem colSpan={2}>
            <GlassPanel className="p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Recent Activity
                </p>
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {recentActivity.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex-shrink-0">
                      {event.status === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      {event.status === "running" && <Activity className="h-4 w-4 text-sky-400 animate-pulse" />}
                      {event.status === "error"   && <AlertCircle className="h-4 w-4 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{event.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{event.type}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={event.status} size="sm" />
                      <span className="text-[11px] text-muted-foreground">{event.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </BentoItem>

          {/* System Health (1 col) */}
          <BentoItem colSpan={1}>
            <GlassPanel className="p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  System Health
                </p>
                <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="space-y-2.5">
                {healthItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-foreground/80 truncate">{item.label}</span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-[11px] text-muted-foreground">
                  All systems nominal · Last checked just now
                </p>
              </div>
            </GlassPanel>
          </BentoItem>
        </BentoGrid>
      </motion.div>
    </motion.div>
  );
}
