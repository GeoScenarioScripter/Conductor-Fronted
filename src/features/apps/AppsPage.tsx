import { useState } from "react";
import {
  Download,
  Settings,
  Database,
  Cloud,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Layers,
  Calendar,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface MicroApp {
  id: string;
  name: string;
  description: string;
  version: string;
  servicesCount: number;
  createdAt: string;
  thumbnail: string;
}

const initialApps: MicroApp[] = [
  {
    id: "1",
    name: "E-commerce Core",
    description: "Core order processing and user management system.",
    version: "1.2.0",
    servicesCount: 4,
    createdAt: "2025-01-05",
    thumbnail: "bg-gradient-to-br from-purple-500 to-indigo-600",
  },
  {
    id: "2",
    name: "Analytics Dashboard",
    description: "Real-time data visualization and reporting app.",
    version: "0.8.5",
    servicesCount: 2,
    createdAt: "2025-01-08",
    thumbnail: "bg-gradient-to-br from-emerald-400 to-cyan-600",
  },
];

export default function AppsPage() {
  // Apps Page Component
  const [apps] = useState<MicroApp[]>(initialApps);
  const [selectedApp, setSelectedApp] = useState<MicroApp | null>(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [deployEnv, setDeployEnv] = useState<"docker" | "k8s">("docker");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Calculate Pagination
  const totalPages = Math.ceil(apps.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApps = apps.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDownloadClick = (app: MicroApp) => {
    setSelectedApp(app);
    setIsDownloadOpen(true);
  };

  const handleDownloadConfirm = () => {
    // Mock download logic
    const link = document.createElement("a");
    link.href = "#"; // Mock URL
    link.download = `${selectedApp?.name.replace(
      /\s+/g,
      "_"
    )}_${deployEnv}.zip`;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);

    alert(
      `Downloading ${selectedApp?.name} for ${
        deployEnv === "docker" ? "Docker Compose" : "Kubernetes"
      }...`
    );
    setIsDownloadOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Application Delivery Management
        </h2>
        <p className="text-muted-foreground">
          Manage and deploy your exported microapplications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentApps.map((app) => (
          <Card
            key={app.id}
            className="group overflow-hidden border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,240,255,0.1)] bg-card/50 backdrop-blur-sm hover:-translate-y-1"
          >
            <div
              className={`h-40 w-full ${app.thumbnail} relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500" />
              <div className="absolute top-4 right-4 flex items-center gap-0 group-hover:gap-1.5 px-2 py-1 rounded-full bg-white/90 text-black shadow-lg backdrop-blur-md transition-all duration-300">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="overflow-hidden max-w-0 group-hover:max-w-[100px] text-xs font-semibold whitespace-nowrap transition-all duration-300">
                  Ready to Deploy
                </span>
              </div>
              <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white font-bold text-2xl tracking-tight drop-shadow-md mb-1">
                  {app.name}
                </h3>
                <p className="text-white/80 text-sm line-clamp-1 font-light">
                  {app.description}
                </p>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    <GitBranch className="h-3.5 w-3.5" />
                    Version
                  </div>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {app.version}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    <Layers className="h-3.5 w-3.5" />
                    Services
                  </div>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {app.servicesCount} Microservices
                  </span>
                </div>

                <div className="col-span-2 flex flex-col gap-1.5 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    <Calendar className="h-3.5 w-3.5" />
                    Created At
                  </div>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {app.createdAt}
                  </span>
                </div>
              </div>

              <Button
                className="w-full gap-2 group/btn relative overflow-hidden"
                onClick={() => handleDownloadClick(app)}
                size="lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500" />
                <Rocket className="h-4 w-4 transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
                <span className="font-semibold">Deploy Application</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
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

      {/* Download Configuration Dialog */}
      <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure Deployment</DialogTitle>
            <DialogDescription>
              Prepare your microapplication package for download.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Step 1: Environment */}
            <div className="space-y-3">
              <Label className="text-base">1. Select Environment</Label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${
                    deployEnv === "docker"
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => setDeployEnv("docker")}
                >
                  <Box className="h-8 w-8" />
                  <span className="font-medium">Docker Compose</span>
                  {deployEnv === "docker" && (
                    <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />
                  )}
                </div>
                <div
                  className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${
                    deployEnv === "k8s"
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => setDeployEnv("k8s")}
                >
                  <Cloud className="h-8 w-8" />
                  <span className="font-medium">Kubernetes</span>
                  {deployEnv === "k8s" && (
                    <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: DB Configuration Mock */}
            <div className="space-y-3">
              <Label className="text-base flex items-center gap-2">
                2. Database Configuration
                <span className="text-xs font-normal text-muted-foreground">
                  (Auto-detected)
                </span>
              </Label>
              <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <span>users_db (PostgreSQL)</span>
                  <span className="ml-auto text-green-500 text-xs">
                    Connected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-yellow-500" />
                  <span>orders_db (MySQL)</span>
                  <span className="ml-auto text-yellow-500 text-xs">
                    Pending Config
                  </span>
                </div>
              </div>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary"
              >
                <Settings className="h-3 w-3 mr-1" /> Adjust Database Settings
              </Button>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDownloadOpen(false)}
              className="sm:w-1/2"
            >
              Cancel
            </Button>
            <Button onClick={handleDownloadConfirm} className="gap-2 sm:w-1/2">
              <Download className="h-4 w-4" /> Download Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
