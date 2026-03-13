/**
 * API 客户端配置
 * 统一处理请求拦截、响应拦截、错误处理等
 */

// 在开发环境中使用相对路径（通过 Vite 代理），在生产环境中使用完整 URL
const API_BASE_URL = import.meta.env.DEV
  ? '/api'  // 开发环境：使用相对路径，通过 Vite 代理
  : (import.meta.env.VITE_API_BASE_URL || 'http://223.2.46.78:8765/api');  // 生产环境：使用完整 URL

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * 构建完整的 URL
   * 处理相对路径和绝对路径两种情况
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    // 如果 baseURL 是相对路径（以 / 开头），直接拼接
    if (this.baseURL.startsWith('/')) {
      let url = `${this.baseURL}${endpoint}`;
      if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
      }
      return url;
    }

    // 如果是绝对路径，使用 URL 构造函数
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  /**
   * 获取请求头
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // 如果有 token，添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        message: `HTTP error! status: ${response.status}`,
        status: response.status,
      };

      try {
        const errorData = await response.json();
        error.message = errorData.message || error.message;
        error.code = errorData.code;
      } catch {
        // 如果响应不是 JSON，使用默认错误消息
      }

      throw error;
    }

    // 如果响应为空，返回 null
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null as T;
    }

    return response.json();
  }

  /**
   * GET 请求
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST 请求
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = this.buildUrl(endpoint);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT 请求
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = this.buildUrl(endpoint);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * DELETE 请求
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = this.buildUrl(endpoint);

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 文件上传
   */
  async upload<T>(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response as T);
          } catch {
            resolve(null as T);
          }
        } else {
          reject({
            message: `Upload failed with status: ${xhr.status}`,
            status: xhr.status,
          });
        }
      });

      xhr.addEventListener('error', () => {
        reject({
          message: 'Upload failed',
        });
      });

      const token = localStorage.getItem('token');
      const url = this.buildUrl(endpoint);
      xhr.open('POST', url);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  }
}

// 导出单例实例
export const apiClient = new ApiClient(API_BASE_URL);

