import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import WorkflowListPage from "@/features/workflow/WorkflowListPage";
import WorkflowEditorPage from "@/features/workflow/WorkflowEditorPage";
import ServicesPage from "@/features/services/ServicesPage";
import DatabasePage from "@/features/database/DatabasePage";
import AppsPage from "@/features/apps/AppsPage";
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import { isAuthenticated } from "@/lib/auth";
// Theme Provider
import { ThemeProvider } from "@/components/theme-provider";

function RequireAuth() {
  // 开发阶段：后端鉴权接口未就绪时直接放行
  if (import.meta.env.DEV) {
    return <Outlet />;
  }
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="conductor-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/workflow" replace />} />
              <Route path="workflow" element={<WorkflowListPage />} />
              <Route path="workflow/new" element={<WorkflowEditorPage />} />
              <Route path="workflow/:id/edit" element={<WorkflowEditorPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="database" element={<DatabasePage />} />
              <Route path="apps" element={<AppsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
