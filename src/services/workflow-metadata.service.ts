import { apiClient } from "@/lib/api-client";

// 第一层：应用列表
export interface ApplicationMeta {
  applicationName: string;     // demo-provider-auth
  serviceCount: number;
  instances: string[];
}

// 第二层：某个应用下的服务列表
export interface ServiceMeta {
  serviceType: string | null;
  interfaceClass: string;
  instanceId: string | null;
  serviceName: string;         // UserAccountService
  methodCount: number;
  version: string;
}

// 第三层：某个服务的详情（接口/方法）
export interface ServiceMethod {
  parameterCount: number;
  methodName: string;
  description: string;
  returnType: string;
}

export interface ServiceDetail {
  serviceType: string | null;
  interfaceClass: string;
  instanceId: string | null;
  serviceName: string;          // AuthService
  description: string;
  version: string;
  methodCount: number;
  methods: ServiceMethod[];
}

// 1) 应用列表
export function getApplicationsMetadata() {
  return apiClient.get<ApplicationMeta[]>("/metadata/applications");
}

// 2) 某个应用下的服务列表
export function getApplicationServices(appName: string) {
  // 确保应用名称正确编码
  const encodedAppName = encodeURIComponent(appName);
  const endpoint = `/metadata/applications/${encodedAppName}/services`;
  return apiClient.get<ServiceMeta[]>(endpoint);
}

// 3) 某个服务的详情（方法列表）
export function getServiceDetail(appName: string, serviceName: string) {
  // 确保应用名称和服务名称正确编码
  const encodedAppName = encodeURIComponent(appName);
  const encodedServiceName = encodeURIComponent(serviceName);
  const endpoint = `/metadata/applications/${encodedAppName}/services/${encodedServiceName}`;
  return apiClient.get<ServiceDetail>(endpoint);
}

// 4) 某个方法的详情（包含输入输出参数）
export interface MethodParameter {
  /** 顶层一般用 name 表示（如 request），内部字段通常用 fieldName 表示 */
  name?: string;
  fieldName?: string;
  type?: string;
  fields?: MethodParameter[];
}

export interface MethodDetail {
  methodName: string;
  description?: string;
  /** 返回类型（有些在顶层 returnType，有些在 responses[0].returnTypeName） */
  returnTypeName?: string;
  returnType?: string;
  parameters: MethodParameter[];
  /** 后端返回结构比较复杂，这里用 any[] 兼容（含 returnTypeName、fields 等） */
  responses: any[];
}

export function getMethodDetail(
  appName: string,
  serviceName: string,
  methodName: string
) {
  const encodedAppName = encodeURIComponent(appName);
  const encodedServiceName = encodeURIComponent(serviceName);
  const encodedMethodName = encodeURIComponent(methodName);
  const endpoint = `/metadata/applications/${encodedAppName}/services/${encodedServiceName}/methods/${encodedMethodName}`;
  return apiClient.get<MethodDetail>(endpoint);
}