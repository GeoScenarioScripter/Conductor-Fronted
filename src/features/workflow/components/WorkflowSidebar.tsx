import { type DragEvent, useState } from "react";
import { Server, GripVertical, ChevronRight, ChevronDown, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import {useApplicationsMetadata,useApplicationServices,useServiceDetail,} from "@/hooks/use-workflow-metadata";


export function WorkflowSidebar() {
  const onDragStart = (event: DragEvent, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData(
      "application/nodedata",
      JSON.stringify(nodeData)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  // 第一层：应用列表
  const {
    data: apps = [],
    isLoading,
    error,
  } = useApplicationsMetadata();

  return (
    <aside className="w-64 border-r border-border bg-sidebar/30 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Microservices
        </h3>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {isLoading && (
          <div className="text-xs text-muted-foreground">Loading...</div>
        )}
        {error && (
          <div className="text-xs text-destructive p-2 rounded bg-destructive/10">
            加载失败: {error instanceof Error ? error.message : '未知错误'}
            <br />
            <span className="text-[10px] opacity-75">
              请检查控制台获取详细信息
            </span>
          </div>
        )}

        {!isLoading &&
          !error &&
          (apps.length === 0 ? (
            <div className="text-xs text-muted-foreground">暂无应用</div>
          ) : (
            apps.map((app) => (
              <ServiceDomainGroup
                key={app.applicationName}
                app={app}
                onDragStart={onDragStart}
              />
            ))
          ))}
      </div>
    </aside>
  );
}

const ServiceDomainGroup = ({
  app,
  onDragStart,
}: {
  app: { applicationName: string; serviceCount: number };
  onDragStart: any;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // 第二层：该应用下的服务列表
  const { data: services = [], isLoading, error } = useApplicationServices(
    app.applicationName
  );

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full px-2 py-1 text-xs font-semibold tracking-wide
                   text-muted-foreground hover:text-foreground hover:bg-muted/40
                   rounded-md uppercase transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 mr-1" />
        ) : (
          <ChevronRight className="h-3 w-3 mr-1" />
        )}
        {app.applicationName} ({app.serviceCount})
      </button>

      {isOpen && (
        <div className="pl-2 space-y-1">
          {isLoading ? (
            <div className="text-xs text-muted-foreground px-2 py-1">
              Loading services...
            </div>
          ) : error ? (
            <div className="text-xs text-destructive px-2 py-1">
              加载服务失败: {error instanceof Error ? error.message : '未知错误'}
            </div>
          ) : services.length === 0 ? (
            <div className="text-xs text-muted-foreground px-2 py-1">
              暂无服务
            </div>
          ) : (
            services.map((s) => (
              <ServiceGroup
                key={s.serviceName}
                appName={app.applicationName}
                service={s}
                onDragStart={onDragStart}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const ServiceGroup = ({
  appName,
  service,
  onDragStart,
}: {
  appName: string;
  service: { serviceName: string; interfaceClass: string; version: string };
  onDragStart: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 第三层：某个服务的详情（methods）
  const { data, isLoading } = useServiceDetail(appName, service.serviceName);
  const methods = data?.methods ?? [];

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full p-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 mr-2" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-2" />
        )}
        <Box className="h-4 w-4 mr-2 text-primary/70" />
        {service.serviceName}
      </button>

      {isOpen && (
        <div className="pl-4 space-y-2">
          {isLoading ? (
            <div className="text-xs text-muted-foreground px-2 py-1">
              Loading methods...
            </div>
          ) : (
            methods.map((m) => (
            <div
                key={m.methodName}
              className={cn(
                "p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-primary/5 hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all group",
                "flex items-center gap-3"
              )}
              onDragStart={(event) =>
                  onDragStart(event, "microapplication", {
                    label: m.methodName,
                    description: m.description,
                    returnType: m.returnType,
                    parameterCount: m.parameterCount,
                    serviceName: service.serviceName,
                    appName,
                    methodName: m.methodName,
                    inputs: [],
                    outputs: [],
                })
              }
              draggable
            >
              <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <Server className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.methodName}
                  </p>
                <p className="text-[10px] text-muted-foreground truncate">
                    {m.description}
                </p>
              </div>
            </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// const ServiceGroup = ({ service, onDragStart }: { service: any; onDragStart: any }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className="space-y-1">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="flex items-center w-full p-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
//       >
//         {isOpen ? (
//           <ChevronDown className="h-4 w-4 mr-2" />
//         ) : (
//           <ChevronRight className="h-4 w-4 mr-2" />
//         )}
//         <Box className="h-4 w-4 mr-2 text-primary/70" />
//         {service.label}
//       </button>

//       {isOpen && (
//         <div className="pl-4 space-y-2">
//           {service.interfaces.map((iface: any) => (
//             <div
//               key={iface.id}
//               className={cn(
//                 "p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-primary/5 hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all group",
//                 "flex items-center gap-3"
//               )}
//               onDragStart={(event) =>
//                 onDragStart(event, iface.type, {
//                   ...iface.data,
//                   label: iface.label,
//                   serviceName: service.label, // Pass service name for context
//                 })
//               }
//               draggable
//             >
//               <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
//               <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
//                 <Server className="h-4 w-4 text-primary" />
//               </div>
//               <div className="min-w-0">
//                 <p className="text-sm font-medium truncate">{iface.label}</p>
//                 <p className="text-[10px] text-muted-foreground truncate">
//                   {iface.data.inputs.length} In • {iface.data.outputs.length}{" "}
//                   Out
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// // 外层分组：一个分组里包含多个微服务（ServiceGroup）
// const ServiceDomainGroup = ({group,onDragStart,}: {group: any;onDragStart: any }) => {
//   const [isOpen, setIsOpen] = useState(true);

//   return (
//     <div className="space-y-1">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="flex items-center w-full px-2 py-1 text-xs font-semibold tracking-wide
//                    text-muted-foreground hover:text-foreground hover:bg-muted/40
//                    rounded-md uppercase transition-colors"
//       >
//         {isOpen ? (
//           <ChevronDown className="h-3 w-3 mr-1" />
//         ) : (
//           <ChevronRight className="h-3 w-3 mr-1" />
//         )}
//         {group.label}
//       </button>

//       {isOpen && (
//         <div className="pl-2 space-y-1">
//           {group.services.map((service: any) => (
//             <ServiceGroup
//               key={service.id}
//               service={service}
//               onDragStart={onDragStart}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export function WorkflowSidebar() {
//   const onDragStart = (event: DragEvent, nodeType: string, nodeData: any) => {
//     event.dataTransfer.setData("application/reactflow", nodeType);
//     event.dataTransfer.setData(
//       "application/nodedata",
//       JSON.stringify(nodeData)
//     );
//     event.dataTransfer.effectAllowed = "move";
//   };

//   return (
//     <aside className="w-64 border-r border-border bg-sidebar/30 backdrop-blur-sm flex flex-col">
//       <div className="p-4 border-b border-border/50">
//         <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
//           Microservices
//         </h3>
//       </div>

//       <div className="p-4 space-y-3 overflow-y-auto flex-1">
//         {microserviceGroups.map((group) => (
//           <ServiceDomainGroup
//             key={group.id}
//             group={group}
//             onDragStart={onDragStart}
//           />
//         ))}
//       </div>
//     </aside>
//   );
// }
