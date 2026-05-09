import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ThemeProvider } from "@/components/theme-provider";

const HubPage            = lazy(() => import("@/features/hub/HubPage"));
const WorkflowListPage   = lazy(() => import("@/features/workflow/WorkflowListPage"));
const WorkflowEditorPage = lazy(() => import("@/features/workflow/WorkflowEditorPage"));
const ServicesPage       = lazy(() => import("@/features/services/ServicesPage"));
const OverviewPage       = lazy(() => import("@/features/overview/OverviewPage"));
const DataSourcesPage    = lazy(() => import("@/features/datasources/DataSourcesPage"));
const ProjectsPage       = lazy(() => import("@/features/projects/ProjectsPage"));
const DeliveryPage       = lazy(() => import("@/features/delivery/DeliveryPage"));

const PageLoader = () => (
  <div className="flex h-full items-center justify-center">
    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const wrap = (el: React.ReactElement) => (
  <Suspense fallback={<PageLoader />}>{el}</Suspense>
);

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="conductor-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/hub" replace />} />
            <Route path="hub"         element={wrap(<HubPage />)} />
            <Route path="overview"    element={wrap(<OverviewPage />)} />
            <Route path="workflow"    element={wrap(<WorkflowListPage />)} />
            <Route path="workflow/new"          element={wrap(<WorkflowEditorPage />)} />
            <Route path="workflow/:id/edit"     element={wrap(<WorkflowEditorPage />)} />
            <Route path="services"   element={wrap(<ServicesPage />)} />
            <Route path="datasources" element={wrap(<DataSourcesPage />)} />
            <Route path="database"   element={<Navigate to="/datasources" replace />} />
            <Route path="projects"   element={wrap(<ProjectsPage />)} />
            <Route path="delivery"   element={wrap(<DeliveryPage />)} />
            <Route path="apps"       element={<Navigate to="/delivery" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
