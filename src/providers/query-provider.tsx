/**
 * React Query Provider 配置
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 失败后重试次数
      retry: 1,
      // 数据缓存时间（毫秒）
      staleTime: 5 * 60 * 1000, // 5分钟
      // 数据在缓存中保留的时间
      gcTime: 10 * 60 * 1000, // 10分钟
      // 窗口聚焦时重新获取数据
      refetchOnWindowFocus: false,
    },
    mutations: {
      // 失败后重试次数
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

