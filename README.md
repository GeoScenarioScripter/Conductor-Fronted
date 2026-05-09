# 2026-06-09 前端变更说明

## 概览

本次分支在 `origin/main` 基础上主要完成了前端控制台化改造、页面结构扩展、工作流编辑体验增强，以及本地后端 API 路径适配。整体效果是：前端从原来的基础功能入口，升级为更完整的管理控制台界面，并能够正确连接本地 `conductor-main` 后端服务。

## 1. 新增控制台 Hub 页面

新增 `/hub` 路由，并将系统默认首页从原来的工作流页面调整为 `/hub`。

主要内容：

- 新增模块卡片、Hub 数据配置和功能入口。
- 通过卡片聚合展示核心模块能力。
- 增加卡片动画、主题色区分和控制台式入口布局。

实际效果：

- 用户进入系统后首先看到统一控制台。
- 各核心模块入口更集中，适合作为系统首页和功能导航页。

## 2. 改造整体导航和页面布局

`MainLayout.tsx` 进行了较大调整，侧边栏从原来的中文基础菜单，扩展为更完整的产品导航结构。

当前导航包含：

- 控制台
- Overview
- Workflows
- Services
- Data Sources
- Projects
- Delivery

同时新增：

- 可折叠侧边栏。
- 折叠状态下的 tooltip 提示。
- 顶部状态栏。
- 更统一的控制台视觉风格。

路由兼容调整：

```text
/database -> /datasources
/apps     -> /delivery
```

实际效果：

- 导航层级更清晰。
- 页面结构更接近完整后台管理系统。
- 旧路由仍可跳转到新的功能页，降低入口变更影响。

## 3. 新增页面和通用 UI 组件

新增页面：

- `DataSourcesPage`
- `DeliveryPage`
- `OverviewPage`
- `ProjectsPage`
- `HubPage`

新增或引入的 UI 组件包括：

- `glass-panel`
- `metric-card`
- `page-header`
- `status-badge`
- `tabs`
- `sheet`
- `tooltip`
- `dropdown-menu`
- `accordion`
- `checkbox`
- `progress`
- `scroll-area`
- `separator`

实际效果：

- 页面可复用组件更丰富。
- 数据源、项目、交付、概览等模块开始具备独立页面承载能力。
- 整体 UI 从单点功能页面扩展为多模块管理控制台。

## 4. 工作流编辑器和服务页改造

`WorkflowEditorPage.tsx` 和 `ServicesPage.tsx` 都进行了较大规模调整。

新增工作流相关组件：

- `FlowToolbar`
- `InspectorPanel`
- `ResourcePanel`

实际效果：

- 工作流编辑区域的工具栏、属性检查和资源选择能力更明确。
- 服务页和工作流编排体验更接近正式产品形态。
- 后续可以继续围绕资源面板、节点配置、服务调用参数做增强。

## 5. 修复本地后端 API 路径

后端通过 `WebMvcConfig` 给不同模块自动添加 API 前缀：

```text
conductor  -> /api/conductor
fabricator -> /api/fabricator
launcher   -> /api/launcher
project    -> /api/project
```

因此前端原来的部分接口路径会请求到不存在的地址，导致 404。

本次已修正：

```text
/api/metadata/applications -> /api/conductor/modules
/api/workflow/definitions  -> /api/conductor/workflow/definitions
/api/databases             -> /api/fabricator/datasources
```

实际效果：

- 修复前端访问本地后端时出现的接口 404。
- 工作流列表、模块元数据、数据源列表能够请求到正确后端模块。
- Vite 开发代理继续使用 `/api`，但代理后的真实后端路径已和 `conductor-main` 对齐。

## 6. 本地开发环境变量调整

`.env` 已调整为本地后端地址：

```env
VITE_API_BASE_URL=http://localhost:8765/api
```

实际效果：

- 本地前端开发时会连接本机后端。
- 适合当前 Docker + 本地 Spring Boot 的开发方式。

注意：

- 如果该分支用于生产部署，不能直接使用 `localhost:8765`。
- 生产环境应改成对应服务器的后端 API 地址，或通过部署环境变量覆盖。

