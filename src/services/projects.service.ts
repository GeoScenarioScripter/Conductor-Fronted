import { apiClient } from "@/lib/api-client";

export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  status?: "DRAFT" | "READY" | "DEPLOYED" | string;
  createdAt?: string;
  updatedAt?: string;
  serviceCount?: number;
  workflowCount?: number;
}

export interface MergeAnalysisResult {
  noConflict:  { tableName: string; ownerApplications: string[] }[];
  scenarioA:   { tableName: string; ownerApplications: string[]; ddlHash: string }[];
  scenarioB:   { tableName: string; ownerApplications: string[]; hashes: Record<string, string> }[];
}

export interface MergeStatus {
  targetDatabases: { dbName: string; status: string }[];
  moduleDataStatus: { appName: string; hasData: boolean; sourceType?: string }[];
}

export interface PackagePreview {
  infra: Record<string, number | string>;
  modules: Record<string, { hostPorts: Record<string, number>; env: Record<string, string> }>;
}

export interface PackageTask {
  taskId: string;
  status: "RUNNING" | "SUCCESS" | "FAILED" | string;
  progress?: number;
  logs?: string[];
  errorMessage?: string;
  downloadUrl?: string;
}

export async function getProjects(): Promise<ProjectItem[]> {
  return apiClient.get<ProjectItem[]>("/project/projects");
}

export async function getProject(id: string): Promise<ProjectItem> {
  return apiClient.get<ProjectItem>(`/project/projects/${id}`);
}

export async function createProject(name: string, description?: string): Promise<ProjectItem> {
  return apiClient.post<ProjectItem>("/project/projects", { name, description });
}

export async function getMergeAnalysis(projectId: string): Promise<MergeAnalysisResult> {
  return apiClient.get<MergeAnalysisResult>(`/project/projects/${projectId}/merge-analysis`);
}

export async function getMergeStatus(projectId: string): Promise<MergeStatus> {
  return apiClient.get<MergeStatus>(`/project/projects/${projectId}/merge-status`);
}

export async function deployProject(projectId: string): Promise<void> {
  return apiClient.post<void>(`/project/projects/${projectId}/deploy`);
}

export async function undeployProject(projectId: string): Promise<void> {
  return apiClient.post<void>(`/project/projects/${projectId}/undeploy`);
}

export async function getProjectInstances(projectId: string): Promise<unknown[]> {
  return apiClient.get<unknown[]>(`/project/projects/${projectId}/instances`);
}

export async function getPackagePreview(projectId: string): Promise<PackagePreview> {
  return apiClient.get<PackagePreview>(`/project/projects/${projectId}/package/preview`);
}

export async function startPackage(projectId: string, config?: PackagePreview): Promise<{ taskId: string }> {
  return apiClient.post<{ taskId: string }>(`/project/projects/${projectId}/package`, config ?? null);
}

export async function getPackageTaskStatus(projectId: string, taskId: string): Promise<PackageTask> {
  return apiClient.get<PackageTask>(`/project/projects/${projectId}/package-tasks/${taskId}`);
}

export async function getPackageTasks(projectId: string): Promise<PackageTask[]> {
  return apiClient.get<PackageTask[]>(`/project/projects/${projectId}/package-tasks`);
}
