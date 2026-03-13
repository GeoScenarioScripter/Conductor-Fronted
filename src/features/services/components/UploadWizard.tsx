import { useState } from "react";
import {
  Upload,
  Check,
  FileCode,
  Package,
  Layers,
  Container,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FormData {
  jarFile: File | null;
  appName: string;
  version: string;
  description: string;
  configFile: File | null;
  configAppName: string;
  environment: string;
  baseImage: string;
  exposedPort: string;
  buildDescription: string;
  portMapping: string;
  envVars: string;
}

const initialFormData: FormData = {
  jarFile: null,
  appName: "",
  version: "1.0.0",
  description: "",
  configFile: null,
  configAppName: "",
  environment: "prod",
  baseImage: "openjdk:17-jdk-alpine",
  exposedPort: "8080",
  buildDescription: "",
  portMapping: "8080:8080",
  envVars: "",
};

const steps = [
  { id: 1, title: "Upload JAR", description: "Upload your microservice JAR file", icon: Package },
  { id: 2, title: "Upload Config", description: "Upload configuration YAML", icon: FileCode },
  { id: 3, title: "Build Image", description: "Configure and build Docker image", icon: Layers },
  { id: 4, title: "Create Container", description: "Deploy and run container", icon: Container },
];

interface FileDropZoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  accept: string;
  label: string;
}

function FileDropZone({ file, onFileSelect, onFileRemove, accept, label }: FileDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-300",
        dragActive
          ? "border-primary bg-primary/10"
          : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/5",
        file ? "border-green-500/50 bg-green-500/5" : ""
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="hidden"
        id={`file-upload-${label}`}
        onChange={handleChange}
        accept={accept}
      />
      {file ? (
        <div className="text-center animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm font-medium truncate max-w-[180px]">{file.name}</p>
          <p className="text-xs text-muted-foreground mb-2">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.preventDefault(); onFileRemove(); }}
            className="h-7 text-destructive hover:text-destructive"
          >
            Remove
          </Button>
        </div>
      ) : (
        <label htmlFor={`file-upload-${label}`} className="cursor-pointer text-center group w-full">
          <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium group-hover:text-primary transition-colors">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">Drag & drop or click</p>
        </label>
      )}
    </div>
  );
}

interface UploadWizardProps {
  onSuccess?: () => void;
}

export function UploadWizard({ onSuccess }: UploadWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const updateField = (field: keyof FormData, value: FormData[keyof FormData]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    if (currentStep < steps.length - 1) {
      if (currentStep === 0 && !formData.configAppName) {
        updateField("configAppName", formData.appName);
      }
      setCurrentStep((prev) => prev + 1);
    } else {
      console.log("Final Form Data:", formData);
      setIsSuccessOpen(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setIsSuccessOpen(false);
    setCurrentStep(0);
    setFormData(initialFormData);
    onSuccess?.();
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return !!formData.jarFile && !!formData.appName && !!formData.version;
      case 1: return !!formData.configFile && !!formData.environment;
      case 2: return !!formData.baseImage && !!formData.exposedPort;
      case 3: return !!formData.portMapping;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                placeholder="e.g. demo-provider-auth"
                value={formData.appName}
                onChange={(e) => updateField("appName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="e.g. 1.0.0"
                value={formData.version}
                onChange={(e) => updateField("version", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g. Auth Service Module"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>JAR File</Label>
              <FileDropZone
                file={formData.jarFile}
                onFileSelect={(f) => updateField("jarFile", f)}
                onFileRemove={() => updateField("jarFile", null)}
                accept=".jar"
                label="Upload JAR"
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="configAppName">App Name</Label>
              <Input
                id="configAppName"
                value={formData.configAppName}
                onChange={(e) => updateField("configAppName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Input
                id="environment"
                placeholder="e.g. prod, dev, test"
                value={formData.environment}
                onChange={(e) => updateField("environment", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Config File (YML)</Label>
              <FileDropZone
                file={formData.configFile}
                onFileSelect={(f) => updateField("configFile", f)}
                onFileRemove={() => updateField("configFile", null)}
                accept=".yml,.yaml"
                label="Upload YML"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseImage">Base Image</Label>
              <Input
                id="baseImage"
                placeholder="e.g. openjdk:17-jdk-alpine"
                value={formData.baseImage}
                onChange={(e) => updateField("baseImage", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exposedPort">Exposed Port</Label>
              <Input
                id="exposedPort"
                placeholder="e.g. 8080"
                value={formData.exposedPort}
                onChange={(e) => updateField("exposedPort", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buildDescription">Build Description</Label>
              <Input
                id="buildDescription"
                placeholder="Optional build notes"
                value={formData.buildDescription}
                onChange={(e) => updateField("buildDescription", e.target.value)}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portMapping">Port Mapping (Host:Container)</Label>
              <Input
                id="portMapping"
                placeholder="e.g. 8080:8080"
                value={formData.portMapping}
                onChange={(e) => updateField("portMapping", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="envVars">Environment Variables</Label>
              <textarea
                id="envVars"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={"KEY=VALUE\nANOTHER_KEY=VALUE"}
                value={formData.envVars}
                onChange={(e) => updateField("envVars", e.target.value)}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Stepper */}
      <div className="flex justify-between items-center relative mb-6">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5 relative z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 backdrop-blur-sm",
                  isActive
                    ? "border-primary bg-primary/20 text-primary scale-110 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                    : isCompleted
                    ? "border-primary bg-transparent text-primary"
                    : "border-muted-foreground/30 bg-transparent text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <p
                className={cn(
                  "text-xs font-medium transition-colors hidden sm:block",
                  isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* Card */}
      <Card className="backdrop-blur-md bg-card/50 border-border/50 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-border/50 py-4 px-5">
          <CardTitle className="text-lg text-primary flex items-center gap-2">
            {(() => { const Icon = steps[currentStep].icon; return <Icon className="w-5 h-5" />; })()}
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription className="text-xs">{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border/50 py-4 px-5 bg-muted/5">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
            size="sm"
            className="w-24"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepValid() || isLoading}
            size="sm"
            className="w-24"
          >
            {isLoading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Processing</>
            ) : currentStep === steps.length - 1 ? (
              <><Container className="w-3.5 h-3.5 mr-1.5" />Deploy</>
            ) : (
              <>Next<ArrowRight className="w-3.5 h-3.5 ml-1.5" /></>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <Check className="w-5 h-5" />
              Deployment Successful
            </DialogTitle>
            <DialogDescription>
              Your container has been successfully created and activated.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center animate-pulse">
              <Container className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleReset} className="sm:w-1/2">
              Upload Another
            </Button>
            <Button onClick={handleReset} className="sm:w-1/2">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
