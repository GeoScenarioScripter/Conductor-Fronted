/**
 * 微应用相关 API 服务
 */
import { apiClient } from '@/lib/api-client';

export interface MicroApp {
  id: string;
  name: string;
  description: string;
  version: string;
  servicesCount: number;
  createdAt: string;
  thumbnail: string;
}

export interface DownloadConfigParams {
  appId: string;
  environment: 'docker' | 'k8s';
}

/**
 * 获取微应用列表
 */
export async function getApps(): Promise<MicroApp[]> {
  return apiClient.get<MicroApp[]>('/apps');
}

/**
 * 获取微应用详情
 */
export async function getAppById(id: string): Promise<MicroApp> {
  return apiClient.get<MicroApp>(`/apps/${id}`);
}

/**
 * 下载部署配置
 */
export async function downloadDeploymentConfig(
  params: DownloadConfigParams
): Promise<Blob> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/apps/${params.appId}/download?environment=${params.environment}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Download failed');
  }

  return response.blob();
}

