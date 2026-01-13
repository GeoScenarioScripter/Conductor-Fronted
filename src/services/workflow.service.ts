/**
 * 工作流相关 API 服务
 */
import { apiClient } from '@/lib/api-client';

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    status?: 'idle' | 'running' | 'success' | 'error' | 'warning';
    db?: string[];
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 获取工作流列表
 */
export async function getWorkflows(): Promise<Workflow[]> {
  return apiClient.get<Workflow[]>('/workflows');
}

/**
 * 获取工作流详情
 */
export async function getWorkflowById(id: string): Promise<Workflow> {
  return apiClient.get<Workflow>(`/workflows/${id}`);
}

/**
 * 保存工作流
 */
export async function saveWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
  return apiClient.post<Workflow>('/workflows', workflow);
}

/**
 * 更新工作流
 */
export async function updateWorkflow(
  id: string,
  workflow: Partial<Workflow>
): Promise<Workflow> {
  return apiClient.put<Workflow>(`/workflows/${id}`, workflow);
}

/**
 * 删除工作流
 */
export async function deleteWorkflow(id: string): Promise<void> {
  return apiClient.delete<void>(`/workflows/${id}`);
}

/**
 * 运行工作流
 */
export async function runWorkflow(workflowId: string): Promise<{ status: string; result?: unknown }> {
  return apiClient.post<{ status: string; result?: unknown }>(
    `/workflows/${workflowId}/run`
  );
}

/**
 * 归档工作流
 */
export async function archiveWorkflow(
  id: string,
  archiveName: string
): Promise<void> {
  return apiClient.post<void>(`/workflows/${id}/archive`, { name: archiveName });
}

/**
 * 获取可用数据库列表
 */
export async function getAvailableDatabases(): Promise<string[]> {
  return apiClient.get<string[]>('/workflows/available-databases');
}

