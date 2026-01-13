/**
 * 数据库相关 API 服务
 */
import { apiClient } from '@/lib/api-client';

export interface DatabaseItem {
  id: string;
  name: string;
  type: 'PostgreSQL' | 'MySQL' | 'SQLite' | 'MinIO';
  size: string;
  records: number;
  lastModified: string;
}

export interface DatabaseRecord {
  id: number;
  [key: string]: unknown;
}

export interface UploadDatabaseParams {
  file?: File;
  type: string;
  minioConfig?: {
    ip: string;
    port: string;
    bucket: string;
  };
}

/**
 * 获取数据库列表
 */
export async function getDatabases(): Promise<DatabaseItem[]> {
  return apiClient.get<DatabaseItem[]>('/databases');
}

/**
 * 获取数据库详情
 */
export async function getDatabaseById(id: string): Promise<DatabaseItem> {
  return apiClient.get<DatabaseItem>(`/databases/${id}`);
}

/**
 * 预览数据库数据
 */
export async function previewDatabase(
  id: string,
  table?: string,
  limit?: number
): Promise<DatabaseRecord[]> {
  const params: Record<string, string> = {};
  if (table) params.table = table;
  if (limit) params.limit = limit.toString();

  return apiClient.get<DatabaseRecord[]>(`/databases/${id}/preview`, params);
}

/**
 * 上传数据库文件
 */
export async function uploadDatabase(
  params: UploadDatabaseParams
): Promise<DatabaseItem> {
  if (params.file) {
    return apiClient.upload<DatabaseItem>('/databases/upload', params.file);
  } else if (params.minioConfig) {
    return apiClient.post<DatabaseItem>('/databases/connect', {
      type: params.type,
      ...params.minioConfig,
    });
  }
  throw new Error('Either file or minioConfig must be provided');
}

/**
 * 删除数据库
 */
export async function deleteDatabase(id: string): Promise<void> {
  return apiClient.delete<void>(`/databases/${id}`);
}

/**
 * 更新数据库数据
 */
export async function updateDatabaseData(
  id: string,
  data: DatabaseRecord[]
): Promise<void> {
  return apiClient.put<void>(`/databases/${id}/data`, { data });
}

