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
  connectionUrl?: string;
  username?: string;
  enabled?: boolean;
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

interface DataSourceItem {
  id: number | string;
  name: string;
  type: 'POSTGRESQL' | 'MYSQL' | 'MINIO' | string;
  connectionUrl?: string;
  username?: string;
  enabled?: boolean;
  updatedAt?: string;
  createdAt?: string;
}

function normalizeDataSource(item: DataSourceItem): DatabaseItem {
  const typeMap: Record<string, DatabaseItem['type']> = {
    POSTGRESQL: 'PostgreSQL',
    MYSQL: 'MySQL',
    MINIO: 'MinIO',
    SQLITE: 'SQLite',
  };

  return {
    id: String(item.id),
    name: item.name,
    type: typeMap[String(item.type).toUpperCase()] ?? 'MySQL',
    size: '-',
    records: 0,
    lastModified: item.updatedAt ?? item.createdAt ?? '-',
    connectionUrl: item.connectionUrl,
    username: item.username,
    enabled: item.enabled,
  };
}

/**
 * 获取数据库列表
 */
export async function getDatabases(): Promise<DatabaseItem[]> {
  const data = await apiClient.get<DataSourceItem[]>('/fabricator/datasources');
  return data.map(normalizeDataSource);
}

/**
 * 获取数据库详情
 */
export async function getDatabaseById(id: string): Promise<DatabaseItem> {
  const data = await apiClient.get<DataSourceItem>(`/fabricator/datasources/${id}`);
  return normalizeDataSource(data);
}

/**
 * 预览数据库数据
 */
export async function previewDatabase(
  id: string,
  table?: string,
  limit?: number
): Promise<DatabaseRecord[]> {
  void id;
  void table;
  void limit;
  return [];
}

/**
 * 上传数据库文件
 */
export async function uploadDatabase(
  params: UploadDatabaseParams
): Promise<DatabaseItem> {
  if (params.file) {
    throw new Error('SQL import requires databaseName and dbType; use the Fabricator import flow.');
  } else if (params.minioConfig) {
    const created = await apiClient.post<{ id: number | string }>('/fabricator/datasources', {
      name: params.minioConfig.bucket,
      type: 'MINIO',
      connectionUrl: `http://${params.minioConfig.ip}:${params.minioConfig.port}`,
      username: 'minioadmin',
      password: '',
      enabled: true,
    });
    return getDatabaseById(String(created.id));
  }
  throw new Error('Either file or minioConfig must be provided');
}

/**
 * 删除数据库
 */
export async function deleteDatabase(id: string): Promise<void> {
  return apiClient.delete<void>(`/fabricator/datasources/${id}`);
}

/**
 * 更新数据库数据
 */
export async function updateDatabaseData(
  id: string,
  data: DatabaseRecord[]
): Promise<void> {
  void id;
  void data;
}
