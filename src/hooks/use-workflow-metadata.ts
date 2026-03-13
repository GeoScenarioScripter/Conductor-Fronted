import { useQuery } from "@tanstack/react-query";
import {
  getApplicationsMetadata,
  getApplicationServices,
  getServiceDetail,
  getMethodDetail,
  type ApplicationMeta,
  type ServiceMeta,
  type ServiceDetail,
  type MethodDetail,
} from "@/services/workflow-metadata.service";

// 第一层：应用分组
export function useApplicationsMetadata() {
  return useQuery<ApplicationMeta[]>({
    queryKey: ["metadata", "applications"],
    queryFn: getApplicationsMetadata,
  });
}

// 第二层：某个应用下的服务列表
export function useApplicationServices(appName: string) {
  return useQuery<ServiceMeta[]>({
    queryKey: ["metadata", "applications", appName, "services"],
    queryFn: () => getApplicationServices(appName),
    enabled: !!appName,
  });
}

// 第三层：某个服务下的方法列表
export function useServiceDetail(appName: string, serviceName: string) {
  return useQuery<ServiceDetail>({
    queryKey: ["metadata", "applications", appName, "services", serviceName],
    queryFn: () => getServiceDetail(appName, serviceName),
    enabled: !!appName && !!serviceName,
  });
}

// 第四层：某个方法的详情（包含输入输出参数）
export function useMethodDetail(
  appName: string,
  serviceName: string,
  methodName: string
) {
  return useQuery<MethodDetail>({
    queryKey: [
      "metadata",
      "applications",
      appName,
      "services",
      serviceName,
      "methods",
      methodName,
    ],
    queryFn: () => getMethodDetail(appName, serviceName, methodName),
    enabled: !!appName && !!serviceName && !!methodName,
  });
}