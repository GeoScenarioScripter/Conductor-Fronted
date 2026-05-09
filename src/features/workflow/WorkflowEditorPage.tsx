import { useCallback, useRef, useState, useEffect, useMemo } from "react";
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
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { Settings, ArrowRight, ChevronDown, ChevronRight, X, Archive, Database, Edit } from "lucide-react";

import { MicroserviceNode }     from "./components/MicroserviceNode";
import { WorkflowContextMenu }  from "./components/WorkflowContextMenu";
import { ResourcePanel }        from "./components/ResourcePanel";
import { InspectorPanel }       from "./components/InspectorPanel";
import { FlowToolbar }          from "./components/FlowToolbar";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label }  from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { useMethodDetail } from "@/hooks/use-workflow-metadata";
import type { ServiceInterface } from "./types";
import { getMethodDetail, getServiceDetail } from "@/services/workflow-metadata.service";
import { getWorkflows, submitWorkflowDefinition } from "@/services/workflow.service";

/* ── Helpers ─────────────────────────────────────────────── */

type FieldMapping = { sourceField: string; targetField: string };

function extractLeafPathsFromParamTree(nodes: any[], parentPath = ""): string[] {
  if (!nodes?.length) return [];
  const paths: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const simpleType = typeof node?.type === "string" ? node.type.split(".").slice(-1)[0] : undefined;
    const name = node?.name || node?.fieldName || simpleType || `field_${i}`;
    const path = parentPath ? `${parentPath}.${name}` : name;
    const hasChildren = Array.isArray(node?.fields) && node.fields.length > 0;
    if (hasChildren) paths.push(...extractLeafPathsFromParamTree(node.fields, path));
    else              paths.push(path);
  }
  return paths;
}

function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

function setByPath(obj: Record<string, any>, path: string, value: any) {
  const parts = path.split(".").filter(Boolean);
  let cur: any = obj;
  parts.forEach((key, idx) => {
    if (idx === parts.length - 1) { cur[key] = value; }
    else { cur[key] = cur[key] && typeof cur[key] === "object" ? cur[key] : {}; cur = cur[key]; }
  });
}

function toNodeKey(d: any): string | null {
  if (!d?.appName || !d?.serviceName || !d?.methodName) return null;
  return `${d.appName}.${d.serviceName}.${d.methodName}`;
}

function extractDefinitions(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  for (const k of ["definitions", "data", "list", "records"]) { if (Array.isArray(raw[k])) return raw[k]; }
  return [];
}

function deriveMethodInfoFromDagNode(dagNode: any) {
  const inv = dagNode?.serviceInvocation || {};
  const appName = inv?.applicationName;
  const methodName = inv?.methodName || dagNode?.methodName;
  const ifc: string | undefined = inv?.interfaceClass;
  const serviceName = ifc ? ifc.split(".").slice(-1)[0] : undefined;
  const parts = typeof dagNode?.id === "string" ? dagNode.id.split(".") : [];
  if (parts.length >= 3) return { appName: parts[0] || appName, serviceName: parts[1] || serviceName, methodName: parts[2] || methodName };
  return { appName, serviceName, methodName };
}

/* ── Custom edge (MappingEdge) ───────────────────────────── */

const nodeTypes = { microapplication: MicroserviceNode } as const;

function MappingEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const mappings = (data as any)?.mappings ?? [];
  const isRunning = (data as any)?.status === "running";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? "hsl(189 85% 52%)" : isRunning ? "hsl(258 90% 65%)" : "hsl(189 85% 52% / 0.35)",
          strokeWidth: selected ? 1.5 : 1,
          strokeDasharray: isRunning ? "6 4" : undefined,
          animation: isRunning ? "flow-dash 0.4s linear infinite" : undefined,
          filter: selected ? "drop-shadow(0 0 4px hsl(189 85% 52% / 0.4))" : undefined,
          transition: "stroke 0.15s, stroke-width 0.15s",
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{ position: "absolute", transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, pointerEvents: "all" }}
          className="nodrag nopan flex items-center gap-1"
        >
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("editEdgeMapping", { detail: { edgeId: id, mappings, explanation: (data as any)?.explanation ?? "" } }))}
            className={cn(
              "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium transition-all",
              mappings.length > 0
                ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
            )}
            aria-label={mappings.length > 0 ? `${mappings.length} mappings` : "No mapping configured"}
          >
            {mappings.length > 0 ? (
              <><Settings className="h-2.5 w-2.5" />{mappings.length}</>
            ) : (
              <span>⚠</span>
            )}
          </button>
          {(data as any)?.explanation && (
            <div className="max-w-32 truncate text-[9px] bg-card/80 border border-border rounded px-1 py-0.5 text-muted-foreground">
              {String((data as any).explanation)}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { default: MappingEdge } as const;

/* ── Main editor ─────────────────────────────────────────── */

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Inspector
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showInspector, setShowInspector] = useState(true);

  // Panels collapse
  const [resourceCollapsed, setResourceCollapsed] = useState(false);

  // Simulation
  const [isSimulating, setIsSimulating] = useState(false);

  // Context menu
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);

  // Connection/mapping dialog
  const [isConnectionDialogOpen, setIsConnectionDialogOpen]     = useState(false);
  const [pendingConnection,       setPendingConnection]          = useState<Connection | null>(null);
  const [editingEdgeId,           setEditingEdgeId]              = useState<string | null>(null);
  const [existingMappings,        setExistingMappings]           = useState<FieldMapping[]>([]);
  const [existingExplanation,     setExistingExplanation]        = useState("");

  // Archive dialog
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archiveName, setArchiveName] = useState("");

  // DB mount dialog
  const [isDbMountDialogOpen, setIsDbMountDialogOpen] = useState(false);
  const [selectedNodeId,      setSelectedNodeId]       = useState<string | null>(null);
  const [selectedDb,          setSelectedDb]           = useState<string[]>([]);

  // Description dialog
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [descriptionText,         setDescriptionText]         = useState("");
  const [editingNodeId,           setEditingNodeId]           = useState<string | null>(null);

  // Mapping warning / initial inputs dialogs (reuse from original)
  const [isMappingWarningOpen,  setIsMappingWarningOpen]  = useState(false);
  const [mappingWarningData,    setMappingWarningData]    = useState<{ unmappedByNode: Array<{ nodeId: string; label: string; missingTargets: string[] }>; totalNodesChecked: number } | null>(null);
  const [isInitialInputsOpen,   setIsInitialInputsOpen]  = useState(false);
  const [initialInputsData,     setInitialInputsData]    = useState<{ entryNodes: Array<{ nodeId: string; label: string; requiredInputs: string[] }>; totalNodesChecked: number } | null>(null);
  const [workflowInputValues,   setWorkflowInputValues]  = useState<Record<string, string>>({});
  const workflowInputStorageKey = `conductor.workflowInput.${id || "new"}`;

  /* ── Hydration (load existing workflow from id) ── */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const hydrate = async () => {
      setIsHydrating(true);
      try {
        const resp: any = await getWorkflows();
        const definitions = extractDefinitions(resp);
        const workflowDef = definitions.find((d: any) => String(d?.id ?? "") === String(id) || String(d?.workflowDefId ?? "") === String(id)) || null;
        if (!workflowDef) { if (!cancelled) { setNodes([]); setEdges([]); } return; }
        const dagNodes = (workflowDef?.dagDefinition?.nodes || []) as any[];
        const dagEdges = (workflowDef?.dagDefinition?.edges || []) as any[];
        const workflowDescription = String(workflowDef?.workflowDescription || "");
        const connectionOverviewParts = workflowDescription.split(/[；;]+/g).map(s => s.trim()).filter(Boolean);

        // Topological layout
        const incomingCount = new Map<string, number>();
        const outgoing = new Map<string, string[]>();
        dagNodes.forEach(n => { incomingCount.set(n.id, 0); outgoing.set(n.id, []); });
        dagEdges.forEach(e => {
          if (!incomingCount.has(e.target)) return;
          incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
          outgoing.get(e.source)?.push(e.target);
        });
        const level = new Map<string, number>();
        const queue: string[] = [];
        dagNodes.forEach(n => { if ((incomingCount.get(n.id) || 0) === 0) { level.set(n.id, 0); queue.push(n.id); } });
        if (!queue.length) { dagNodes.forEach(n => { level.set(n.id, 0); queue.push(n.id); }); }
        while (queue.length) {
          const cur = queue.shift()!;
          const curLv = level.get(cur) || 0;
          (outgoing.get(cur) || []).forEach(t => {
            incomingCount.set(t, (incomingCount.get(t) || 0) - 1);
            const nLv = curLv + 1;
            if ((level.get(t) ?? 0) < nLv) level.set(t, nLv);
            if ((incomingCount.get(t) || 0) === 0) queue.push(t);
          });
        }
        const levelToNodes = new Map<number, string[]>();
        dagNodes.forEach(n => { const lv = level.get(n.id) ?? 0; levelToNodes.set(lv, [...(levelToNodes.get(lv) || []), n.id]); });
        const positions: Record<string, { x: number; y: number }> = {};
        Array.from(levelToNodes.keys()).sort((a, b) => a - b).forEach((lv, lvIdx) => {
          (levelToNodes.get(lv) || []).sort().forEach((nodeId, idx) => {
            positions[nodeId] = { x: lvIdx * 320, y: idx * 160 };
          });
        });

        // Reconstruct edge mappings from inputParams
        const mappingByEdgeKey = new Map<string, FieldMapping[]>();
        const incomingSourcesByTarget = new Map<string, string[]>();
        dagEdges.forEach(e => { incomingSourcesByTarget.set(e.target, [...(incomingSourcesByTarget.get(e.target) || []), e.source]); });
        const walkInputParams = (obj: any, parentPath: string, targetNodeId: string) => {
          if (!obj) return;
          if (typeof obj === "string") {
            const m = obj.trim().match(/^\$\{([^}]+)\}$/);
            if (!m) return;
            const inner = m[1];
            if (inner.startsWith("workflow.input.") || inner.startsWith("env.")) {
              const fallbackSrc = (incomingSourcesByTarget.get(targetNodeId) || [])[0];
              if (fallbackSrc && parentPath) {
                const arr = mappingByEdgeKey.get(`${fallbackSrc}=>${targetNodeId}`) || [];
                arr.push({ sourceField: inner, targetField: parentPath });
                mappingByEdgeKey.set(`${fallbackSrc}=>${targetNodeId}`, arr);
              }
              return;
            }
            const rm = inner.match(/^(.+)\.result\.(.+)$/);
            if (!rm || !parentPath) return;
            const key = `${rm[1]}=>${targetNodeId}`;
            const arr = mappingByEdgeKey.get(key) || [];
            arr.push({ sourceField: rm[2], targetField: parentPath });
            mappingByEdgeKey.set(key, arr);
            return;
          }
          if (typeof obj !== "object" || Array.isArray(obj)) return;
          Object.entries(obj).forEach(([k, v]) => walkInputParams(v, parentPath ? `${parentPath}.${k}` : k, targetNodeId));
        };
        dagNodes.forEach(dn => walkInputParams(dn?.inputParams || {}, "", dn.id));

        const newNodes: Node[] = dagNodes.map(dn => {
          const mi = deriveMethodInfoFromDagNode(dn);
          return { id: dn.id, type: "microapplication", position: positions[dn.id] || { x: 0, y: 0 },
            data: { label: dn.name || dn.id, description: "", status: "idle", appName: mi.appName, serviceName: mi.serviceName, methodName: mi.methodName, inputs: [], outputs: [], db: dn?.db } };
        });
        const newEdges: Edge[] = dagEdges.map((de, idx) => ({
          id: `edge-${idx + 1}`, source: de.source, target: de.target, animated: false, type: "default",
          data: { mappings: mappingByEdgeKey.get(`${de.source}=>${de.target}`) || [], explanation: de.description || connectionOverviewParts[idx] || "" },
        }));

        if (!cancelled) { setNodes(newNodes); setEdges(newEdges); }

        // Hydrate inputs/outputs
        const extractFields = (params: any[]) => !params?.length ? [] : params.flatMap(p => p.fields?.length ? p.fields : (p.fieldName ? [p] : []));
        for (const rn of newNodes) {
          const d = rn.data as any;
          if (!d.appName || !d.serviceName || !d.methodName) continue;
          try {
            const md = await getMethodDetail(d.appName, d.serviceName, d.methodName);
            if (cancelled) return;
            const inputs: ServiceInterface[] = extractFields(md?.parameters || []).map((f: any, i: number) => ({ id: `input-${rn.id}-${i}`, name: f.fieldName || `f${i}`, type: f.type || "any" }));
            const outputs: ServiceInterface[] = extractFields(md?.responses || []).filter((f: any) => f?.fieldName?.toLowerCase() !== "success").map((f: any, i: number) => ({ id: `output-${rn.id}-${i}`, name: f.fieldName || `f${i}`, type: f.type || "any" }));
            setNodes(prev => prev.map(n => n.id === rn.id ? { ...n, data: { ...n.data, inputs, outputs } } : n));
          } catch { /* ignore */ }
        }
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    };
    hydrate();
    return () => { cancelled = true; };
  }, [id]);

  /* ── Load saved input values ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(workflowInputStorageKey);
      if (!saved) return;
      const obj = JSON.parse(saved);
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
      const flatten = (o: any, prefix = "", out: Record<string, string> = {}): Record<string, string> => {
        Object.entries(o || {}).forEach(([k, v]) => {
          const path = prefix ? `${prefix}.${k}` : k;
          if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, path, out);
          else out[path] = v == null ? "" : String(v);
        });
        return out;
      };
      setWorkflowInputValues(prev => ({ ...prev, ...flatten(obj) }));
    } catch { /* ignore */ }
  }, [workflowInputStorageKey]);

  /* ── Selection tracking for Inspector ── */
  useEffect(() => {
    const selected = nodes.find(n => n.selected) ?? null;
    setSelectedNode(selected);
    if (selected) setSelectedEdge(null);
  }, [nodes]);
  useEffect(() => {
    const selected = edges.find(e => e.selected) ?? null;
    setSelectedEdge(selected);
    if (selected) setSelectedNode(null);
  }, [edges]);

  /* ── Edit edge mapping event listener ── */
  useEffect(() => {
    const handler = (event: Event) => {
      const { edgeId, mappings, explanation } = (event as CustomEvent).detail;
      const edge = edges.find(e => e.id === edgeId);
      if (edge) {
        setEditingEdgeId(edgeId);
        setExistingMappings(mappings);
        setExistingExplanation(explanation || "");
        setPendingConnection({ source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle || null, targetHandle: edge.targetHandle || null });
        setIsConnectionDialogOpen(true);
      }
    };
    window.addEventListener("editEdgeMapping", handler as EventListener);
    return () => window.removeEventListener("editEdgeMapping", handler as EventListener);
  }, [edges]);

  /* ── Drag & connect handlers ── */
  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      setEditingEdgeId(null); setExistingMappings([]); setExistingExplanation("");
      setPendingConnection(params); setIsConnectionDialogOpen(true);
    } else {
      setEdges(eds => addEdge({ ...params, animated: false, type: "default" }, eds));
    }
    setIsDirty(true);
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/reactflow");
    const dataString = event.dataTransfer.getData("application/nodedata");
    if (!type) return;
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const data = JSON.parse(dataString);
    const nodeId = uuidv4();
    setNodes(nds => nds.concat({ id: nodeId, type, position, data: { ...data, status: "idle", inputs: [], outputs: [] } }));
    setIsDirty(true);
    if (data.appName && data.serviceName && data.methodName) {
      getMethodDetail(data.appName, data.serviceName, data.methodName).then(md => {
        const extractFields = (params: any[]) => params?.flatMap(p => p.fields?.length ? p.fields : (p.fieldName ? [p] : [])) ?? [];
        const inputs: ServiceInterface[] = extractFields(md?.parameters || []).map((f: any, i: number) => ({ id: `input-${nodeId}-${i}`, name: f.fieldName || `f${i}`, type: f.type || "any" }));
        const outputs: ServiceInterface[] = extractFields(md?.responses || []).filter((f: any) => f?.fieldName?.toLowerCase() !== "success").map((f: any, i: number) => ({ id: `output-${nodeId}-${i}`, name: f.fieldName || `f${i}`, type: f.type || "any" }));
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, inputs, outputs } } : n));
      }).catch(() => {});
    }
  }, [reactFlowInstance, setNodes]);

  /* ── Context menu ── */
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    if (!reactFlowWrapper.current) return;
    const pane = reactFlowWrapper.current.getBoundingClientRect();
    setMenu({ id: node.id, top: event.clientY - pane.top, left: event.clientX - pane.left });
  }, []);

  const onPaneClick = useCallback(() => { setMenu(null); }, []);

  const handleCopyNode = useCallback(() => {
    if (!menu) return;
    const src = nodes.find(n => n.id === menu.id);
    if (src) {
      setNodes(nds => nds.concat({ ...src, id: uuidv4(), position: { x: src.position.x + 48, y: src.position.y + 48 }, data: { ...src.data, label: `${src.data.label} (Copy)` }, selected: false }));
      setIsDirty(true);
    }
    setMenu(null);
  }, [menu, nodes, setNodes]);

  const handleDeleteNode = useCallback(() => {
    if (!menu) return;
    setNodes(nds => nds.filter(n => n.id !== menu.id));
    setEdges(eds => eds.filter(e => e.source !== menu.id && e.target !== menu.id));
    setMenu(null);
    setIsDirty(true);
  }, [menu, setNodes, setEdges]);

  const handleEditDescriptionClick = useCallback(() => {
    if (!menu) return;
    const node = nodes.find(n => n.id === menu.id);
    if (node) { setEditingNodeId(node.id); setDescriptionText((node.data.description as string) || ""); setIsDescriptionDialogOpen(true); }
    setMenu(null);
  }, [menu, nodes]);

  /* ── Double-click DB mount ── */
  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    const existingDb = node.data.db;
    setSelectedDb(Array.isArray(existingDb) ? existingDb as string[] : typeof existingDb === "string" && existingDb ? [existingDb] : []);
    setIsDbMountDialogOpen(true);
  }, []);

  /* ── Simulation ── */
  const runSimulation = useCallback(() => {
    if (isSimulating) return;
    setIsSimulating(true);
    // Topological sort
    const inCount = new Map<string, number>();
    const outMap  = new Map<string, string[]>();
    nodes.forEach(n => { inCount.set(n.id, 0); outMap.set(n.id, []); });
    edges.forEach(e => { inCount.set(e.target, (inCount.get(e.target) || 0) + 1); outMap.get(e.source)?.push(e.target); });
    const order: string[] = [];
    const queue = nodes.filter(n => !inCount.get(n.id)).map(n => n.id);
    while (queue.length) {
      const cur = queue.shift()!;
      order.push(cur);
      (outMap.get(cur) || []).forEach(t => { const c = (inCount.get(t) || 1) - 1; inCount.set(t, c); if (!c) queue.push(t); });
    }
    if (!order.length) order.push(...nodes.map(n => n.id));

    // Animate sequentially
    order.forEach((nodeId, i) => {
      setTimeout(() => {
        // Mark incoming edges as running
        setEdges(eds => eds.map(e => e.target === nodeId ? { ...e, data: { ...(e.data || {}), status: "running" } } : e));
        // Mark this node as running
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: "running" } } : n));
      }, i * 700);
      setTimeout(() => {
        // Mark node done, clear edge running
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: Math.random() > 0.1 ? "success" : "error" } } : n));
        setEdges(eds => eds.map(e => e.target === nodeId ? { ...e, data: { ...(e.data || {}), status: "idle" } } : e));
      }, i * 700 + 600);
    });

    // Reset after
    setTimeout(() => {
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: "idle" } })));
      setEdges(eds => eds.map(e => ({ ...e, data: { ...(e.data || {}), status: "idle" } })));
      setIsSimulating(false);
    }, order.length * 700 + 1200);
  }, [isSimulating, nodes, edges, setNodes, setEdges]);

  /* ── Build payload & publish ── */
  const buildWorkflowDefinitionPayload = useCallback(async (entryNodeIds: string[]) => {
    const methodCache = new Map<string, any>();
    const serviceCache = new Map<string, any>();
    const getNodeMethodDetail = async (node: Node) => {
      if (methodCache.has(node.id)) return methodCache.get(node.id);
      const d = node.data as any;
      if (!d.appName || !d.serviceName || !d.methodName) { methodCache.set(node.id, null); return null; }
      const detail = await getMethodDetail(d.appName, d.serviceName, d.methodName);
      methodCache.set(node.id, detail); return detail;
    };
    const getNodeServiceDetail = async (node: Node) => {
      if (serviceCache.has(node.id)) return serviceCache.get(node.id);
      const d = node.data as any;
      if (!d.appName || !d.serviceName) { serviceCache.set(node.id, null); return null; }
      const detail = await getServiceDetail(d.appName, d.serviceName);
      serviceCache.set(node.id, detail); return detail;
    };
    const nodeKeyById = new Map<string, string>();
    nodes.forEach(n => { const k = toNodeKey(n.data); if (k) nodeKeyById.set(n.id, k); });
    const incomingEdgesByTarget = new Map<string, Edge[]>();
    edges.forEach(e => { incomingEdgesByTarget.set(e.target, [...(incomingEdgesByTarget.get(e.target) || []), e]); });

    const dagNodes: any[] = [];
    for (const n of nodes) {
      const nodeKey = nodeKeyById.get(n.id) || n.id;
      const detail = await getNodeMethodDetail(n);
      const serviceDetail = await getNodeServiceDetail(n);
      const inputParams: Record<string, any> = {};
      const isEntry = entryNodeIds.includes(n.id);
      if (isEntry) {
        extractLeafPathsFromParamTree(detail?.parameters || []).forEach(p => setByPath(inputParams, p, `\${workflow.input.${p}}`));
      } else {
        (incomingEdgesByTarget.get(n.id) || []).forEach(e => {
          const sourceKey = e.source ? nodeKeyById.get(e.source) : null;
          ((e.data as any)?.mappings || []).forEach((m: FieldMapping) => {
            if (!m?.targetField || !m?.sourceField) return;
            let expr = m.sourceField;
            if (expr.startsWith("workflow.") || expr.startsWith("env.")) expr = `\${${expr}}`;
            else if (sourceKey) expr = `\${${sourceKey}.result.${expr}}`;
            else expr = `\${${expr}}`;
            setByPath(inputParams, m.targetField, expr);
          });
        });
      }
      dagNodes.push({ id: nodeKey, name: (n.data as any)?.label || nodeKey, type: "SERVICE_CALL", inputParams,
        serviceInvocation: { applicationName: (n.data as any)?.appName, version: "1.0.0", interfaceClass: serviceDetail?.interfaceClass || "", methodName: (n.data as any)?.methodName, parameterTypes: (detail?.parameters || []).map((p: any) => p.fullType || p.type).filter(Boolean), loadBalance: "ROUND_ROBIN" } });
    }
    const dagEdges = edges.map((e, idx) => ({ id: `edge-${idx + 1}`, source: nodeKeyById.get(e.source) || e.source, target: nodeKeyById.get(e.target) || e.target, type: "SEQUENCE" }));
    const workflowDescription = edges.map(e => ((e.data as any)?.explanation || "").trim()).filter(Boolean).join("；");
    return { workflowName: id ? `Workflow ${id.slice(0, 8)}` : "New Workflow", workflowDescription, version: "1.0.0", dagJson: { nodes: dagNodes, edges: dagEdges }, inputs: {}, outputs: [] };
  }, [edges, id, nodes]);

  /* ── Publish/Export ── */
  const handlePublish = useCallback(async () => {
    const inCount = new Map<string, number>();
    nodes.forEach(n => inCount.set(n.id, 0));
    edges.forEach(e => inCount.set(e.target, (inCount.get(e.target) || 0) + 1));
    const entryNodes = nodes.filter(n => !(inCount.get(n.id) || 0));

    const methodCache = new Map<string, any>();
    const getDetail = async (node: Node) => {
      if (methodCache.has(node.id)) return methodCache.get(node.id);
      const d = node.data as any;
      if (!d.appName || !d.serviceName || !d.methodName) { methodCache.set(node.id, null); return null; }
      try { const r = await getMethodDetail(d.appName, d.serviceName, d.methodName); methodCache.set(node.id, r); return r; } catch { methodCache.set(node.id, null); return null; }
    };
    const requiredByNode = new Map<string, string[]>();
    for (const n of nodes) {
      const detail = await getDetail(n);
      requiredByNode.set(n.id, uniq(extractLeafPathsFromParamTree(detail?.parameters || [])));
    }
    const mappedByNode = new Map<string, Set<string>>();
    nodes.forEach(n => mappedByNode.set(n.id, new Set()));
    edges.forEach(e => { const s = mappedByNode.get(e.target); ((e.data as any)?.mappings || []).forEach((m: FieldMapping) => m.targetField && s?.add(m.targetField)); });

    const unmapped = nodes.filter(n => !entryNodes.some(en => en.id === n.id)).flatMap(n => {
      const required = requiredByNode.get(n.id) || [];
      const mapped = mappedByNode.get(n.id) || new Set<string>();
      const missing = required.filter(p => !mapped.has(p));
      return missing.length ? [{ nodeId: n.id, label: (n.data as any)?.label || n.id, missingTargets: missing }] : [];
    });
    if (unmapped.length) { setMappingWarningData({ unmappedByNode: unmapped, totalNodesChecked: nodes.length }); setIsMappingWarningOpen(true); return; }

    const entryInputs = entryNodes.map(n => ({ nodeId: n.id, label: (n.data as any)?.label || n.id, requiredInputs: requiredByNode.get(n.id) || [] }));
    if (entryInputs.some(x => x.requiredInputs.length > 0)) {
      setInitialInputsData({ entryNodes: entryInputs, totalNodesChecked: nodes.length });
      const vals: Record<string, string> = {};
      entryInputs.forEach(en => en.requiredInputs.forEach(p => { vals[p] = workflowInputValues[p] ?? ""; }));
      setWorkflowInputValues(vals);
      setIsInitialInputsOpen(true);
    } else {
      const payload = await buildWorkflowDefinitionPayload(entryNodes.map(n => n.id));
      await submitWorkflowDefinition(payload as any);
      alert("工作流已提交。");
      setIsDirty(false);
    }
  }, [nodes, edges, workflowInputValues, buildWorkflowDefinitionPayload]);

  const availableDatabases = ["users_db", "orders_db", "local_store", "minio_storage"];

  return (
    <div className="h-full flex flex-col overflow-hidden -m-6">
      {/* Toolbar */}
      <FlowToolbar
        workflowId={id}
        isDirty={isDirty}
        isSimulating={isSimulating}
        onRunSimulation={runSimulation}
        onSaveDraft={() => { alert("Save draft — wire to API when available"); }}
        onPublish={handlePublish}
        onArchive={() => setIsArchiveDialogOpen(true)}
        onValidate={() => {}}
      />

      {/* Three-column body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Resource panel */}
        <ResourcePanel
          collapsed={resourceCollapsed}
          onCollapseToggle={() => setResourceCollapsed(c => !c)}
        />

        {/* Center: Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          {isHydrating && (
            <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Loading workflow…
              </div>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={e => { onNodesChange(e); setIsDirty(true); }}
            onEdgesChange={e => { onEdgesChange(e); setIsDirty(true); }}
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
            className="bg-transparent"
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="hsl(var(--muted-foreground))"
              gap={24}
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
                onInspect={() => {
                  const node = nodes.find(n => n.id === menu.id);
                  if (node) { setSelectedNode(node); setShowInspector(true); }
                  setMenu(null);
                }}
              />
            )}
          </ReactFlow>
        </div>

        {/* Right: Inspector */}
        {showInspector && (
          <InspectorPanel
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            nodes={nodes}
            onEditMapping={edgeId => {
              const edge = edges.find(e => e.id === edgeId);
              if (edge) {
                setEditingEdgeId(edgeId);
                setExistingMappings((edge.data as any)?.mappings || []);
                setExistingExplanation((edge.data as any)?.explanation || "");
                setPendingConnection({ source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle || null, targetHandle: edge.targetHandle || null });
                setIsConnectionDialogOpen(true);
              }
            }}
            onClose={() => setShowInspector(false)}
          />
        )}
      </div>

      {/* ── Dialogs ─────────────────────────────────────────── */}

      {/* Connection/Mapping config */}
      <Sheet open={isConnectionDialogOpen} onOpenChange={v => { setIsConnectionDialogOpen(v); if (!v) { setPendingConnection(null); setEditingEdgeId(null); setExistingMappings([]); setExistingExplanation(""); } }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" /> Configure Connection
            </SheetTitle>
            <SheetDescription>Map source fields to target method parameters</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto">
            {pendingConnection && (
              <ConnectionConfigDialogContent
                connection={pendingConnection}
                nodes={nodes}
                existingMappings={existingMappings}
                existingExplanation={existingExplanation}
                onConfirm={(mappings, explanation) => {
                  if (editingEdgeId) {
                    setEdges(eds => eds.map(e => e.id === editingEdgeId ? { ...e, data: { mappings, explanation } } : e));
                  } else if (pendingConnection && mappings.length > 0) {
                    setEdges(eds => addEdge({ ...pendingConnection, animated: false, type: "default", data: { mappings, explanation } }, eds));
                  }
                  setIsConnectionDialogOpen(false); setPendingConnection(null); setEditingEdgeId(null); setExistingMappings([]); setExistingExplanation("");
                  setIsDirty(true);
                }}
                onCancel={() => { setIsConnectionDialogOpen(false); setPendingConnection(null); setExistingExplanation(""); }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Archive */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Archive className="h-4 w-4" /> Archive Workflow</DialogTitle>
            <DialogDescription>Save the current state to archives.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="mb-1.5 block text-xs">Archive Name</Label>
            <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="v1.0-stable" value={archiveName} onChange={e => setArchiveName(e.target.value)} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsArchiveDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { if (archiveName) { alert(`Archived as "${archiveName}"`); setIsArchiveDialogOpen(false); setArchiveName(""); } }}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DB Mount */}
      <Dialog open={isDbMountDialogOpen} onOpenChange={setIsDbMountDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Database className="h-4 w-4" /> Mount Database</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            {availableDatabases.map(db => (
              <div key={db} onClick={() => setSelectedDb(prev => prev.includes(db) ? prev.filter(d => d !== db) : [...prev, db])}
                className={cn("flex items-center gap-2 rounded-md border p-2.5 cursor-pointer transition-colors text-sm", selectedDb.includes(db) ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent")}>
                <div className={cn("h-3.5 w-3.5 rounded-sm border flex items-center justify-center flex-shrink-0", selectedDb.includes(db) ? "bg-primary border-primary" : "border-muted-foreground")}>
                  {selectedDb.includes(db) && <div className="h-2 w-2 rounded-[1px] bg-primary-foreground" />}
                </div>
                {db}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDbMountDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => {
              if (selectedNodeId) setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, db: selectedDb } } : n));
              setIsDbMountDialogOpen(false);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Description edit */}
      <Dialog open={isDescriptionDialogOpen} onOpenChange={setIsDescriptionDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="h-4 w-4" /> Edit Description</DialogTitle>
          </DialogHeader>
          <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={descriptionText} onChange={e => setDescriptionText(e.target.value)} />
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDescriptionDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => {
              if (editingNodeId) setNodes(nds => nds.map(n => n.id === editingNodeId ? { ...n, data: { ...n.data, description: descriptionText } } : n));
              setIsDescriptionDialogOpen(false);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mapping warning */}
      <Dialog open={isMappingWarningOpen} onOpenChange={setIsMappingWarningOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Incomplete Mappings</DialogTitle><DialogDescription>Please fix the following before publishing.</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-64">
            {mappingWarningData?.unmappedByNode.map(item => (
              <div key={item.nodeId} className="rounded-md border border-border/60 p-3 mb-2">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Missing {item.missingTargets.length} target field(s)</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {item.missingTargets.map(p => <span key={p} className="text-[10px] font-mono bg-muted rounded px-1.5 py-0.5">{p}</span>)}
                </div>
              </div>
            ))}
          </ScrollArea>
          <DialogFooter><Button variant="outline" size="sm" onClick={() => setIsMappingWarningOpen(false)}>Got it</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initial inputs */}
      <Dialog open={isInitialInputsOpen} onOpenChange={setIsInitialInputsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>Entry Node Inputs</DialogTitle><DialogDescription>Fill in the required inputs for the workflow entry nodes.</DialogDescription></DialogHeader>
          {initialInputsData?.entryNodes.filter(x => x.requiredInputs.length > 0).map(x => (
            <div key={x.nodeId} className="rounded-md border border-border/60 p-3 mb-2">
              <p className="text-sm font-medium mb-2">{x.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {x.requiredInputs.map(p => (
                  <div key={p} className="space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground">{p}</p>
                    <input value={workflowInputValues[p] ?? ""} onChange={e => setWorkflowInputValues(prev => ({ ...prev, [p]: e.target.value }))}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsInitialInputsOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={async () => {
              try {
                localStorage.setItem(workflowInputStorageKey, JSON.stringify(workflowInputValues));
                const entryIds = initialInputsData?.entryNodes.map(x => x.nodeId) || [];
                const payload = await buildWorkflowDefinitionPayload(entryIds);
                await submitWorkflowDefinition(payload as any);
                setIsInitialInputsOpen(false);
                setIsDirty(false);
                alert("Workflow submitted.");
              } catch (e) { alert(`Submit failed: ${e instanceof Error ? e.message : "unknown"}`); }
            }}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── ConnectionConfigDialogContent (preserved from original) ─ */
function ConnectionConfigDialogContent({ connection, nodes, existingMappings = [], existingExplanation = "", onConfirm, onCancel }: {
  connection: Connection; nodes: Node[];
  existingMappings?: FieldMapping[]; existingExplanation?: string;
  onConfirm: (mappings: FieldMapping[], explanation: string) => void;
  onCancel: () => void;
}) {
  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);
  const sourceData = sourceNode?.data as any;
  const targetData = targetNode?.data as any;
  const { data: srcDetail } = useMethodDetail(sourceData?.appName || "", sourceData?.serviceName || "", sourceData?.methodName || "");
  const { data: tgtDetail } = useMethodDetail(targetData?.appName || "", targetData?.serviceName || "", targetData?.methodName || "");

  const buildSourceTree = (): any[] => {
    if (!srcDetail) return [];
    const responses = (srcDetail.responses || []) as any[];
    if (!responses.length) return [];
    const first = responses[0] || {};
    const rootName = first.returnTypeName || srcDetail.returnTypeName || "Response";
    return [{ name: rootName, type: first.returnType || srcDetail.returnType, fields: first.fields || [] }];
  };
  const filterOutSuccess = (ns: any[]): any[] => ns.filter(n => (n.name || n.fieldName || "").toLowerCase() !== "success").map(n => ({ ...n, fields: n.fields ? filterOutSuccess(n.fields) : undefined }));
  const sourceTree = filterOutSuccess(buildSourceTree());
  const targetTree = (tgtDetail?.parameters || []) as any[];

  const [mappings,            setMappings]            = useState<FieldMapping[]>(existingMappings);
  const [currentSrc,          setCurrentSrc]          = useState("");
  const [currentTgt,          setCurrentTgt]          = useState("");
  const [externalExpr,        setExternalExpr]        = useState("");
  const [explanation,         setExplanation]         = useState(existingExplanation);
  const [expandedSrcKeys,     setExpandedSrcKeys]     = useState<string[]>([]);
  const [expandedTgtKeys,     setExpandedTgtKeys]     = useState<string[]>([]);

  const toggleKey = (key: string, keys: string[], set: (k: string[]) => void) =>
    set(keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key]);

  const renderTree = (ns: any[], parentPath: string, expandedKeys: string[], setExpandedKeys: (k: string[]) => void, current: string, setCurrent: (v: string) => void): React.ReactNode => {
    if (!ns?.length) return null;
    return ns.map((node, i) => {
      const simpleType = typeof node.type === "string" ? node.type.split(".").slice(-1)[0] : undefined;
      const name = node.name || node.fieldName || simpleType || `field_${i}`;
      const path = parentPath ? `${parentPath}.${name}` : name;
      const hasChildren = node.fields?.length > 0;
      const isSelected = current === path;
      const isExpanded = expandedKeys.includes(path);
      return (
        <div key={path} className="space-y-0.5">
          <div onClick={() => hasChildren ? toggleKey(path, expandedKeys, setExpandedKeys) : setCurrent(path)}
            className={cn("flex items-center gap-1.5 p-1.5 rounded cursor-pointer text-[11px] transition-colors", isSelected ? "bg-primary/10 border border-primary/30 text-primary" : "hover:bg-accent border border-transparent")}>
            {hasChildren ? (isExpanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />) : <div className={cn("h-2 w-2 rounded-sm border flex-shrink-0", isSelected ? "bg-primary border-primary" : "border-muted-foreground/40")} />}
            <span className="font-mono flex-1 truncate">{name}</span>
            {simpleType && simpleType !== name && <span className="text-muted-foreground/50 text-[10px] flex-shrink-0">{simpleType}</span>}
          </div>
          {hasChildren && isExpanded && <div className="pl-3 border-l border-border/30 ml-1">{renderTree(node.fields, path, expandedKeys, setExpandedKeys, current, setCurrent)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="py-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Source */}
        <div className="space-y-2">
          {/* External input */}
          <div className="rounded-md border border-border p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">External Input</p>
            <div className="flex gap-1.5">
              <input value={externalExpr} onChange={e => setExternalExpr(e.target.value)} placeholder="e.g. request.username" className="flex h-7 flex-1 rounded border border-input bg-background px-2 py-1 text-[11px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              <Button size="sm" className="h-7 px-2 text-[10px]" onClick={() => {
                const v = externalExpr.trim(); if (!v) return;
                setCurrentSrc(v.startsWith("workflow.") || v.startsWith("env.") ? v : `workflow.input.${v}`);
              }} disabled={!externalExpr.trim()}>Use</Button>
            </div>
            {currentSrc && <p className="text-[10px] font-mono text-primary mt-1 truncate">→ {currentSrc}</p>}
          </div>
          {/* Source outputs */}
          <div className="rounded-md border border-border">
            <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">Output Fields · {sourceData?.label}</p>
            <ScrollArea className="h-44 p-2">{sourceTree.length ? renderTree(sourceTree, "", expandedSrcKeys, setExpandedSrcKeys, currentSrc, setCurrentSrc) : <p className="text-[11px] text-muted-foreground text-center py-4">No outputs</p>}</ScrollArea>
          </div>
        </div>
        {/* Target inputs */}
        <div className="rounded-md border border-border">
          <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">Input Fields · {targetData?.label}</p>
          <ScrollArea className="h-64 p-2">{targetTree.length ? renderTree(targetTree, "", expandedTgtKeys, setExpandedTgtKeys, currentTgt, setCurrentTgt) : <p className="text-[11px] text-muted-foreground text-center py-4">No inputs</p>}</ScrollArea>
        </div>
      </div>

      {/* Add mapping */}
      {currentSrc && currentTgt && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-2.5">
          <span className="text-[11px] font-mono text-foreground/80 flex-1 truncate">{currentSrc}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-[11px] font-mono text-primary flex-1 truncate">{currentTgt}</span>
          <Button size="sm" className="h-7 px-2 text-[10px] flex-shrink-0" onClick={() => {
            if (!mappings.some(m => m.sourceField === currentSrc && m.targetField === currentTgt)) {
              setMappings([...mappings, { sourceField: currentSrc, targetField: currentTgt }]);
              setCurrentSrc(""); setCurrentTgt("");
            }
          }}>Add</Button>
        </div>
      )}

      {/* Mapping list */}
      {mappings.length > 0 && (
        <div className="rounded-md border border-border p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Mappings ({mappings.length})</p>
          <div className="space-y-1 max-h-32 overflow-auto">
            {mappings.map((m, i) => (
              <div key={i} className="flex items-center gap-2 rounded bg-muted/30 px-2 py-1 text-[11px]">
                <span className="font-mono truncate flex-1">{m.sourceField}</span>
                <ArrowRight className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground" />
                <span className="font-mono truncate flex-1 text-primary">{m.targetField}</span>
                <button onClick={() => setMappings(mappings.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive flex-shrink-0"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div>
        <Label className="text-xs mb-1.5 block">Connection Note</Label>
        <input value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="Why this connection exists…" className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="flex-1" disabled={mappings.length === 0} onClick={() => onConfirm(mappings, explanation.trim())}>Confirm Mapping</Button>
      </div>
    </div>
  );
}
