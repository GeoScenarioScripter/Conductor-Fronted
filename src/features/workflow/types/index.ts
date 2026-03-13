export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'warning';

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
