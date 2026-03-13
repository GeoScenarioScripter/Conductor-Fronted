import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import WorkflowListPage from "@/features/workflow/WorkflowListPage";
import WorkflowEditorPage from "@/features/workflow/WorkflowEditorPage";
import ServicesPage from "@/features/services/ServicesPage";
import DatabasePage from "@/features/database/DatabasePage";
import AppsPage from "@/features/apps/AppsPage";
// Theme Provider
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="conductor-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/workflow" replace />} />
            <Route path="workflow" element={<WorkflowListPage />} />
            <Route path="workflow/new" element={<WorkflowEditorPage />} />
            <Route path="workflow/:id/edit" element={<WorkflowEditorPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="database" element={<DatabasePage />} />
            <Route path="apps" element={<AppsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
