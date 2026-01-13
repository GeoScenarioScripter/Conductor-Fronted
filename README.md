# 前端开发文档

## 1. 项目介绍

本项目为 **Microservice Orchestration Platform (Conductor)** 的前端部分。
平台采用 **监控中台** 风格，设计目标为**高性能** 的工作流编排与微服务治理系统。

### 核心功能

1. **微服务工作流编排 (Workflow)**：可视化拖拽编排微服务节点，配置输入输出接口连接，支持模拟运行。
2. **微服务管理 (Services)**：查看与管理微服务状态、版本、类型及关联数据库。
3. **数据库治理 (Database)**：管理数据库文件，提供数据预览、上传与类型管理 (PostgreSQL, MySQL, SQLite 等)。
4. **微应用管理 (Apps)**：将多个微服务组合为微应用，支持导出部署配置 (Docker/K8s)。
5. **资源上传 (Upload)**：支持拖拽上传微应用制品 (JAR) 与配置文件 (YML/YAML)。

## 2. 技术选型

- **核心框架**: React 18 + Vite 6 + TypeScript
- **路由管理**: React Router v7
- **UI 组件库**: Tailwind CSS + Shadcn UI (基于 Radix UI)
- **动画交互**: Framer Motion (页面切换、悬停特效)
- **工作流引擎**: React Flow (@xyflow/react)
- **状态管理**: Zustand + TanStack Query (React Query)
- **数据表格**: TanStack Table (React Table)
- **图标库**: Lucide React
- **工具库**: date-fns, uuid, clsx, tailwind-merge
- **包管理**: pnpm

## 3. 项目结构

```text
src/
  ├── components/
  │   ├── layout/          # 全局布局 (Sidebar, Header, MainLayout)
  │   ├── ui/              # 通用 UI 组件 (Button, Card, Dialog, Table, etc.)
  │   ├── mode-toggle.tsx  # 主题切换
  │   └── theme-provider.tsx # 主题上下文
  ├── features/
  │   ├── apps/            # 微应用管理模块
  │   │   └── AppsPage.tsx
  │   ├── database/        # 数据库治理模块
  │   │   └── DatabasePage.tsx
  │   ├── services/        # 微服务列表模块
  │   │   └── ServicesPage.tsx
  │   ├── upload/          # 资源上传模块
  │   │   └── UploadPage.tsx
  │   └── workflow/        # 工作流编排模块
  │       ├── components/  # 工作流特定组件 (Node, Sidebar, ContextMenu)
  │       ├── types/       # 类型定义
  │       └── WorkflowPage.tsx
  ├── lib/                 # 工具函数 (utils.ts)
  ├── assets/              # 静态资源
  ├── App.tsx              # 路由配置与应用入口
  └── index.css            # 全局样式 & Tailwind 配置
```

## 4. 详细功能说明

### 4.1 工作流编排 (Workflow)

- **位置**: `src/features/workflow`
- **功能**:
  - 基于 `React Flow` 的画布交互。
  - 自定义 `MicroserviceNode` 支持多端口连接。
  - 侧边栏拖拽添加节点。
  - 状态模拟：Idle -> Running -> Success/Error。

### 4.2 微服务管理 (Services)

- **位置**: `src/features/services`
- **功能**:
  - 展示微服务列表 (Mock Data)。
  - 支持按名称或类型搜索。
  - 查看服务详情：版本、类型 (SpringBoot, NodeJS, etc.)、关联数据库。
  - 分页浏览。

### 4.3 数据库治理 (Database)

- **位置**: `src/features/database`
- **功能**:
  - 数据库文件列表管理。
  - 支持多种数据库类型标识 (PostgreSQL, MySQL, SQLite, MinIO)。
  - **数据预览**: 点击预览按钮可查看模拟的表数据。
  - 文件上传模拟。

### 4.4 微应用管理 (Apps)

- **位置**: `src/features/apps`
- **功能**:
  - 展示已编排的微应用。
  - **部署导出**: 支持下载 Docker 或 Kubernetes 部署配置包。

### 4.5 资源上传 (Upload)

- **位置**: `src/features/upload`
- **功能**:
  - 拖拽上传区域。
  - 支持 `.jar`, `.yml`, `.yaml` 文件格式。
  - 上传进度与成功状态反馈 (Mock)。

### 4.6 样式与主题

- **深色模式**: 默认 Dark Mode，采用 Cyberpunk/监控中台风格。
- **配色**:
  - Primary: Neon Cyan
  - Secondary: Neon Purple
  - Background: Deep Space Black
- **动画**: 使用 `Framer Motion` 实现平滑的页面过渡与组件入场动画。

## 5. 接口对接 (API Integration)

### 5.1 项目结构

API 相关代码已创建在以下目录：

```
src/
├── lib/
│   └── api-client.ts          # API 客户端基础配置（统一请求处理）
├── services/                  # API 服务层
│   ├── database.service.ts    # 数据库相关 API
│   ├── services.service.ts    # 微服务相关 API
│   ├── apps.service.ts        # 微应用相关 API
│   ├── workflow.service.ts    # 工作流相关 API
│   └── upload.service.ts      # 文件上传相关 API
├── hooks/                     # React Query Hooks
│   ├── use-databases.ts      # 数据库相关 hooks
│   ├── use-services.ts       # 微服务相关 hooks
│   ├── use-apps.ts           # 微应用相关 hooks
│   └── use-workflow.ts       # 工作流相关 hooks
└── providers/
    └── query-provider.tsx    # React Query Provider
```

### 5.2 环境配置

创建 `.env` 文件配置 API 基础地址：

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

### 5.3 使用方式

#### 在组件中使用 Hooks

```tsx
import { useServices } from '@/hooks/use-services';

function ServicesPage() {
  const { data: services = [], isLoading, error } = useServices();
  
  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  
  return (
    <div>
      {services.map(service => (
        <div key={service.id}>{service.name}</div>
      ))}
    </div>
  );
}
```

#### 执行操作（Mutation）

```tsx
import { useDeleteService } from '@/hooks/use-services';

function ServiceCard({ service }) {
  const deleteMutation = useDeleteService();
  
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(service.id);
      alert('删除成功！');
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };
  
  return <button onClick={handleDelete}>删除</button>;
}
```

### 5.4 API 接口规范

#### 微服务 API

- `GET /api/services` - 获取微服务列表
- `GET /api/services/:id` - 获取微服务详情
- `GET /api/services/:id/logs` - 获取服务日志
- `PUT /api/services/:id` - 更新微服务
- `PUT /api/services/:id/status` - 切换服务状态
- `POST /api/services/:id/restart` - 重启容器
- `DELETE /api/services/:id` - 删除微服务

#### 数据库 API

- `GET /api/databases` - 获取数据库列表
- `GET /api/databases/:id` - 获取数据库详情
- `GET /api/databases/:id/preview` - 预览数据库数据
- `POST /api/databases/upload` - 上传数据库文件
- `POST /api/databases/connect` - 连接 MinIO
- `DELETE /api/databases/:id` - 删除数据库
- `PUT /api/databases/:id/data` - 更新数据库数据

#### 微应用 API

- `GET /api/apps` - 获取微应用列表
- `GET /api/apps/:id` - 获取微应用详情
- `GET /api/apps/:id/download?environment=docker|k8s` - 下载部署配置

#### 工作流 API

- `GET /api/workflows` - 获取工作流列表
- `GET /api/workflows/:id` - 获取工作流详情
- `POST /api/workflows` - 创建工作流
- `PUT /api/workflows/:id` - 更新工作流
- `DELETE /api/workflows/:id` - 删除工作流
- `POST /api/workflows/:id/run` - 执行工作流
- `POST /api/workflows/:id/archive` - 归档工作流
- `GET /api/workflows/available-databases` - 获取可用数据库列表

#### 文件上传 API

- `POST /api/upload` - 上传文件（支持进度回调）

### 5.5 认证

API 客户端会自动从 `localStorage` 读取 `token` 并添加到请求头：

```typescript
// 登录后存储 token
localStorage.setItem('token', 'your-token-here');
```

### 5.6 迁移现有页面

将虚拟数据替换为真实 API 的步骤：

1. **导入 hooks**
   ```tsx
   import { useServices } from '@/hooks/use-services';
   ```

2. **替换状态管理**
   ```tsx
   // 之前
   const [services, setServices] = useState(initialServices);
   
   // 之后
   const { data: services = [], isLoading, error } = useServices();
   ```

3. **替换操作函数**
   ```tsx
   // 之前
   const handleDelete = (id) => {
     setServices(services.filter(s => s.id !== id));
   };
   
   // 之后
   const deleteMutation = useDeleteService();
   const handleDelete = async (id) => {
     await deleteMutation.mutateAsync(id);
   };
   ```

4. **添加加载和错误状态**
   ```tsx
   if (isLoading) return <LoadingSpinner />;
   if (error) return <ErrorMessage error={error} />;
   ```

### 5.7 特性说明

- ✅ **自动缓存** - React Query 自动缓存数据，减少重复请求
- ✅ **自动重试** - 失败请求自动重试
- ✅ **类型安全** - 完整的 TypeScript 类型定义
- ✅ **错误处理** - 统一的错误处理机制
- ✅ **加载状态** - 自动管理加载状态
- ✅ **实时更新** - 支持实时数据刷新（如日志每5秒刷新）

### 5.8 注意事项

1. **环境变量**: 确保 `.env` 文件中的 `VITE_API_BASE_URL` 正确配置
2. **错误处理**: 所有 API 调用都应该有 try-catch 处理
3. **类型安全**: 确保 API 返回的数据类型与 TypeScript 类型定义一致
4. **性能优化**: 使用 React Query 的缓存机制，合理设置 `staleTime` 和 `gcTime`

## 6. 开发规范

- **组件**: PascalCase, Functional Components.
- **样式**: Tailwind Utility Classes + `cn()` helper.
- **状态**: 本地状态用 `useState`, 全局 UI 状态用 `Zustand`, 服务端数据用 `React Query`.
- **类型**: 严格 TypeScript 类型定义。

## 7. 快速开始

1. 安装依赖:
   ```bash
   pnpm install
   ```
2. 启动开发服务器:
   ```bash
   pnpm dev
   ```
3. 构建生产环境:
   ```bash
   pnpm build
   ```
4. 预览构建:
   ```bash
   pnpm preview
   ```
