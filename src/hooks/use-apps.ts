/**
 * 微应用相关 React Query Hooks
 */
import { useQuery } from '@tanstack/react-query';
import { getApps, getAppById } from '@/services/apps.service';

/**
 * 获取微应用列表
 */
export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: getApps,
  });
}

/**
 * 获取单个微应用详情
 */
export function useApp(id: string) {
  return useQuery({
    queryKey: ['apps', id],
    queryFn: () => getAppById(id),
    enabled: !!id,
  });
}

