/**
 * 文件上传相关 API 服务
 */
import { apiClient } from '@/lib/api-client';

export interface UploadResult {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
}

/**
 * 上传文件
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  return apiClient.upload<UploadResult>('/upload', file, onProgress);
}

