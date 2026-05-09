import type { LucideIcon } from "lucide-react";
import { Database, Server, GitBranch, Layers, Package, LayoutDashboard } from "lucide-react";

export type FeatureColor = "amber" | "violet" | "cyan" | "emerald" | "orange" | "blue";
export type FeatureId = "datasources" | "services" | "workflow" | "projects" | "delivery" | "overview";

export interface QuickAction {
  label: string;
  labelEn: string;
  variant: "default" | "outline" | "ghost";
  href?: string;
  action?: string;
}

export interface FeatureDef {
  id: FeatureId;
  route: string;
  title: string;
  titleEn: string;
  tagline: string;
  bannerText: string;
  description: string;
  detailDescription: string;
  icon: LucideIcon;
  color: FeatureColor;
  tags: string[];
  features: { title: string; desc: string }[];
  quickActions: QuickAction[];
  stats: { label: string; value: string }[];
}

export const colorTokens: Record<FeatureColor, {
  text: string;
  iconBg: string;
  border: string;
  gradientFrom: string;
  gradientTo: string;
  hoverBorder: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
  orbBg: string;
  dot: string;
  traitGradient: [string, string];
  bannerGradient: [string, string];
}> = {
  amber: {
    text: "text-amber-400",
    iconBg: "bg-amber-400/15",
    border: "border-amber-400/25",
    gradientFrom: "from-amber-400/25",
    gradientTo: "to-transparent",
    hoverBorder: "group-hover:from-amber-400/55",
    chipBg: "bg-amber-400/10",
    chipText: "text-amber-400/75",
    chipBorder: "border-amber-400/20",
    orbBg: "bg-amber-400",
    dot: "bg-amber-400",
    traitGradient: ["#fbbf24", "#fb923c"],
    bannerGradient: ["#b45309", "#c2410c"],
  },
  violet: {
    text: "text-violet-400",
    iconBg: "bg-violet-400/15",
    border: "border-violet-400/25",
    gradientFrom: "from-violet-400/25",
    gradientTo: "to-transparent",
    hoverBorder: "group-hover:from-violet-400/55",
    chipBg: "bg-violet-400/10",
    chipText: "text-violet-400/75",
    chipBorder: "border-violet-400/20",
    orbBg: "bg-violet-400",
    dot: "bg-violet-400",
    traitGradient: ["#a78bfa", "#c084fc"],
    bannerGradient: ["#6d28d9", "#9333ea"],
  },
  cyan: {
    text: "text-cyan-400",
    iconBg: "bg-cyan-400/15",
    border: "border-cyan-400/25",
    gradientFrom: "from-cyan-400/25",
    gradientTo: "to-transparent",
    hoverBorder: "group-hover:from-cyan-400/55",
    chipBg: "bg-cyan-400/10",
    chipText: "text-cyan-400/75",
    chipBorder: "border-cyan-400/20",
    orbBg: "bg-cyan-400",
    dot: "bg-cyan-400",
    traitGradient: ["#818cf8", "#38bdf8"],
    bannerGradient: ["#4f46e5", "#0284c7"],
  },
  emerald: {
    text: "text-emerald-400",
    iconBg: "bg-emerald-400/15",
    border: "border-emerald-400/25",
    gradientFrom: "from-emerald-400/25",
    gradientTo: "to-transparent",
    hoverBorder: "group-hover:from-emerald-400/55",
    chipBg: "bg-emerald-400/10",
    chipText: "text-emerald-400/75",
    chipBorder: "border-emerald-400/20",
    orbBg: "bg-emerald-400",
    dot: "bg-emerald-400",
    traitGradient: ["#2dd4bf", "#34d399"],
    bannerGradient: ["#0f766e", "#059669"],
  },
  orange: {
    text: "text-orange-400",
    iconBg: "bg-orange-400/15",
    border: "border-orange-400/25",
    gradientFrom: "from-orange-400/25",
    gradientTo: "to-transparent",
    hoverBorder: "group-hover:from-orange-400/55",
    chipBg: "bg-orange-400/10",
    chipText: "text-orange-400/75",
    chipBorder: "border-orange-400/20",
    orbBg: "bg-orange-400",
    dot: "bg-orange-400",
    traitGradient: ["#fb923c", "#fbbf24"],
    bannerGradient: ["#c2410c", "#b45309"],
  },
  blue: {
    text: "text-blue-400",
    iconBg: "bg-blue-400/15",
    border: "border-blue-400/25",
    gradientFrom: "from-blue-400/25",
    gradientTo: "to-transparent",
    hoverBorder: "group-hover:from-blue-400/55",
    chipBg: "bg-blue-400/10",
    chipText: "text-blue-400/75",
    chipBorder: "border-blue-400/20",
    orbBg: "bg-blue-400",
    dot: "bg-blue-400",
    traitGradient: ["#60a5fa", "#22d3ee"],
    bannerGradient: ["#1d4ed8", "#0891b2"],
  },
};

export const FEATURES: FeatureDef[] = [
  {
    id: "datasources",
    route: "/datasources",
    title: "数据源",
    titleEn: "Data Sources",
    tagline: "Connect & manage data connections",
    bannerText: "CONNECT",
    description: "注册 MySQL、PostgreSQL 和 MinIO 数据源。验证连接、检查 Schema 结构，并将数据存储绑定到微服务实例。",
    detailDescription: "数据源模块是每条管道的基础。注册关系型数据库和对象存储桶，运行连接健康检查，并将每个数据源映射到依赖它的服务。Conductor 自动处理连接验证与 Schema 提取，确保管道可重复部署。",
    icon: Database,
    color: "amber",
    tags: ["MySQL", "PostgreSQL", "MinIO", "Schema 验证"],
    features: [
      { title: "数据库连接", desc: "注册并验证 MySQL / PostgreSQL 数据源" },
      { title: "Schema 验证", desc: "自动提取表结构，检测变更与冲突" },
      { title: "MinIO 存储", desc: "对接对象存储桶，绑定到服务实例" },
    ],
    quickActions: [
      { label: "添加数据源", labelEn: "Add Source", variant: "default", href: "/datasources" },
      { label: "查看全部", labelEn: "View All", variant: "outline", href: "/datasources" },
    ],
    stats: [
      { label: "已连接数据源", value: "—" },
      { label: "健康状态", value: "—" },
      { label: "数据表总数", value: "—" },
    ],
  },
  {
    id: "services",
    route: "/services",
    title: "服务",
    titleEn: "Services",
    tagline: "Discover & manage microservices",
    bannerText: "DISCOVER",
    description: "上传 JAR 包自动发现微服务接口，检查 API 方法、返回类型，并构建可供编排使用的 Docker 镜像。",
    detailDescription: "上传任意 Spring Boot 或 Dubbo JAR，Conductor 将解析字节码提取服务接口、方法签名和返回类型。发现的服务自动注册到 Nacos，并立即作为工作流节点使用。Docker 镜像按需构建，无需手动编写 Dockerfile。",
    icon: Server,
    color: "violet",
    tags: ["JAR 上传", "Docker 构建", "Nacos", "API 发现"],
    features: [
      { title: "JAR 上传", desc: "解析字节码，自动发现服务接口与方法" },
      { title: "Nacos 注册", desc: "发现的服务即时注册到服务中心" },
      { title: "Docker 构建", desc: "按需生成镜像，无需手写 Dockerfile" },
    ],
    quickActions: [
      { label: "上传 JAR", labelEn: "Upload JAR", variant: "default", href: "/services" },
      { label: "查看全部", labelEn: "View All", variant: "outline", href: "/services" },
    ],
    stats: [
      { label: "已发现应用", value: "—" },
      { label: "在线实例", value: "—" },
      { label: "已发现方法数", value: "—" },
    ],
  },
  {
    id: "workflow",
    route: "/workflow",
    title: "工作流",
    titleEn: "Workflows",
    tagline: "Visual DAG orchestration",
    bannerText: "ORCHESTRATE",
    description: "在可拖拽画布上设计服务调用图，定义微服务间的数据流转和执行顺序，发布工作流供 REST API 立即调用。",
    detailDescription: "工作流编辑器提供基于 React Flow 的可视化画布，每个已发现的服务方法均可作为可拖动节点。通过连接节点定义数据流，内联配置调用参数，保存为命名工作流定义。工作流可嵌入项目内或通过 REST API 独立触发执行。",
    icon: GitBranch,
    color: "cyan",
    tags: ["DAG 编排", "拖拽编辑", "可视化", "REST 触发"],
    features: [
      { title: "可视化 DAG", desc: "拖拽画布设计服务调用有向无环图" },
      { title: "服务节点编排", desc: "已发现方法即用即拖，内联配置参数" },
      { title: "REST 触发", desc: "保存即发布，工作流通过 API 立即可调" },
    ],
    quickActions: [
      { label: "新建工作流", labelEn: "New Workflow", variant: "default", href: "/workflow/new" },
      { label: "查看全部", labelEn: "View All", variant: "outline", href: "/workflow" },
    ],
    stats: [
      { label: "活跃工作流", value: "—" },
      { label: "草稿工作流", value: "—" },
      { label: "平均节点数", value: "—" },
    ],
  },
  {
    id: "projects",
    route: "/projects",
    title: "项目",
    titleEn: "Projects",
    tagline: "Aggregate, analyze & merge",
    bannerText: "AGGREGATE",
    description: "将服务和工作流聚合为完整项目，运行数据库冲突分析，规划 DB 合并策略，四阶段管道追踪交付进度。",
    detailDescription: "项目是 Conductor 的交付单元。聚合任意数量的微服务和工作流定义，然后运行四阶段管道：服务聚合 → 冲突分析 → 合并规划 → 部署发布。Conductor 自动检测共享同一 Schema 的服务间 DDL 冲突，并引导制定合并策略。",
    icon: Layers,
    color: "emerald",
    tags: ["冲突分析", "DB 合并", "四阶段管道", "DDL 管理"],
    features: [
      { title: "服务聚合", desc: "将微服务与工作流打包为一个交付单元" },
      { title: "DDL 冲突分析", desc: "自动检测多服务间 Schema 冲突" },
      { title: "四阶段管道", desc: "聚合 → 分析 → 合并 → 发布全程追踪" },
    ],
    quickActions: [
      { label: "新建项目", labelEn: "New Project", variant: "default", href: "/projects" },
      { label: "查看全部", labelEn: "View All", variant: "outline", href: "/projects" },
    ],
    stats: [
      { label: "活跃项目", value: "—" },
      { label: "已部署项目", value: "—" },
      { label: "已解决冲突", value: "—" },
    ],
  },
  {
    id: "delivery",
    route: "/delivery",
    title: "发布",
    titleEn: "Delivery",
    tagline: "Package and deploy applications",
    bannerText: "DEPLOY",
    description: "构建 Docker 镜像，导出 docker-compose 或 K8s 清单，一键将包含完整基础设施的应用包推送到目标环境。",
    detailDescription: "发布模块将完成的项目打包为完整的自包含部署捆绑包：所有业务服务 Docker 镜像、基础设施镜像（Nacos、Redis、RabbitMQ、MinIO、MySQL）、SQL 种子数据和预配置的 docker-compose.yml。下载 ZIP 即可在任何环境零配置一键部署。",
    icon: Package,
    color: "orange",
    tags: ["Docker Compose", "Kubernetes", "Bundle 导出", "一键部署"],
    features: [
      { title: "Docker 打包", desc: "构建业务镜像 + 基础设施，导出 ZIP" },
      { title: "K8s 清单", desc: "自动生成 Kubernetes 部署清单" },
      { title: "一键部署", desc: "零配置，任意环境开箱即用" },
    ],
    quickActions: [
      { label: "立即打包", labelEn: "Start Build", variant: "default", href: "/delivery" },
      { label: "查看全部", labelEn: "View All", variant: "outline", href: "/delivery" },
    ],
    stats: [
      { label: "待部署应用", value: "—" },
      { label: "已部署应用", value: "—" },
      { label: "平均构建时长", value: "—" },
    ],
  },
  {
    id: "overview",
    route: "/overview",
    title: "概览",
    titleEn: "Overview",
    tagline: "System health & pipeline KPIs",
    bannerText: "MONITOR",
    description: "在统一仪表盘中监控所有平台组件——活跃服务、运行工作流、数据源健康状态和近期管道活动一览无余。",
    detailDescription: "概览仪表盘汇聚 Conductor 各子系统的实时遥测数据。追踪关键指标（服务数、数据源、工作流、可交付物），查看端到端管道执行状态，从系统健康检查中快速定位告警。专为需要单一全局视图的运维团队设计。",
    icon: LayoutDashboard,
    color: "blue",
    tags: ["KPI 监控", "健康检查", "管道状态", "活动日志"],
    features: [
      { title: "KPI 监控", desc: "实时汇聚各子系统关键指标" },
      { title: "管道状态", desc: "端到端执行状态一览，快速定位告警" },
      { title: "活动日志", desc: "近期平台操作与事件时序记录" },
    ],
    quickActions: [
      { label: "查看监控", labelEn: "Open Dashboard", variant: "default", href: "/overview" },
    ],
    stats: [
      { label: "系统可用率", value: "99.9%" },
      { label: "在线服务", value: "—" },
      { label: "活跃管道", value: "—" },
    ],
  },
];
