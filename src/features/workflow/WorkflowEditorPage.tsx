import { useCallback, useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WorkflowSidebar } from "./components/WorkflowSidebar";
import { MicroserviceNode } from "./components/MicroserviceNode";
import { WorkflowContextMenu } from "./components/WorkflowContextMenu";
import { Play, Download, Archive, Save, Database, X, Edit, ArrowRight, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMethodDetail } from "@/hooks/use-workflow-metadata";
import type { ServiceInterface } from "./types";
import { getMethodDetail, getServiceDetail } from "@/services/workflow-metadata.service";
import { getWorkflows, submitWorkflowDefinition } from "@/services/workflow.service";

type FieldMapping = { sourceField: string; targetField: string };

function extractLeafPathsFromParamTree(nodes: any[], parentPath = ""): string[] {
  if (!nodes || nodes.length === 0) return [];

  const paths: string[] = [];
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const simpleType =
      typeof node?.type === "string"
        ? (node.type as string).split(".").slice(-1)[0]
        : undefined;
    const name = node?.name || node?.fieldName || simpleType || `field_${index}`;
    const path = parentPath ? `${parentPath}.${name}` : name;
    const hasChildren = Array.isArray(node?.fields) && node.fields.length > 0;

    if (hasChildren) {
      paths.push(...extractLeafPathsFromParamTree(node.fields, path));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function setByPath(obj: Record<string, any>, path: string, value: any) {
  const parts = path.split(".").filter(Boolean);
  let cur: any = obj;
  parts.forEach((key, idx) => {
    const isLast = idx === parts.length - 1;
    if (isLast) {
      cur[key] = value;
    } else {
      cur[key] = cur[key] && typeof cur[key] === "object" ? cur[key] : {};
      cur = cur[key];
    }
  });
}

function toNodeKey(nodeData: any): string | null {
  const appName = nodeData?.appName;
  const serviceName = nodeData?.serviceName;
  const methodName = nodeData?.methodName;
  if (!appName || !serviceName || !methodName) return null;
  return `${appName}.${serviceName}.${methodName}`;
}

function extractDefinitions(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.definitions)) return raw.definitions;
  if (Array.isArray(raw?.data?.definitions)) return raw.data.definitions;
  return [];
}

function deriveMethodInfoFromDagNode(dagNode: any): {
  appName?: string;
  serviceName?: string;
  methodName?: string;
} {
  const serviceInvocation = dagNode?.serviceInvocation || {};
  // Prefer serviceInvocation because it contains full identifiers.
  const appName = serviceInvocation?.applicationName;
  const methodName = serviceInvocation?.methodName || dagNode?.methodName;

  // interfaceClass: com.xxx.api.AuthService -> AuthService
  const interfaceClass: string | undefined = serviceInvocation?.interfaceClass;
  const serviceName =
    interfaceClass && typeof interfaceClass === "string"
      ? interfaceClass.split(".").slice(-1)[0]
      : undefined;

  // Fallback: parse dagNode.id: app.service.method
  const parts = typeof dagNode?.id === "string" ? dagNode.id.split(".") : [];
  if (parts.length >= 3) {
    return {
      appName: parts[0] || appName,
      serviceName: parts[1] || serviceName,
      methodName: parts[2] || methodName,
    };
  }

  return { appName, serviceName, methodName };
}

// Define custom node types
const nodeTypes = {
  microapplication: MicroserviceNode,
};

// 自定义 Edge 组件，带修改按钮
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const explanation = (data as any)?.explanation;

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <button
            onClick={() => {
              // 触发修改映射事件
              const event = new CustomEvent("editEdgeMapping", {
                detail: {
                  edgeId: id,
                  mappings: data?.mappings || [],
                  explanation: data?.explanation || "",
                },
              });
              window.dispatchEvent(event);
            }}
            className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg hover:bg-primary/90 transition-colors"
            title="修改映射"
          >
            <Settings className="h-3 w-3" />
          </button>
          {explanation ? (
            <div
              className="text-[10px] bg-background/70 border border-border/60 rounded px-1 py-[1px] max-w-[220px] truncate ml-2"
              title={String(explanation)}
            >
              {String(explanation)}
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Define custom edge types
const edgeTypes = {
  default: CustomEdge,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Temporary Button Component until Shadcn is fully set up
const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "primary",
}: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
      ${
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
      }
    `}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isHydrating, setIsHydrating] = useState(false);

  // Export click flow:
  // - if mappings incomplete -> show warning dialog
  // - else -> show initial node inputs dialog
  const [isMappingWarningOpen, setIsMappingWarningOpen] = useState(false);
  const [mappingWarningData, setMappingWarningData] = useState<{
    unmappedByNode: Array<{ nodeId: string; label: string; missingTargets: string[] }>;
    totalNodesChecked: number;
  } | null>(null);

  const [isInitialInputsOpen, setIsInitialInputsOpen] = useState(false);
  const [initialInputsData, setInitialInputsData] = useState<{
    entryNodes: Array<{ nodeId: string; label: string; requiredInputs: string[] }>;
    totalNodesChecked: number;
  } | null>(null);
  const [workflowInputValues, setWorkflowInputValues] = useState<Record<string, string>>({});

  const setWorkflowInputValue = useCallback((path: string, value: string) => {
    setWorkflowInputValues((prev) => ({ ...prev, [path]: value }));
  }, []);

  const buildWorkflowInputJsonFromValues = useCallback(() => {
    // build nested object from paths like request.username
    const root: any = {};
    for (const [path, raw] of Object.entries(workflowInputValues)) {
      if (!path) continue;
      const value = raw;
      const parts = path.split(".").filter(Boolean);
      if (parts.length === 0) continue;
      let cur = root;
      for (let i = 0; i < parts.length; i++) {
        const key = parts[i]!;
        const isLast = i === parts.length - 1;
        if (isLast) {
          cur[key] = value;
        } else {
          cur[key] = cur[key] && typeof cur[key] === "object" ? cur[key] : {};
          cur = cur[key];
        }
      }
    }
    return JSON.stringify(root, null, 2);
  }, [workflowInputValues]);

  const workflowInputStorageKey = `conductor.workflowInput.${id || "new"}`;

  // 当从“工作流管理”进入编辑页时，自动加载已导出的工作流 DAG
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const hydrate = async () => {
      setIsHydrating(true);
      try {
        const resp: any = await getWorkflows();
        const definitions = extractDefinitions(resp);
        const workflowDef =
          definitions.find(
            (d: any) =>
              String(d?.id ?? "") === String(id) ||
              String(d?.workflowDefId ?? "") === String(id)
          ) || null;

        if (!workflowDef) {
          if (!cancelled) {
            setNodes([]);
            setEdges([]);
          }
          return;
        }

        const dagNodes = (workflowDef?.dagDefinition?.nodes || []) as any[];
        const dagEdges = (workflowDef?.dagDefinition?.edges || []) as any[];
        const workflowDescription = String(workflowDef?.workflowDescription || "");
        const connectionOverviewParts = workflowDescription
          .split(/[；;]+/g)
          .map((s) => s.trim())
          .filter(Boolean);

        // Simple DAG layout: assign layers by topological order
        const incomingCount = new Map<string, number>();
        const outgoing = new Map<string, string[]>();
        dagNodes.forEach((n) => {
          incomingCount.set(n.id, 0);
          outgoing.set(n.id, []);
        });
        dagEdges.forEach((e) => {
          if (!incomingCount.has(e.target)) return;
          incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
          if (outgoing.has(e.source)) {
            outgoing.get(e.source)!.push(e.target);
          }
        });

        const level = new Map<string, number>();
        const queue: string[] = [];
        dagNodes.forEach((n) => {
          if ((incomingCount.get(n.id) || 0) === 0) {
            level.set(n.id, 0);
            queue.push(n.id);
          }
        });

        // Fallback for cycles / missing incoming edges
        if (queue.length === 0) {
          dagNodes.forEach((n) => {
            level.set(n.id, 0);
            queue.push(n.id);
            outgoing.set(n.id, outgoing.get(n.id) || []);
          });
        }

        while (queue.length > 0) {
          const cur = queue.shift()!;
          const curLv = level.get(cur) || 0;
          const outs = outgoing.get(cur) || [];
          outs.forEach((t) => {
            incomingCount.set(t, (incomingCount.get(t) || 0) - 1);
            const nextLv = curLv + 1;
            if ((level.get(t) ?? 0) < nextLv) level.set(t, nextLv);
            if ((incomingCount.get(t) || 0) === 0) queue.push(t);
          });
        }

        const levelToNodes = new Map<number, string[]>();
        dagNodes.forEach((n) => {
          const lv = level.get(n.id) ?? 0;
          const arr = levelToNodes.get(lv) || [];
          arr.push(n.id);
          levelToNodes.set(lv, arr);
        });

        const positions: Record<string, { x: number; y: number }> = {};
        const xGap = 340;
        const yGap = 160;
        const sortedLevels = Array.from(levelToNodes.keys()).sort((a, b) => a - b);
        sortedLevels.forEach((lv, lvIndex) => {
          const arr = (levelToNodes.get(lv) || []).slice().sort();
          arr.forEach((nodeId, idx) => {
            positions[nodeId] = { x: lvIndex * xGap, y: idx * yGap };
          });
        });

        const newNodes: Node[] = dagNodes.map((dn) => {
          const methodInfo = deriveMethodInfoFromDagNode(dn);
          return {
            id: dn.id,
            type: "microapplication",
            position: positions[dn.id] || { x: 0, y: 0 },
            data: {
              label: dn.name || dn.id,
              description: "",
              status: "idle",
              appName: methodInfo.appName,
              serviceName: methodInfo.serviceName,
              methodName: methodInfo.methodName,
              inputs: [],
              outputs: [],
              db: dn?.db,
            },
          };
        });

        // 由 dagDefinition.nodes[].inputParams 反推每条边的字段映射，
        // 使得再次点击“配置连接/编辑映射”时能看到你当时配置的 mappings。
        const mappingByEdgeKey = new Map<string, FieldMapping[]>();
        const addMapping = (sourceNodeId: string, targetNodeId: string, mapping: FieldMapping) => {
          const key = `${sourceNodeId}=>${targetNodeId}`;
          const arr = mappingByEdgeKey.get(key) || [];
          arr.push(mapping);
          mappingByEdgeKey.set(key, arr);
        };

        const incomingSourcesByTarget = new Map<string, string[]>();
        dagEdges.forEach((de) => {
          const arr = incomingSourcesByTarget.get(de.target) || [];
          arr.push(de.source);
          incomingSourcesByTarget.set(de.target, Array.from(new Set(arr)));
        });

        const walkInputParams = (obj: any, parentPath: string, targetNodeId: string) => {
          if (obj == null) return;
          if (typeof obj === "string") {
            const s = obj.trim();
            const m = s.match(/^\$\{([^}]+)\}$/);
            if (!m) return;
            const inner = m[1];

            // 形如 workflow.input.xxx / env.xxx：
            // 表达式里不带 sourceNodeId，所以只能把它挂到该目标节点的第一条入边上用于回显。
            if (inner.startsWith("workflow.input.") || inner.startsWith("env.")) {
              const fallbackSourceNodeId = (incomingSourcesByTarget.get(targetNodeId) || [])[0];
              if (fallbackSourceNodeId && parentPath) {
                addMapping(fallbackSourceNodeId, targetNodeId, {
                  sourceField: inner,
                  targetField: parentPath,
                });
              }
              return;
            }

            // 形如: <sourceNodeId>.result.<SourceField>
            const rm = inner.match(/^(.+)\.result\.(.+)$/);
            if (!rm) return;

            const sourceNodeId = rm[1];
            const sourceField = rm[2];
            if (parentPath) {
              addMapping(sourceNodeId, targetNodeId, {
                sourceField,
                targetField: parentPath,
              });
            }
            return;
          }

          if (Array.isArray(obj)) return;
          if (typeof obj !== "object") return;

          Object.entries(obj).forEach(([k, v]) => {
            const nextPath = parentPath ? `${parentPath}.${k}` : k;
            walkInputParams(v, nextPath, targetNodeId);
          });
        };

        for (const dn of dagNodes as any[]) {
          const inputParams = dn?.inputParams || {};
          walkInputParams(inputParams, "", dn.id);
        }

        const newEdges: Edge[] = dagEdges.map((de, idx) => ({
          id: `edge-${idx + 1}`,
          source: de.source,
          target: de.target,
          animated: true,
          type: "default",
          style: { stroke: "hsl(var(--primary))" },
          data: {
            mappings: (mappingByEdgeKey.get(`${de.source}=>${de.target}`) || []).map((m) => ({
              sourceField: m.sourceField,
              targetField: m.targetField,
            })),
            explanation: de.description || connectionOverviewParts[idx] || "",
          },
        }));

        if (!cancelled) {
          setNodes(newNodes);
          setEdges(newEdges);
        }

        // Hydrate inputs/outputs for methods so connection config has trees
        const extractFields = (params: any[]): any[] => {
          if (!params || params.length === 0) return [];
          return params.flatMap((param) => {
            if (param.fields && Array.isArray(param.fields)) {
              return param.fields;
            }
            if (param.fieldName) return [param];
            return [];
          });
        };

        for (const rn of newNodes as any[]) {
          const d = rn.data || {};
          if (!d.appName || !d.serviceName || !d.methodName) continue;
          try {
            const methodDetail = await getMethodDetail(d.appName, d.serviceName, d.methodName);
            const inputFields = extractFields(methodDetail?.parameters || []);
            const outputFields = extractFields(methodDetail?.responses || []).filter(
              (f: any) => (f?.fieldName || "").toString().toLowerCase() !== "success"
            );

            const inputs: ServiceInterface[] = inputFields.map(
              (field: any, index: number) => ({
                id: `input-${rn.id}-${field.fieldName || "field"}-${index}`,
                name: field.fieldName || `field_${index}`,
                type: field.type || "any",
              })
            );

            const outputs: ServiceInterface[] = outputFields.map(
              (field: any, index: number) => ({
                id: `output-${rn.id}-${field.fieldName || "field"}-${index}`,
                name: field.fieldName || `field_${index}`,
                type: field.type || "any",
              })
            );

            if (cancelled) return;
            setNodes((prev) =>
              prev.map((n) =>
                n.id === rn.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        inputs,
                        outputs,
                      },
                    }
                  : n
              )
            );
          } catch {
            // ignore hydrate failures (still show nodes/edges)
          }
        }
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [id, setEdges, setNodes]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(workflowInputStorageKey);
      if (saved) {
        // validate JSON
        const obj = JSON.parse(saved);
        // only support object storage; if not, ignore
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
          const flatten = (o: any, prefix = "", out: Record<string, string> = {}) => {
            Object.entries(o || {}).forEach(([k, v]) => {
              const path = prefix ? `${prefix}.${k}` : k;
              if (v && typeof v === "object" && !Array.isArray(v)) {
                flatten(v, path, out);
              } else {
                out[path] = v == null ? "" : String(v);
              }
            });
            return out;
          };
          setWorkflowInputValues((prev) => ({ ...prev, ...flatten(obj) }));
        }
      }
    } catch {
      // ignore corrupted storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowInputStorageKey]);

  const saveWorkflowInputToWorkflow = useCallback(() => {
    const raw = buildWorkflowInputJsonFromValues();
    // validate JSON
    JSON.parse(raw);
    localStorage.setItem(workflowInputStorageKey, raw);
  }, [buildWorkflowInputJsonFromValues, workflowInputStorageKey]);

  const buildWorkflowDefinitionPayload = useCallback(
    async (entryNodeIds: string[]) => {
      const workflowName = id ? `Workflow ${id.slice(0, 8)}` : "New Workflow";
      const version = "1.0.0";

      // cache method & service detail
      const methodCache = new Map<string, any>();
      const serviceCache = new Map<string, any>();

      const getNodeMethodDetail = async (node: any) => {
        if (methodCache.has(node.id)) return methodCache.get(node.id);
        const data = node?.data || {};
        if (!data.appName || !data.serviceName || !data.methodName) {
          methodCache.set(node.id, null);
          return null;
        }
        const detail = await getMethodDetail(data.appName, data.serviceName, data.methodName);
        methodCache.set(node.id, detail);
        return detail;
      };

      const getNodeServiceDetail = async (node: any) => {
        if (serviceCache.has(node.id)) return serviceCache.get(node.id);
        const data = node?.data || {};
        if (!data.appName || !data.serviceName) {
          serviceCache.set(node.id, null);
          return null;
        }
        const detail = await getServiceDetail(data.appName, data.serviceName);
        serviceCache.set(node.id, detail);
        return detail;
      };

      // build nodeKey map
      const nodeKeyById = new Map<string, string>();
      (nodes as any[]).forEach((n) => {
        const key = toNodeKey(n.data);
        if (key) nodeKeyById.set(n.id, key);
      });

      // build inputParams for each node from mappings
      const incomingEdgesByTarget = new Map<string, any[]>();
      (edges as any[]).forEach((e) => {
        const t = e?.target;
        if (!t) return;
        incomingEdgesByTarget.set(t, [...(incomingEdgesByTarget.get(t) || []), e]);
      });

      const dagNodes: any[] = [];
      const inputsMeta: Record<string, unknown> = {};

      for (const n of nodes as any[]) {
        const nodeKey = nodeKeyById.get(n.id) || n.id;
        const detail = await getNodeMethodDetail(n);
        const serviceDetail = await getNodeServiceDetail(n);

        // build inputParams
        const inputParams: Record<string, any> = {};
        const isEntry = entryNodeIds.includes(n.id);

        if (isEntry) {
          // for entry nodes: bind all leaf inputs to workflow.input.<path>
          const required = extractLeafPathsFromParamTree(detail?.parameters || [], "");
          required.forEach((p) => setByPath(inputParams, p, `\${workflow.input.${p}}`));
        } else {
          const incoming = incomingEdgesByTarget.get(n.id) || [];
          incoming.forEach((e) => {
            const sourceId = e?.source;
            const sourceKey = sourceId ? nodeKeyById.get(sourceId) : null;
            const mappings = (e?.data?.mappings || []) as FieldMapping[];
            mappings.forEach((m) => {
              if (!m?.targetField || !m?.sourceField) return;
              let expr = m.sourceField;
              if (expr.startsWith("workflow.") || expr.startsWith("env.")) {
                expr = `\${${expr}}`;
              } else if (sourceKey) {
                // upstream output reference
                expr = `\${${sourceKey}.result.${expr}}`;
              } else {
                expr = `\${${expr}}`;
              }
              setByPath(inputParams, m.targetField, expr);
            });
          });
        }

        // inputs metadata: keep close to backend method detail shape
        if (detail?.parameters && Array.isArray(detail.parameters)) {
          inputsMeta[nodeKey] = detail.parameters.map((p: any) => ({
            name: p.name,
            simpleType: typeof p.type === "string" ? p.type.split(".").slice(-1)[0] : p.type,
            fullType: p.type,
            description: "",
            required: true,
            defaultValue: null,
            fields: (p.fields || []).map((f: any) => ({
              fieldName: f.fieldName,
              fieldSimpleType: typeof f.type === "string" ? f.type.split(".").slice(-1)[0] : f.type,
              fieldFullType: f.type,
              description: `${f.fieldName} (${typeof f.type === "string" ? f.type.split(".").slice(-1)[0] : "any"})`,
              required: false,
              example: null,
              allowableValues: null,
              nestedFields: f.fields || null,
            })),
          }));
        }

        dagNodes.push({
          id: nodeKey,
          name: n.data?.label || nodeKey,
          type: "SERVICE_CALL",
          inputParams,
          serviceInvocation: {
            applicationName: n.data?.appName,
            version: "1.0.0",
            interfaceClass: serviceDetail?.interfaceClass || n.data?.interfaceClass || "",
            methodName: n.data?.methodName,
            parameterTypes: (detail?.parameters || [])
              .map((p: any) => p.fullType || p.type)
              .filter(Boolean),
            loadBalance: "ROUND_ROBIN",
          },
        });
      }

      const dagEdges = (edges as any[]).map((e, idx) => ({
        // 使用简短的、与前端边 id 解耦的规则
        id: `edge-${idx + 1}`,
        source: nodeKeyById.get(e.source) || e.source,
        target: nodeKeyById.get(e.target) || e.target,
        type: "SEQUENCE",
      }));

      // 将“连接概述”汇总为工作流描述（不再写入 edge.description）
      const workflowDescription = (edges as any[])
        .map((e) => (e?.data?.explanation || "").toString().trim())
        .filter(Boolean)
        .join("；");

      // outputs: use sink nodes' responses[0] if present (simplified)
      const outgoingCount = new Map<string, number>();
      nodes.forEach((n) => outgoingCount.set(n.id, 0));
      edges.forEach((e: any) => {
        if (e?.source) outgoingCount.set(e.source, (outgoingCount.get(e.source) || 0) + 1);
      });
      const sinkNodes = (nodes as any[]).filter((n) => (outgoingCount.get(n.id) || 0) === 0);
      const outputs: any[] = [];
      for (const sn of sinkNodes) {
        const detail = await getNodeMethodDetail(sn);
        const responses = (detail?.responses || []) as any[];
        if (!responses.length) continue;
        const first = responses[0] || {};
        outputs.push({
          name: "response",
          simpleType:
            (first.returnTypeName || detail?.returnTypeName || detail?.returnType || "Response")
              .toString()
              .split(".")
              .slice(-1)[0],
          fullType: first.returnTypeName || detail?.returnTypeName || detail?.returnType,
          description: detail?.description || "",
          required: true,
          fields: (first.fields || []).map((f: any) => ({
            fieldName: f.fieldName,
            fieldSimpleType: typeof f.type === "string" ? f.type.split(".").slice(-1)[0] : f.type,
            fieldFullType: f.type,
            description: `${f.fieldName} (${typeof f.type === "string" ? f.type.split(".").slice(-1)[0] : "any"})`,
            required: false,
            example: null,
            allowableValues: null,
            nestedFields: f.fields || null,
          })),
        });
      }

      return {
        workflowName,
        workflowDescription,
        version,
        dagJson: { nodes: dagNodes, edges: dagEdges },
        inputs: inputsMeta,
        outputs,
      };
    },
    [edges, id, nodes]
  );

  // Archive & DB Mount State
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archiveName, setArchiveName] = useState("");

  const [isDbMountDialogOpen, setIsDbMountDialogOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedDb, setSelectedDb] = useState<string[]>([]);

  // 连接配置弹窗状态
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [existingMappings, setExistingMappings] = useState<Array<{ sourceField: string; targetField: string }>>([]);
  const [existingExplanation, setExistingExplanation] = useState<string>("");

  // Mock Databases available
  const availableDatabases = [
    "users_db",
    "orders_db",
    "local_store",
    "minio_storage",
  ];

  // Context Menu State
  const [menu, setMenu] = useState<{
    id: string;
    top: number;
    left: number;
  } | null>(null);

  // Description Edit State
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [descriptionText, setDescriptionText] = useState("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();

      if (reactFlowWrapper.current) {
        const pane = reactFlowWrapper.current.getBoundingClientRect();
        setMenu({
          id: node.id,
          top: event.clientY - pane.top,
          left: event.clientX - pane.left,
        });
      }
    },
    []
  );

  const onPaneClick = useCallback(() => setMenu(null), []);

  const handleCopyNode = useCallback(() => {
    if (!menu) return;
    const nodeToCopy = nodes.find((n) => n.id === menu.id);
    if (nodeToCopy) {
      const position = {
        x: nodeToCopy.position.x + 50,
        y: nodeToCopy.position.y + 50,
      };

      const newNode: Node = {
        ...nodeToCopy,
        id: uuidv4(),
        position,
        data: {
          ...nodeToCopy.data,
          label: `${nodeToCopy.data.label} (Copy)`,
        },
        selected: false,
      };

      setNodes((nds) => nds.concat(newNode));
    }
    setMenu(null);
  }, [menu, nodes, setNodes]);

  const handleDeleteNode = useCallback(() => {
    if (!menu) return;
    setNodes((nds) => nds.filter((n) => n.id !== menu.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== menu.id && e.target !== menu.id)
    );
    setMenu(null);
  }, [menu, setNodes, setEdges]);

  const handleEditDescriptionClick = useCallback(() => {
    if (!menu) return;
    const node = nodes.find((n) => n.id === menu.id);
    if (node) {
      setEditingNodeId(node.id);
      setDescriptionText((node.data.description as string) || "");
      setIsDescriptionDialogOpen(true);
    }
    setMenu(null);
  }, [menu, nodes]);

  const handleSaveDescription = () => {
    if (editingNodeId) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === editingNodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                description: descriptionText,
              },
            };
          }
          return node;
        })
      );
      setIsDescriptionDialogOpen(false);
      setEditingNodeId(null);
    }
  };

  // 监听修改映射事件
  useEffect(() => {
    const handleEditEdgeMapping = (event: CustomEvent) => {
      const { edgeId, mappings, explanation } = event.detail;
      const edge = edges.find((e) => e.id === edgeId);
      if (edge) {
        setEditingEdgeId(edgeId);
        setExistingMappings(mappings);
        setExistingExplanation(explanation || "");
        setPendingConnection({
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || null,
          targetHandle: edge.targetHandle || null,
        });
        setIsConnectionDialogOpen(true);
      }
    };

    window.addEventListener("editEdgeMapping" as any, handleEditEdgeMapping as EventListener);
    return () => {
      window.removeEventListener("editEdgeMapping" as any, handleEditEdgeMapping as EventListener);
    };
  }, [edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      // 拦截连接，弹出配置弹窗
      if (params.source && params.target) {
        // 新建连接时，清空上一次的编辑状态和映射
        setEditingEdgeId(null);
        setExistingMappings([]);
        setExistingExplanation("");
        setPendingConnection(params);
        setIsConnectionDialogOpen(true);
      } else {
        // 如果没有源或目标，直接添加连接
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "hsl(var(--primary))" },
          },
          eds
        )
        );
      }
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      const dataString = event.dataTransfer.getData("application/nodedata");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const data = JSON.parse(dataString);
      const nodeId = uuidv4();

      // 创建节点，先不设置 inputs 和 outputs
      const newNode: Node = {
        id: nodeId,
        type,
        position,
        data: { ...data, status: "idle", inputs: [], outputs: [] },
      };

      setNodes((nds) => nds.concat(newNode));

      // 如果有方法信息，自动获取方法详情并更新连接点
      if (data.appName && data.serviceName && data.methodName) {
        // 异步获取方法详情
        getMethodDetail(data.appName, data.serviceName, data.methodName)
          .then((methodDetail) => {
            // 提取输入输出参数
            const extractFields = (params: any[]): any[] => {
              if (!params || params.length === 0) return [];
              return params.flatMap((param) => {
                if (param.fields && Array.isArray(param.fields)) {
                  return param.fields;
                }
                if (param.fieldName) {
                  return [param];
                }
                return [];
              });
            };

            const inputFields = extractFields(methodDetail?.parameters || []);
            const outputFields = extractFields(methodDetail?.responses || []).filter(
              (field: { fieldName: string }) => field.fieldName.toLowerCase() !== "success"
            );

            // 转换为 ServiceInterface 格式
            const inputs: ServiceInterface[] = inputFields.map(
              (field: { fieldName: string; type?: string }, index: number) => ({
                id: `input-${nodeId}-${field.fieldName}-${index}`,
                name: field.fieldName,
                type: field.type || "any",
              })
            );

            const outputs: ServiceInterface[] = outputFields.map(
              (field: { fieldName: string; type?: string }, index: number) => ({
                id: `output-${nodeId}-${field.fieldName}-${index}`,
                name: field.fieldName,
                type: field.type || "any",
              })
            );

            // 更新节点的 inputs 和 outputs
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === nodeId) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      inputs,
                      outputs,
                    },
                  };
                }
                return node;
              })
            );
          })
          .catch((error) => {
            console.error("Failed to load method detail:", error);
          });
      }
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      const existingDb = node.data.db;
      // Handle legacy string or new array format
      if (Array.isArray(existingDb)) {
        setSelectedDb(existingDb as string[]);
      } else if (typeof existingDb === "string" && existingDb) {
        setSelectedDb([existingDb]);
      } else {
        setSelectedDb([]);
      }
      setIsDbMountDialogOpen(true);
    },
    []
  );

  const handleArchive = () => {
    setIsArchiveDialogOpen(true);
  };

  const confirmArchive = () => {
    if (archiveName) {
      console.log(`Archiving workflow as: ${archiveName}`);
      alert(`Workflow "${archiveName}" archived successfully!`);
      setIsArchiveDialogOpen(false);
      setArchiveName("");
    }
  };

  const handleSaveDbMount = () => {
    if (selectedNodeId) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                db: selectedDb,
              },
            };
          }
          return node;
        })
      );
      setIsDbMountDialogOpen(false);
    }
  };

  // Mock Run Function
  const handleRun = () => {
    // 1. Set all to running
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, status: "running" } }))
    );

    // 2. Simulate progressive success
    nodes.forEach((node, index) => {
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              // Randomly fail or warn for demo
              const rand = Math.random();
              let status = "success";
              if (rand > 0.9) status = "error";
              else if (rand > 0.8) status = "warning";

              return { ...n, data: { ...n.data, status } };
            }
            return n;
          })
        );
      }, (index + 1) * 1500);
    });
  };

  const handleExport = useCallback(async () => {
    // 1) Find entry nodes (no incoming edges)
    const incomingCount = new Map<string, number>();
    nodes.forEach((n) => incomingCount.set(n.id, 0));
    edges.forEach((e: any) => {
      if (e?.target) incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
    });
    const entryNodes = nodes.filter((n) => (incomingCount.get(n.id) || 0) === 0);

    // 2) Load method details for nodes that have method info
    const methodCache = new Map<string, any>();
    const getNodeMethodDetail = async (node: any) => {
      if (methodCache.has(node.id)) return methodCache.get(node.id);
      const data = node?.data || {};
      if (!data.appName || !data.serviceName || !data.methodName) {
        methodCache.set(node.id, null);
        return null;
      }
      try {
        const detail = await getMethodDetail(data.appName, data.serviceName, data.methodName);
        methodCache.set(node.id, detail);
        return detail;
      } catch {
        methodCache.set(node.id, null);
        return null;
      }
    };

    // 3) Build required leaf inputs for each node
    const requiredInputsByNodeId = new Map<string, string[]>();
    for (const node of nodes as any[]) {
      const detail = await getNodeMethodDetail(node);
      const params = (detail?.parameters || []) as any[];
      const leafPaths = extractLeafPathsFromParamTree(params, "");
      requiredInputsByNodeId.set(node.id, uniq(leafPaths));
    }

    // 4) Build mapped targets for each node from all incoming edges
    const mappedTargetsByNodeId = new Map<string, Set<string>>();
    nodes.forEach((n) => mappedTargetsByNodeId.set(n.id, new Set()));
    edges.forEach((e: any) => {
      const targetId = e?.target;
      const mappings = ((e?.data?.mappings as FieldMapping[]) || []) as FieldMapping[];
      if (!targetId || !mappedTargetsByNodeId.has(targetId)) return;
      const set = mappedTargetsByNodeId.get(targetId)!;
      mappings.forEach((m) => {
        if (m?.targetField) set.add(m.targetField);
      });
    });

    // 5) Validate: for each non-entry node, all required inputs must be mapped
    const unmappedByNode: Array<{ nodeId: string; label: string; missingTargets: string[] }> = [];
    for (const node of nodes as any[]) {
      const required = requiredInputsByNodeId.get(node.id) || [];
      if (required.length === 0) continue;

      const isEntry = entryNodes.some((en) => en.id === node.id);
      if (isEntry) continue; // entry node inputs come from external workflow input

      const mapped = mappedTargetsByNodeId.get(node.id) || new Set<string>();
      const missing = required.filter((p) => !mapped.has(p));
      if (missing.length > 0) {
        unmappedByNode.push({
          nodeId: node.id,
          label: (node.data?.label as string) || node.id,
          missingTargets: missing,
        });
      }
    }

    // 6) Entry node required inputs shown to user
    const entryNodeInputs = entryNodes.map((n: any) => ({
      nodeId: n.id,
      label: (n.data?.label as string) || n.id,
      requiredInputs: requiredInputsByNodeId.get(n.id) || [],
    }));

    // 7) implicit mapping check first
    if (unmappedByNode.length > 0) {
      setMappingWarningData({
        unmappedByNode,
        totalNodesChecked: nodes.length,
      });
      setIsMappingWarningOpen(true);
      return;
    }

    // 8) mapping ok -> ask for initial node inputs if needed
    if (entryNodeInputs.some((x) => x.requiredInputs.length > 0)) {
      setInitialInputsData({
        entryNodes: entryNodeInputs,
        totalNodesChecked: nodes.length,
      });
      const nextValues: Record<string, string> = {};
      entryNodeInputs.forEach((en) => {
        (en.requiredInputs || []).forEach((p) => {
          nextValues[p] = workflowInputValues[p] ?? "";
        });
      });
      setWorkflowInputValues(nextValues);
      setIsInitialInputsOpen(true);
      return;
    }

    alert("映射完整，且无初始节点入参需求（可继续实现实际导出逻辑）。");
  }, [nodes, edges, workflowInputValues]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-14 border-b border-border bg-background/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Workflow:{" "}
            <span className="text-foreground font-medium">{id ? `Workflow ${id.slice(0, 8)}` : "New Workflow"}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ActionButton icon={Play} label="Run" onClick={handleRun} />
          <ActionButton
            icon={Save}
            label="Save"
            variant="secondary"
            onClick={() => {}}
          />
          <ActionButton
            icon={Download}
            label="Export"
            variant="secondary"
            onClick={handleExport}
          />
          <ActionButton
            icon={Archive}
            label="Archive"
            variant="secondary"
            onClick={handleArchive}
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <WorkflowSidebar />
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          {isHydrating && (
            <div className="absolute inset-0 z-10 bg-background/40 backdrop-blur-sm flex items-center justify-center text-sm text-muted-foreground">
              正在加载工作流定义...
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="bg-background/20"
          >
            <Background
              color="hsl(var(--muted-foreground))"
              gap={20}
              size={1}
              className="opacity-10"
            />
            <Controls className="bg-card border border-border text-foreground [&>button]:!bg-card [&>button]:!border-border [&>button:hover]:!bg-accent [&>button]:!text-foreground" />
            <MiniMap
              className="bg-card border border-border"
              nodeColor="hsl(var(--primary))"
              maskColor="rgba(0,0,0,0.5)"
            />
            {menu && (
              <WorkflowContextMenu
                {...menu}
                onCopy={handleCopyNode}
                onEditDescription={handleEditDescriptionClick}
                onDelete={handleDeleteNode}
                onClose={() => setMenu(null)}
              />
            )}
          </ReactFlow>
        </div>
      </div>

      {/* Archive Dialog */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Archive Workflow
            </DialogTitle>
            <DialogDescription>
              Save the current workflow state to history archives.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="archive-name" className="mb-2 block">
              Archive Name
            </Label>
            <input
              id="archive-name"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g., v1.0-stable"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsArchiveDialogOpen(false)}
              className="sm:w-1/2"
            >
              Cancel
            </Button>
            <Button onClick={confirmArchive} className="sm:w-1/2">
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DB Mount Dialog */}
      <Dialog open={isDbMountDialogOpen} onOpenChange={setIsDbMountDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Mount Database
            </DialogTitle>
            <DialogDescription>
              Associate a database resource with this microapplication node.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/20">
              <Database className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                Selected Node:{" "}
                {
                  nodes.find((n) => n.id === selectedNodeId)?.data
                    .label as string
                }
              </span>
            </div>

            <div className="space-y-2">
              <Label>Select Databases (Multi-select)</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableDatabases.map((db) => (
                  <div
                    key={db}
                    onClick={() =>
                      setSelectedDb((prev) =>
                        prev.includes(db)
                          ? prev.filter((d) => d !== db)
                          : [...prev, db]
                      )
                    }
                    className={`cursor-pointer border rounded-md p-3 flex items-center gap-2 transition-all ${
                      selectedDb.includes(db)
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                        selectedDb.includes(db)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selectedDb.includes(db) && (
                        <div className="h-2 w-2 rounded-[1px] bg-primary-foreground" />
                      )}
                    </div>
                    <Database
                      className={`h-4 w-4 ${
                        selectedDb.includes(db)
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm">{db}</span>
                  </div>
                ))}
                <div
                  onClick={() => setSelectedDb([])}
                  className="cursor-pointer border rounded-md p-3 flex items-center gap-2 transition-all border-destructive/50 hover:bg-destructive/10 text-destructive"
                >
                  <X className="h-4 w-4" />
                  <span className="text-sm">Clear All</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDbMountDialogOpen(false)}
              className="sm:w-1/2"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDbMount} className="sm:w-1/2">
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Description Edit Dialog */}
      <Dialog
        open={isDescriptionDialogOpen}
        onOpenChange={setIsDescriptionDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Node Description
            </DialogTitle>
            <DialogDescription>
              Add a brief description for this microapplication node.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="node-description" className="mb-2 block">
              Description
            </Label>
            <textarea
              id="node-description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g., Handles user authentication"
              value={descriptionText}
              onChange={(e) => setDescriptionText(e.target.value)}
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDescriptionDialogOpen(false)}
              className="sm:w-1/2"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDescription} className="sm:w-1/2">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connection Configuration Dialog */}
      <Dialog
        open={isConnectionDialogOpen}
        onOpenChange={setIsConnectionDialogOpen}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              配置连接
            </DialogTitle>
            <DialogDescription>
              选择源方法的输出参数（或外部输入）和目标方法的输入参数进行连接
            </DialogDescription>
          </DialogHeader>
          {pendingConnection && (
            <ConnectionConfigDialogContent
              connection={pendingConnection}
              nodes={nodes}
              existingMappings={existingMappings}
              existingExplanation={existingExplanation}
              onConfirm={(mappings, explanation) => {
                if (pendingConnection && mappings.length > 0) {
                  if (editingEdgeId) {
                    // 更新现有边
                    setEdges((eds) =>
                      eds.map((edge) => {
                        if (edge.id === editingEdgeId) {
                          return {
                            ...edge,
                            data: { mappings, explanation },
                          };
                        }
                        return edge;
                      })
                    );
                  } else {
                    // 创建新边
                    setEdges((eds) =>
                      addEdge(
                        {
                          ...pendingConnection,
                          animated: true,
                          style: { stroke: "hsl(var(--primary))" },
                          data: { mappings, explanation },
                        },
                        eds
                      )
                    );
                  }
                }
                setIsConnectionDialogOpen(false);
                setPendingConnection(null);
                setEditingEdgeId(null);
                setExistingMappings([]);
                setExistingExplanation("");
              }}
              onCancel={() => {
                setIsConnectionDialogOpen(false);
                setPendingConnection(null);
                setExistingExplanation("");
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Mapping Warning Dialog (shown before initial inputs) */}
      <Dialog open={isMappingWarningOpen} onOpenChange={setIsMappingWarningOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>映射未完成，无法继续</DialogTitle>
            <DialogDescription>请先补齐缺失的参数映射后再继续。</DialogDescription>
          </DialogHeader>

          {mappingWarningData && (
            <div className="space-y-6 py-2">
              {/* Missing mappings */}
              {mappingWarningData.unmappedByNode.length > 0 && (
                <div className="border rounded-md p-4">
                  <div className="font-semibold text-sm mb-2">未完成映射的节点</div>
                  <div className="space-y-3">
                    {mappingWarningData.unmappedByNode.map((item) => (
                      <div key={item.nodeId} className="rounded-md border border-border/60 p-3 bg-muted/10">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          缺少映射（目标输入字段）共 {item.missingTargets.length} 个
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.missingTargets.map((p) => (
                            <div key={p} className="text-xs font-mono bg-background/60 border rounded px-2 py-1">
                              {p}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-3">
                    处理方式：打开对应连线的“配置连接”，为这些目标输入字段补齐映射（可以来自上游输出或外部输入）。
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMappingWarningOpen(false)}
              className="w-full"
            >
              我知道了，去补映射
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initial Node Inputs Dialog (shown only when mappings complete) */}
      <Dialog open={isInitialInputsOpen} onOpenChange={setIsInitialInputsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>初始节点输入参数</DialogTitle>
            <DialogDescription>请填写起始节点所需输入，点击“确定”将保存到该工作流。</DialogDescription>
          </DialogHeader>

          {initialInputsData && (
            <div className="space-y-6 py-2">
              {initialInputsData.entryNodes.some((x) => x.requiredInputs.length > 0) ? (
                <div className="border rounded-md p-4">
                  <div className="space-y-3">
                    {initialInputsData.entryNodes
                      .filter((x) => x.requiredInputs.length > 0)
                      .map((x) => (
                        <div key={x.nodeId} className="rounded-md border border-border/60 p-3 bg-muted/10">
                          <div className="text-sm font-medium">{x.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            该节点没有上游输入，请在下方直接填写所需字段：
                          </div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {x.requiredInputs.map((p) => (
                              <div key={p} className="space-y-1.5 rounded-md border bg-background/60 px-2 py-2">
                                <div className="text-xs font-mono">{p}</div>
                                <input
                                  value={workflowInputValues[p] ?? ""}
                                  onChange={(e) => setWorkflowInputValue(p, e.target.value)}
                                  placeholder={`请输入 ${p}`}
                                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">该工作流没有需要填写初始入参的起始节点。</div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsInitialInputsOpen(false)} className="sm:w-1/2">
              取消
            </Button>
            <Button
              onClick={() => {
                (async () => {
                  try {
                    // 1) persist workflow.input (local) for later mapping usage
                    saveWorkflowInputToWorkflow();

                    // 2) build + submit workflow definition payload
                    const entryNodeIds =
                      initialInputsData?.entryNodes?.map((x) => x.nodeId) || [];
                    const payload = await buildWorkflowDefinitionPayload(entryNodeIds);
                    await submitWorkflowDefinition(payload as any);

                    setIsInitialInputsOpen(false);
                    alert("已提交工作流定义到后端。");
                  } catch (e) {
                    alert(`提交失败：${e instanceof Error ? e.message : "未知错误"}`);
                  }
                })();
              }}
              className="sm:w-1/2"
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 连接配置弹窗内容组件
const ConnectionConfigDialogContent = ({
  connection,
  nodes,
  existingMappings = [],
  existingExplanation = "",
  onConfirm,
  onCancel,
}: {
  connection: Connection;
  nodes: Node[];
  existingMappings?: Array<{ sourceField: string; targetField: string }>;
  existingExplanation?: string;
  onConfirm: (
    mappings: Array<{ sourceField: string; targetField: string }>,
    explanation: string
  ) => void;
  onCancel: () => void;
}) => {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);
  const sourceData = sourceNode?.data as any;
  const targetData = targetNode?.data as any;

  // 获取源方法和目标方法的详情
  const { data: sourceMethodDetail } = useMethodDetail(
    sourceData?.appName || "",
    sourceData?.serviceName || "",
    sourceData?.methodName || ""
  );

  const { data: targetMethodDetail } = useMethodDetail(
    targetData?.appName || "",
    targetData?.serviceName || "",
    targetData?.methodName || ""
  );

  // ===== 参数树构建：按后端真实结构来识别顶层 =====
  // 输出：以 AuthResponse 这一类返回类型作为第一层节点，子节点来自 responses[0].fields
  const buildSourceOutputsTree = () => {
    if (!sourceMethodDetail) return [] as any[];
    const responses = (sourceMethodDetail.responses || []) as any[];
    if (!responses.length) return [] as any[];

    const first = responses[0] || {};
    const children = (first.fields || []) as any[];

    // 优先使用 responses[0].returnTypeName，其次用顶层 returnType / returnTypeName，最后用 "Response"
    const rootName =
      first.returnTypeName ||
      sourceMethodDetail.returnTypeName ||
      first.returnType ||
      sourceMethodDetail.returnType ||
      "Response";

    return [
      {
        name: rootName,
        type: first.returnType || sourceMethodDetail.returnType,
        fields: children,
      },
    ] as any[];
  };

  // 输入：直接使用 parameters，每个 parameter 的 name 作为第一层（如 request）
  const buildTargetInputsTree = () => {
    if (!targetMethodDetail) return [] as any[];
    return (targetMethodDetail.parameters || []) as any[];
  };

  // 过滤掉名为 success 的输出字段（任意层级），支持 name / fieldName
  const filterOutSuccess = (nodes: any[]): any[] =>
    nodes
      .filter((n) => {
        const nName = (n.name || n.fieldName || "").toString().toLowerCase();
        return nName !== "success";
      })
      .map((n) => ({
        ...n,
        fields: n.fields ? filterOutSuccess(n.fields) : undefined,
      }));

  const sourceOutputsTree = filterOutSuccess(buildSourceOutputsTree());
  const targetInputsTree = buildTargetInputsTree();

  const [expandedExternal, setExpandedExternal] = useState(true);
  const [expandedSource, setExpandedSource] = useState(true);
  const [expandedTarget, setExpandedTarget] = useState(true);
  const [expandedSourceKeys, setExpandedSourceKeys] = useState<string[]>([]);
  const [expandedTargetKeys, setExpandedTargetKeys] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Array<{ sourceField: string; targetField: string }>>(existingMappings);
  const [currentSourceField, setCurrentSourceField] = useState<string>("");
  const [currentTargetField, setCurrentTargetField] = useState<string>("");
  const [externalSourceExpr, setExternalSourceExpr] = useState<string>("");
  const [edgeExplanation, setEdgeExplanation] = useState<string>(existingExplanation || "");

  useEffect(() => {
    setEdgeExplanation(existingExplanation || "");
  }, [existingExplanation]);

  const handleAddMapping = () => {
    if (currentSourceField && currentTargetField) {
      // 检查是否已存在相同的映射
      const exists = mappings.some(
        (m) => m.sourceField === currentSourceField && m.targetField === currentTargetField
      );
      if (!exists) {
        setMappings([...mappings, { sourceField: currentSourceField, targetField: currentTargetField }]);
        setCurrentSourceField("");
        setCurrentTargetField("");
      }
    }
  };

  const handleRemoveMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (mappings.length > 0) {
      onConfirm(mappings, edgeExplanation.trim());
    }
  };

  const toggleExpandedKey = (
    key: string,
    expandedKeys: string[],
    setExpandedKeys: (keys: string[]) => void
  ) => {
    if (expandedKeys.includes(key)) {
      setExpandedKeys(expandedKeys.filter((k) => k !== key));
    } else {
      setExpandedKeys([...expandedKeys, key]);
    }
  };

  const renderFieldTree = (
    nodes: any[],
    parentPath: string,
    expandedKeys: string[],
    setExpandedKeys: (keys: string[]) => void,
    currentValue: string,
    setCurrentValue: (value: string) => void
  ) => {
    if (!nodes || nodes.length === 0) return null;

    return nodes.map((node, index) => {
      // 简化类型名：去掉前面的包名，只保留最后一段
      const simpleType =
        typeof node.type === "string"
          ? (node.type as string).split(".").slice(-1)[0]
          : undefined;

      // 优先使用 name（如 request），其次使用 fieldName（如 username），再次退回到简化后的类型名，最后才用 field_0 这种占位
      const name = node.name || node.fieldName || simpleType || `field_${index}`;
      const path = parentPath ? `${parentPath}.${name}` : name;
      const hasChildren = node.fields && Array.isArray(node.fields) && node.fields.length > 0;
      const isExpanded = expandedKeys.includes(path);
      const isSelected = currentValue === path;

      return (
        <div key={path} className="space-y-1">
          <div
            className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all ${
              isSelected ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:bg-accent"
            }`}
            onClick={() => {
              // 只有叶子节点参与映射选择；非叶子节点只负责展开/折叠
              if (!hasChildren) {
                setCurrentValue(path);
              } else {
                toggleExpandedKey(path, expandedKeys, setExpandedKeys);
              }
            }}
          >
            {hasChildren && (
              <button
                type="button"
                className="w-4 h-4 flex items-center justify-center rounded border border-border bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpandedKey(path, expandedKeys, setExpandedKeys);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
            {!hasChildren && (
              <div
                className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center ${
                  isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                }`}
              >
                {isSelected && <div className="w-2 h-2 bg-primary-foreground rounded-[1px]" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-mono font-medium truncate">{name}</div>
              {/* 类型说明：仅显示简化后的类型名，且与 name 不重复时才显示 */}
              {simpleType && simpleType !== name && (
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{simpleType}</div>
              )}
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="pl-4 border-l border-border/40 ml-2">
              {renderFieldTree(
                node.fields,
                path,
                expandedKeys,
                setExpandedKeys,
                currentValue,
                setCurrentValue
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="py-4 space-y-6">
      {/* 第一部分：可展开的参数选择列表 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 左侧：外部输入 + 源方法输出（两个独立下拉框） */}
        <div className="space-y-3">
          {/* 外部输入 */}
          <div className="border rounded-md">
            <button
              onClick={() => setExpandedExternal(!expandedExternal)}
              className="w-full flex items-center justify-between p-3 border-b bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">外部输入</span>
                
              </div>
              {expandedExternal ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedExternal && (
              <div className="p-3 space-y-2">
                <div className="text-[10px] text-muted-foreground">
                  输入外部字段（例如：`request.username`）
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={externalSourceExpr}
                    onChange={(e) => setExternalSourceExpr(e.target.value)}
                   
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const v = externalSourceExpr.trim();
                      if (!v) return;
                      // 若输入的是叶子字段（request.username），自动补 workflow.input 前缀
                      if (v.startsWith("workflow.") || v.startsWith("env.")) {
                        setCurrentSourceField(v);
                      } else {
                        setCurrentSourceField(`workflow.input.${v}`);
                      }
                    }}
                    disabled={!externalSourceExpr.trim()}
                  >
                    使用
                  </Button>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  已选源字段：
                  <span className="font-mono text-foreground/90 break-all ml-1">
                    {currentSourceField || "未选择"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 源方法输出列表 */}
          <div className="border rounded-md">
            <button
              onClick={() => setExpandedSource(!expandedSource)}
              className="w-full flex items-center justify-between p-3 border-b bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">输出参数</span>
                <span className="text-xs text-muted-foreground">
                  ({sourceData?.label || "未知方法"})
                </span>
              </div>
              {expandedSource ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSource && (
              <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                {sourceOutputsTree.length > 0 ? (
                  renderFieldTree(
                    sourceOutputsTree,
                    "",
                    expandedSourceKeys,
                    setExpandedSourceKeys,
                    currentSourceField,
                    setCurrentSourceField
                  )
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    无输出参数
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 目标方法输入列表 */}
        <div className="border rounded-md">
          <button
            onClick={() => setExpandedTarget(!expandedTarget)}
            className="w-full flex items-center justify-between p-3 border-b bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">输入参数</span>
              <span className="text-xs text-muted-foreground">
                ({targetData?.label || "未知方法"})
              </span>
            </div>
            {expandedTarget ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {expandedTarget && (
            <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
              {targetInputsTree.length > 0 ? (
                renderFieldTree(
                  targetInputsTree,
                  "",
                  expandedTargetKeys,
                  setExpandedTargetKeys,
                  currentTargetField,
                  setCurrentTargetField
                )
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  无输入参数
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 第二部分：添加映射 */}
      {currentSourceField && currentTargetField && (
        <div className="border rounded-md p-4 bg-muted/20">
          <Label className="mb-2 block">当前选择</Label>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 p-3 border rounded-md bg-background">
              <div className="text-xs text-muted-foreground mb-1">源输出</div>
              <div className="text-sm font-mono font-medium">{currentSourceField}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-primary" />
            <div className="flex-1 p-3 border rounded-md bg-background">
              <div className="text-xs text-muted-foreground mb-1">目标输入</div>
              <div className="text-sm font-mono font-medium">{currentTargetField}</div>
            </div>
            <Button onClick={handleAddMapping} size="sm">
              添加映射
            </Button>
          </div>
        </div>
      )}

      {/* 第三部分：已添加的映射列表 */}
      {mappings.length > 0 && (
        <div className="border rounded-md p-4">
          <Label className="mb-2 block">已添加的映射 ({mappings.length})</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {mappings.map((mapping, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 border rounded-md bg-background"
              >
                <div className="flex-1">
                  <div className="text-sm font-mono font-medium">{mapping.sourceField}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-mono font-medium">{mapping.targetField}</div>
                </div>
                <Button
                  onClick={() => handleRemoveMapping(index)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 第三部分之后：连接概述 */}
      <div className="border rounded-md p-4 bg-muted/10">
        <Label className="mb-2 block">连接概述</Label>
        <input
          value={edgeExplanation}
          onChange={(e) => setEdgeExplanation(e.target.value)}
          placeholder="这个连接为了什么"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* 第四部分：连接视图 */}
      <div className="border rounded-md p-4">
        <Label className="mb-2 block">连接视图</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{sourceData?.label || "源方法"}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold">{targetData?.label || "目标方法"}</span>
          </div>
          {mappings.length > 0 && (
            <div className="text-xs text-muted-foreground pl-4 space-y-1">
              {mappings.map((mapping, index) => (
                <div key={index}>
                  {mapping.sourceField} → {mapping.targetField}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={onCancel} className="sm:w-1/2">
          取消
        </Button>
        <Button
          onClick={handleConfirm}
          className="sm:w-1/2"
          disabled={mappings.length === 0}
        >
          确定
        </Button>
      </DialogFooter>
    </div>
  );
};
