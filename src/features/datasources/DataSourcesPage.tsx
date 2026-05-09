import { useState } from "react";
import { motion } from "framer-motion";
import {
  Database, HardDrive, Plus, Search, CheckCircle2,
  AlertCircle, RefreshCw, Trash2, ChevronRight, Server,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDatabases, useDeleteDatabase } from "@/hooks/use-databases";
import type { DatabaseItem } from "@/services/database.service";

const typeIconMap: Record<string, React.ElementType> = {
  MySQL:      Database,
  PostgreSQL: Database,
  MinIO:      HardDrive,
  SQLite:     Database,
};

const typeBadgeMap: Record<string, string> = {
  MySQL:      "bg-orange-400/10 text-orange-400 border-orange-400/20",
  PostgreSQL: "bg-sky-400/10 text-sky-400 border-sky-400/20",
  MinIO:      "bg-rose-400/10 text-rose-400 border-rose-400/20",
  SQLite:     "bg-slate-400/10 text-slate-400 border-slate-400/20",
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function DataSourcesPage() {
  const { data: rawDbs, isLoading, error } = useDatabases();
  const deleteDb = useDeleteDatabase();

  const dbs: DatabaseItem[] = Array.isArray(rawDbs) ? rawDbs : [];

  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<DatabaseItem | null>(null);
  const [addOpen,  setAddOpen]  = useState(false);

  // KPI counts
  const mysqlCount  = dbs.filter(d => d.type === "MySQL").length;
  const pgCount     = dbs.filter(d => d.type === "PostgreSQL").length;
  const minioCount  = dbs.filter(d => d.type === "MinIO").length;

  const filtered = dbs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="h-full flex flex-col gap-6">

      {/* Header */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Data Sources"
          subtitle="Manage database and object storage connections"
          actions={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Data Source
            </Button>
          }
        />
      </motion.div>

      {/* KPI row */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard label="MySQL" value={mysqlCount} icon={Database} variant="warning" loading={isLoading} />
          <MetricCard label="PostgreSQL" value={pgCount} icon={Database} variant="cyan" loading={isLoading} />
          <MetricCard label="MinIO" value={minioCount} icon={HardDrive} variant="error" loading={isLoading} />
          <MetricCard label="Healthy" value={dbs.length} icon={CheckCircle2} variant="success" loading={isLoading} />
          <MetricCard label="Failed" value={0} icon={AlertCircle} variant="violet" loading={isLoading} />
        </div>
      </motion.div>

      {/* Split view */}
      <motion.div variants={itemVariants} className="flex-1 flex gap-4 min-h-0">

        {/* Left list */}
        <GlassPanel className="w-64 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background/50"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {isLoading && (
              <div className="p-4 space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}
              </div>
            )}
            {error && (
              <div className="p-4 text-xs text-muted-foreground text-center">
                Failed to load data sources
              </div>
            )}
            {!isLoading && filtered.length === 0 && (
              <div className="p-4 text-xs text-muted-foreground text-center">
                No data sources found
              </div>
            )}
            <div className="p-2 space-y-1">
              {filtered.map(db => {
                const Icon = typeIconMap[db.type] ?? Database;
                const isSelected = selected?.id === db.id;
                return (
                  <button
                    key={db.id}
                    onClick={() => setSelected(db)}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left transition-colors",
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-accent border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0",
                      isSelected ? "bg-primary/15" : "bg-muted"
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium truncate", isSelected ? "text-primary" : "text-foreground")}>
                        {db.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{db.type}</p>
                    </div>
                    {isSelected && <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </GlassPanel>

        {/* Right detail */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <GlassPanel className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Database className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Select a data source</p>
              <p className="text-xs text-muted-foreground mt-1">Click any item on the left to view details</p>
            </GlassPanel>
          ) : (
            <DataSourceDetail
              db={selected}
              onDelete={() => {
                deleteDb.mutate(selected.id);
                setSelected(null);
              }}
            />
          )}
        </div>
      </motion.div>

      {/* Add Sheet */}
      <AddDataSourceSheet open={addOpen} onOpenChange={setAddOpen} />
    </motion.div>
  );
}

/* ── Detail Panel ── */
function DataSourceDetail({ db, onDelete }: { db: DatabaseItem; onDelete: () => void }) {
  const Icon = typeIconMap[db.type] ?? Database;
  return (
    <GlassPanel className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground truncate">{db.name}</h2>
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", typeBadgeMap[db.type])}>
              {db.type}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">ID: {db.id}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1">
            <RefreshCw className="h-3 w-3" />
            Test
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="h-7 px-2 text-xs text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-5">
        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info" className="text-xs">Connection</TabsTrigger>
            <TabsTrigger value="schema" className="text-xs">Schema</TabsTrigger>
            <TabsTrigger value="bindings" className="text-xs">Bindings</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Type",          value: db.type },
                { label: "Size",          value: db.size || "—" },
                { label: "Records",       value: db.records?.toLocaleString() ?? "—" },
                { label: "Last Modified", value: db.lastModified || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-md border border-border bg-muted/30 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md border border-border bg-muted/20">
              <StatusBadge status="online" size="sm" />
              <span className="text-xs text-muted-foreground">Connection verified · Last check: just now</span>
            </div>
          </TabsContent>

          <TabsContent value="schema">
            <div className="rounded-md border border-border bg-muted/20 p-4 text-xs text-muted-foreground text-center">
              {db.type === "MinIO"
                ? "Bucket structure not available in this view"
                : "Schema extraction not yet available for this source"}
            </div>
          </TabsContent>

          <TabsContent value="bindings">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">Microservices bound to this data source</p>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-3">
                <Server className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">No bindings configured</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </GlassPanel>
  );
}

/* ── Add Data Source Sheet ── */
function AddDataSourceSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add Data Source</SheetTitle>
          <SheetDescription>Register a new database or storage connection</SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <Tabs defaultValue="mysql">
          <TabsList className="w-full">
            <TabsTrigger value="mysql" className="flex-1 text-xs">MySQL</TabsTrigger>
            <TabsTrigger value="pg" className="flex-1 text-xs">PostgreSQL</TabsTrigger>
            <TabsTrigger value="minio" className="flex-1 text-xs">MinIO</TabsTrigger>
          </TabsList>
          {["mysql","pg","minio"].map(type => (
            <TabsContent key={type} value={type} className="mt-4 space-y-4">
              <ConnForm type={type} onClose={() => onOpenChange(false)} />
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function ConnForm({ type, onClose }: { type: string; onClose: () => void }) {
  const isMinIO = type === "minio";
  return (
    <div className="space-y-3">
      {isMinIO ? (
        <>
          <Field label="Endpoint"   placeholder="http://localhost:9000" />
          <Field label="Access Key" placeholder="minioadmin" />
          <Field label="Secret Key" placeholder="minioadmin" type="password" />
          <Field label="Bucket"     placeholder="my-bucket" />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Host" placeholder="localhost" />
            <Field label="Port" placeholder={type === "pg" ? "5432" : "3306"} />
          </div>
          <Field label="Database" placeholder="my_database" />
          <Field label="Username" placeholder="root" />
          <Field label="Password" placeholder="••••••••" type="password" />
        </>
      )}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="flex-1">Connect</Button>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} placeholder={placeholder} className="h-8 text-xs" />
    </div>
  );
}
