/**
 * 工作流相关 React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkflows,
  getWorkflowById,
  saveWorkflow,
  updateWorkflow,
  deleteWorkflow,
  runWorkflow,
  archiveWorkflow,
  getAvailableDatabases,
} from '@/services/workflow.service';

/**
 * 获取工作流列表
 */
export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: getWorkflows,
  });
}

/**
 * 获取单个工作流详情
 */
export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflows', id],
    queryFn: () => getWorkflowById(id),
    enabled: !!id,
  });
}

/**
 * 获取可用数据库列表
 */
export function useAvailableDatabases() {
  return useQuery({
    queryKey: ['workflows', 'available-databases'],
    queryFn: getAvailableDatabases,
  });
}

/**
 * 保存工作流
 */
export function useSaveWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflow: Parameters<typeof saveWorkflow>[0]) =>
      saveWorkflow(workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

/**
 * 更新工作流
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      workflow,
    }: {
      id: string;
      workflow: Parameters<typeof updateWorkflow>[1];
    }) => updateWorkflow(id, workflow),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({
        queryKey: ['workflows', variables.id],
      });
    },
  });
}

/**
 * 删除工作流
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

/**
 * 运行工作流
 */
export function useRunWorkflow() {
  return useMutation({
    mutationFn: (workflowId: string) => runWorkflow(workflowId),
  });
}

/**
 * 归档工作流
 */
export function useArchiveWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      archiveWorkflow(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

