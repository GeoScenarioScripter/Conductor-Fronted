import { useState } from "react";
import {
  Search,
  Edit,
  Trash2,
  Server,
  Database,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings,
  Save,
  RefreshCw,
  Terminal,
  Activity,
  File,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Mock Data Source for Dropdown
const availableDataSources = [
  { id: "1", name: "users_db", type: "PostgreSQL", host: "192.168.1.10" },
  { id: "2", name: "orders_db", type: "MySQL", host: "192.168.1.11" },
  { id: "3", name: "logs_bucket", type: "MinIO", host: "192.168.1.12" },
  { id: "4", name: "local_sqlite", type: "SQLite", host: "localhost" },
];

const getDataSourceIcon = (type: string) => {
  switch (type) {
    case "PostgreSQL":
      return <Database className="w-4 h-4 text-blue-500" />;
    case "MySQL":
      return <Database className="w-4 h-4 text-orange-500" />;
    case "MinIO":
      return <HardDrive className="w-4 h-4 text-red-500" />;
    case "SQLite":
      return <File className="w-4 h-4 text-gray-500" />;
    default:
      return <Database className="w-4 h-4" />;
  }
};

// Mock Data
interface Service {
  id: string;
  name: string;
  version: string;
  type: string;
  db: string | null;
  status: "active" | "inactive";
  lastUpdated: string;
  envVars: Record<string, string>;
  logs: string[];
}

const initialServices: Service[] = [
  {
    id: "1",
    name: "User Microapplication",
    version: "1.0.2",
    type: "SpringBoot",
    db: "users_db",
    status: "active",
    lastUpdated: "2025-01-08",
    envVars: {
      SERVER_PORT: "8080",
      DB_HOST: "localhost",
      DB_NAME: "users_db",
      LOG_LEVEL: "INFO",
    },
    logs: [
      "[INFO] 2025-01-08 10:00:00 Starting Spring Boot application...",
      "[INFO] 2025-01-08 10:00:05 Connected to users_db",
      "[INFO] 2025-01-08 10:00:06 Tomcat initialized with port(s): 8080 (http)",
      "[INFO] 2025-01-08 10:15:23 User login attempt: user_123",
      "[INFO] 2025-01-08 10:15:24 User login successful",
    ],
  },
  {
    id: "2",
    name: "Order Microapplication",
    version: "2.1.0",
    type: "NodeJS",
    db: "orders_db",
    status: "active",
    lastUpdated: "2025-01-07",
    envVars: {
      PORT: "3000",
      DB_URI: "mongodb://localhost:27017/orders_db",
      REDIS_HOST: "localhost",
      NODE_ENV: "production",
    },
    logs: [
      "[INFO] 2025-01-07 14:00:00 Service started",
      "[INFO] 2025-01-07 14:00:01 Connected to MongoDB",
      "[INFO] 2025-01-07 14:05:00 Received new order #ORD-2025-001",
      "[INFO] 2025-01-07 14:05:01 Order processed successfully",
    ],
  },
  {
    id: "3",
    name: "Payment Microapplication",
    version: "1.0.5",
    type: "Go",
    db: null,
    status: "inactive",
    lastUpdated: "2024-12-20",
    envVars: {
      HTTP_PORT: "8081",
      STRIPE_KEY: "sk_test_...",
      CURRENCY: "USD",
    },
    logs: ["[INFO] 2024-12-20 09:00:00 Service stopped"],
  },
  {
    id: "4",
    name: "Notification Microapplication",
    version: "0.9.0",
    type: "Python",
    db: "redis_cache",
    status: "active",
    lastUpdated: "2025-01-08",
    envVars: {
      FLASK_APP: "app.py",
      FLASK_ENV: "production",
      REDIS_URL: "redis://localhost:6379/0",
      SMTP_SERVER: "smtp.example.com",
    },
    logs: [
      "[INFO] 2025-01-08 11:00:00 Worker started",
      "[INFO] 2025-01-08 11:05:00 Sending email to user@example.com",
      "[INFO] 2025-01-08 11:05:02 Email sent successfully",
    ],
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // New States
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editedEnvVars, setEditedEnvVars] = useState<Record<string, string>>(
    {}
  );
  const [isRestarting, setIsRestarting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate Pagination
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentServices = filteredServices.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this service?")) {
      setServices(services.filter((s) => s.id !== id));
    }
  };

  const handleEdit = (e: React.MouseEvent, service: Service) => {
    e.stopPropagation();
    setEditingService({ ...service });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingService) {
      setServices(
        services.map((s) => (s.id === editingService.id ? editingService : s))
      );
      setIsEditOpen(false);
    }
  };

  const handleStatusToggle = async (
    serviceId: string,
    currentStatus: "active" | "inactive"
  ) => {
    setLoadingStates((prev) => ({ ...prev, [serviceId]: true }));

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setServices((prevServices) =>
      prevServices.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              status: currentStatus === "active" ? "inactive" : "active",
            }
          : service
      )
    );

    setLoadingStates((prev) => ({ ...prev, [serviceId]: false }));
  };

  const handleCardClick = (service: Service) => {
    setDetailService(service);
    setEditedEnvVars({ ...service.envVars });
    setIsDetailOpen(true);
  };

  const handleEnvVarChange = (key: string, value: string) => {
    setEditedEnvVars((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEnvVars = () => {
    if (detailService) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === detailService.id ? { ...s, envVars: editedEnvVars } : s
        )
      );
      alert("Environment variables saved successfully!");
    }
  };

  const handleRestartContainer = async () => {
    setIsRestarting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRestarting(false);

    if (detailService) {
      const newLog = `[INFO] ${
        new Date().toISOString().replace("T", " ").split(".")[0]
      } Container restarted by user`;
      setServices((prev) =>
        prev.map((s) =>
          s.id === detailService.id ? { ...s, logs: [...s.logs, newLog] } : s
        )
      );
      setDetailService((prev) =>
        prev ? { ...prev, logs: [...prev.logs, newLog] } : null
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Microapplication Management
          </h2>
          <p className="text-muted-foreground">
            Manage your uploaded microapplications and their configurations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search microapplications..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentServices.map((service) => (
          <Card
            key={service.id}
            className="backdrop-blur-sm bg-card/50 border-primary/20 hover:border-primary/50 transition-colors group cursor-pointer"
            onClick={() => handleCardClick(service)}
          >
            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{service.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {service.type} • v{service.version}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={(e) => handleEdit(e, service)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDelete(e, service.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Database className="h-3 w-3" /> Database
                  </span>
                  <span
                    className={
                      service.db
                        ? "text-foreground font-medium"
                        : "text-muted-foreground italic"
                    }
                  >
                    {service.db || "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        service.status === "active"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {service.status === "active" ? "Running" : "Stopped"}
                    </span>
                    {loadingStates[service.id] ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      <Switch
                        checked={service.status === "active"}
                        onCheckedChange={() =>
                          handleStatusToggle(service.id, service.status)
                        }
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{service.lastUpdated}</span>
                </div>
              </div>
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Microapplication
            </DialogTitle>
            <DialogDescription>
              Make changes to the microapplication configuration here.
            </DialogDescription>
          </DialogHeader>
          {editingService && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      name: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="db" className="text-right">
                  Database
                </Label>
                <Input
                  id="db"
                  value={editingService.db || ""}
                  onChange={(e) =>
                    setEditingService({ ...editingService, db: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                  value={editingService.status}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      status: e.target.value as any,
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Server className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {detailService?.name}
                </DialogTitle>
                <DialogDescription>
                  {detailService?.type} • v{detailService?.version}
                </DialogDescription>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                    detailService?.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      detailService?.status === "active"
                        ? "bg-green-500"
                        : "bg-slate-500"
                    )}
                  />
                  {detailService?.status === "active" ? "Running" : "Stopped"}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Environment Variables */}
            <div className="w-1/3 border-r bg-muted/10 flex flex-col">
              <div className="p-4 border-b bg-background flex items-center justify-between sticky top-0">
                <div className="flex items-center gap-2 font-medium">
                  <Settings className="w-4 h-4" />
                  Environment Variables
                </div>
                <Button size="sm" variant="outline" onClick={handleSaveEnvVars}>
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {Object.entries(editedEnvVars).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label
                      htmlFor={key}
                      className="text-xs font-mono text-muted-foreground"
                    >
                      {key}
                    </Label>
                    {key === "DB_HOST" ? (
                      <Select
                        value={value}
                        onValueChange={(newValue) =>
                          handleEnvVarChange(key, newValue)
                        }
                      >
                        <SelectTrigger className="font-mono text-sm h-8">
                          <div className="flex items-center gap-2">
                            {/* Try to find matching DS to show icon in trigger too */}
                            {(() => {
                              const ds = availableDataSources.find(
                                (d) => d.host === value
                              );
                              if (ds) {
                                return (
                                  <>
                                    {getDataSourceIcon(ds.type)}
                                    <span>{value}</span>
                                  </>
                                );
                              }
                              return <span className="truncate">{value}</span>;
                            })()}
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {availableDataSources.map((ds) => (
                            <SelectItem key={ds.id} value={ds.host}>
                              <div className="flex items-center gap-2">
                                {getDataSourceIcon(ds.type)}
                                <span>
                                  {ds.name} ({ds.host})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={key}
                        value={value}
                        onChange={(e) =>
                          handleEnvVarChange(key, e.target.value)
                        }
                        className="font-mono text-sm h-8"
                      />
                    )}
                  </div>
                ))}
                {Object.keys(editedEnvVars).length === 0 && (
                  <div className="text-sm text-muted-foreground italic text-center py-4">
                    No environment variables configured.
                  </div>
                )}
                <div className="pt-4 border-t mt-4">
                  <h4 className="text-sm font-medium mb-3">Actions</h4>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={handleRestartContainer}
                    disabled={
                      isRestarting || detailService?.status !== "active"
                    }
                  >
                    {isRestarting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Restart Container
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Panel: Logs */}
            <div className="w-2/3 flex flex-col bg-slate-950 text-slate-50">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  Container Logs
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Activity className="w-3 h-3" />
                    Live
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-1">
                {detailService?.logs.map((log, index) => (
                  <div
                    key={index}
                    className="break-all opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <span className="text-slate-500 mr-2">{index + 1}</span>
                    {log}
                  </div>
                ))}
                {(!detailService?.logs || detailService.logs.length === 0) && (
                  <div className="text-slate-500 italic">
                    No logs available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
