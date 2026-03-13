export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'warning';

export type WorkflowStatus = 'active' | 'draft' | 'archived';

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
  baseUrl: string;
  thumbnail: string;
}

export interface ServiceInterface {
  id: string;
  name: string;
  type: string;
}

export interface MicroserviceNodeData extends Record<string, unknown> {
  label: string;
  serviceName?: string; // Added service name
  appName?: string; // 应用名称
  methodName?: string; // 方法名称
  description?: string;
  inputs: ServiceInterface[];
  outputs: ServiceInterface[];
  status: NodeStatus;
  db?: string;
  logs?: string[];
}
