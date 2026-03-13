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
import { getMethodDetail } from "@/services/workflow-metadata.service";

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
                detail: { edgeId: id, mappings: data?.mappings || [] },
              });
              window.dispatchEvent(event);
            }}
            className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg hover:bg-primary/90 transition-colors"
            title="修改映射"
          >
            <Settings className="h-3 w-3" />
          </button>
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
      const { edgeId, mappings } = event.detail;
      const edge = edges.find((e) => e.id === edgeId);
      if (edge) {
        setEditingEdgeId(edgeId);
        setExistingMappings(mappings);
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
            onClick={() => {}}
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
              选择源方法的输出参数和目标方法的输入参数进行连接
            </DialogDescription>
          </DialogHeader>
          {pendingConnection && (
            <ConnectionConfigDialogContent
              connection={pendingConnection}
              nodes={nodes}
              existingMappings={existingMappings}
              onConfirm={(mappings) => {
                if (pendingConnection && mappings.length > 0) {
                  if (editingEdgeId) {
                    // 更新现有边
                    setEdges((eds) =>
                      eds.map((edge) => {
                        if (edge.id === editingEdgeId) {
                          return {
                            ...edge,
                            data: { mappings },
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
                          data: { mappings },
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
              }}
              onCancel={() => {
                setIsConnectionDialogOpen(false);
                setPendingConnection(null);
              }}
            />
          )}
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
  onConfirm,
  onCancel,
}: {
  connection: Connection;
  nodes: Node[];
  existingMappings?: Array<{ sourceField: string; targetField: string }>;
  onConfirm: (mappings: Array<{ sourceField: string; targetField: string }>) => void;
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

  const [expandedSource, setExpandedSource] = useState(true);
  const [expandedTarget, setExpandedTarget] = useState(true);
  const [expandedSourceKeys, setExpandedSourceKeys] = useState<string[]>([]);
  const [expandedTargetKeys, setExpandedTargetKeys] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Array<{ sourceField: string; targetField: string }>>(existingMappings);
  const [currentSourceField, setCurrentSourceField] = useState<string>("");
  const [currentTargetField, setCurrentTargetField] = useState<string>("");

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
      onConfirm(mappings);
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
