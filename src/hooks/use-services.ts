/**
 * 微服务相关 React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getServices,
  getServiceById,
  updateService,
  deleteService,
  toggleServiceStatus,
  restartContainer,
  getServiceLogs,
 
  type UpdateServiceParams,
} from '@/services/services.service';

/**
 * 获取微服务列表
 */
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  });
}

/**
 * 获取单个微服务详情
 */
export function useService(id: string) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: () => getServiceById(id),
    enabled: !!id,
  });
}

/**
 * 获取服务日志
 */
export function useServiceLogs(id: string, limit?: number) {
  return useQuery({
    queryKey: ['services', id, 'logs', limit],
    queryFn: () => getServiceLogs(id, limit),
    enabled: !!id,
    refetchInterval: 5000, // 每5秒刷新一次日志
  });
}

/**
 * 更新微服务
 */
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateServiceParams }) =>
      updateService(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({
        queryKey: ['services', variables.id],
      });
    },
  });
}

/**
 * 删除微服务
 */
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

/**
 * 切换微服务状态
 */
export function useToggleServiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'active' | 'inactive';
    }) => toggleServiceStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({
        queryKey: ['services', variables.id],
      });
    },
  });
}

/**
 * 重启容器
 */
export function useRestartContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restartContainer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['services', id, 'logs'],
      });
    },
  });
}

