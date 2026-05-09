import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects, getProject, createProject,
  getMergeAnalysis, getMergeStatus,
  deployProject, undeployProject,
  getProjectInstances, getPackagePreview,
  startPackage, getPackageTaskStatus, getPackageTasks,
} from "@/services/projects.service";

export function useProjects() {
  return useQuery({ queryKey: ["projects"], queryFn: getProjects });
}

export function useProject(id: string) {
  return useQuery({ queryKey: ["projects", id], queryFn: () => getProject(id), enabled: !!id });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) => createProject(name, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useMergeAnalysis(projectId: string) {
  return useQuery({ queryKey: ["projects", projectId, "merge-analysis"], queryFn: () => getMergeAnalysis(projectId), enabled: !!projectId });
}

export function useMergeStatus(projectId: string) {
  return useQuery({ queryKey: ["projects", projectId, "merge-status"], queryFn: () => getMergeStatus(projectId), enabled: !!projectId });
}

export function useDeployProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => deployProject(projectId),
    onSuccess: (_, projectId) => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useUndeployProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => undeployProject(projectId),
    onSuccess: (_, projectId) => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useProjectInstances(projectId: string) {
  return useQuery({ queryKey: ["projects", projectId, "instances"], queryFn: () => getProjectInstances(projectId), enabled: !!projectId });
}

export function usePackagePreview(projectId: string) {
  return useQuery({ queryKey: ["projects", projectId, "package-preview"], queryFn: () => getPackagePreview(projectId), enabled: !!projectId });
}

export function useStartPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, config }: { projectId: string; config?: any }) => startPackage(projectId, config),
    onSuccess: (_, { projectId }) => qc.invalidateQueries({ queryKey: ["projects", projectId, "package-tasks"] }),
  });
}

export function usePackageTaskStatus(projectId: string, taskId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "package-tasks", taskId],
    queryFn: () => getPackageTaskStatus(projectId, taskId),
    enabled: !!projectId && !!taskId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "RUNNING" ? 2000 : false;
    },
  });
}

export function usePackageTasks(projectId: string) {
  return useQuery({ queryKey: ["projects", projectId, "package-tasks"], queryFn: () => getPackageTasks(projectId), enabled: !!projectId });
}
