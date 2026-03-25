import { apiClient } from "@/lib/api-client";

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  confirmPassword?: string;
}

export async function login(params: LoginParams): Promise<any> {
  return apiClient.post<any>("/auth/login", params);
}

export async function register(params: RegisterParams): Promise<any> {
  return apiClient.post<any>("/auth/register", params);
}

