/**
 * 数据库相关 React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDatabases,
  getDatabaseById,
  previewDatabase,
  uploadDatabase,
  deleteDatabase,
  updateDatabaseData,
  
  type DatabaseRecord,
  type UploadDatabaseParams,
} from '@/services/database.service';

/**
 * 获取数据库列表
 */
export function useDatabases() {
  return useQuery({
    queryKey: ['databases'],
    queryFn: getDatabases,
  });
}

/**
 * 获取单个数据库详情
 */
export function useDatabase(id: string) {
  return useQuery({
    queryKey: ['databases', id],
    queryFn: () => getDatabaseById(id),
    enabled: !!id,
  });
}

/**
 * 预览数据库数据
 */
export function useDatabasePreview(
  id: string,
  table?: string,
  limit?: number
) {
  return useQuery({
    queryKey: ['databases', id, 'preview', table, limit],
    queryFn: () => previewDatabase(id, table, limit),
    enabled: !!id,
  });
}

/**
 * 上传数据库
 */
export function useUploadDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UploadDatabaseParams) => uploadDatabase(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
    },
  });
}

/**
 * 删除数据库
 */
export function useDeleteDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDatabase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
    },
  });
}

/**
 * 更新数据库数据
 */
export function useUpdateDatabaseData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DatabaseRecord[] }) =>
      updateDatabaseData(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['databases', variables.id, 'preview'],
      });
    },
  });
}

