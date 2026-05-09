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

// ===== Workflow definition export (DAG JSON) =====
export interface WorkflowDefinitionEdge {
  id: string;
  source: string;
  target: string;
  type: string; // e.g. SEQUENCE
}

export interface WorkflowDefinitionNode {
  id: string;
  name: string;
  type: string; // e.g. SERVICE_CALL
  inputParams: Record<string, unknown>;
  serviceInvocation?: Record<string, unknown>;
}

export interface WorkflowDefinitionPayload {
  workflowName: string;
  workflowDescription?: string;
  version: string;
  dagJson: {
    nodes: WorkflowDefinitionNode[];
    edges: WorkflowDefinitionEdge[];
  };
  inputs?: Record<string, unknown>;
  outputs?: unknown[];
}

/**
 * 提交/导出工作流定义（DAG JSON）
 * 注意：后端接口路径需与后端一致
 */
export async function submitWorkflowDefinition(payload: WorkflowDefinitionPayload): Promise<unknown> {
  return apiClient.post<unknown>('/conductor/workflow/definitions', payload);
}

/**
 * 获取工作流列表
 */
export async function getWorkflows(): Promise<any> {
  return apiClient.get<any>('/conductor/workflow/definitions');
}

/**
 * 获取工作流详情
 */
export async function getWorkflowById(id: string): Promise<Workflow> {
  return apiClient.get<Workflow>(`/conductor/workflow/definitions/${id}`);
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
  return apiClient.put<Workflow>(`/conductor/workflow/definitions/${id}`, workflow);
}

/**
 * 删除工作流
 */
export async function deleteWorkflow(id: string): Promise<void> {
  return apiClient.delete<void>(`/conductor/workflow/definitions/${id}`);
}

/**
 * 运行工作流
 */
export async function runWorkflow(workflowId: string): Promise<{ status: string; result?: unknown }> {
  return apiClient.post<{ status: string; result?: unknown }>(
    `/conductor/workflow/definitions/${workflowId}/execute`
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
  return apiClient.get<string[]>('/conductor/workflow/definitions/available-nodes');
}
