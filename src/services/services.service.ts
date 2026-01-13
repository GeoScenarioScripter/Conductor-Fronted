/**
 * 微服务相关 API 服务
 */
import { apiClient } from '@/lib/api-client';

export interface Service {
  id: string;
  name: string;
  version: string;
  type: string;
  db: string | null;
  status: 'active' | 'inactive';
  lastUpdated: string;
  envVars: Record<string, string>;
  logs: string[];
}

export interface UpdateServiceParams {
  name?: string;
  db?: string | null;
  status?: 'active' | 'inactive';
  envVars?: Record<string, string>;
}

/**
 * 获取微服务列表
 */
export async function getServices(): Promise<Service[]> {
  return apiClient.get<Service[]>('/services');
}

/**
 * 获取微服务详情
 */
export async function getServiceById(id: string): Promise<Service> {
  return apiClient.get<Service>(`/services/${id}`);
}

/**
 * 更新微服务
 */
export async function updateService(
  id: string,
  params: UpdateServiceParams
): Promise<Service> {
  return apiClient.put<Service>(`/services/${id}`, params);
}

/**
 * 删除微服务
 */
export async function deleteService(id: string): Promise<void> {
  return apiClient.delete<void>(`/services/${id}`);
}

/**
 * 切换微服务状态
 */
export async function toggleServiceStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<Service> {
  return apiClient.put<Service>(`/services/${id}/status`, { status });
}

/**
 * 重启容器
 */
export async function restartContainer(id: string): Promise<void> {
  return apiClient.post<void>(`/services/${id}/restart`);
}

/**
 * 获取服务日志
 */
export async function getServiceLogs(
  id: string,
  limit?: number
): Promise<string[]> {
  const params: Record<string, string> = {};
  if (limit) params.limit = limit.toString();

  return apiClient.get<string[]>(`/services/${id}/logs`, params);
}

