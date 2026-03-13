import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Workflow,
  Upload,
  Server,
  Database,
  AppWindow,
  Menu,
  X,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";

const navItems = [
  { path: "/workflow", label: "工作流管理", icon: Workflow },
  { path: "/upload", label: "微应用上传", icon: Upload },
  { path: "/services", label: "微应用管理", icon: Server },
  { path: "/database", label: "数据库治理", icon: Database },
  { path: "/apps", label: "应用交付管理", icon: AppWindow },
];

export function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="relative border-r border-border bg-sidebar/50 backdrop-blur-xl flex flex-col z-20"
      >
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Activity className="h-6 w-6 text-primary animate-pulse" />
          {isSidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-3 font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-slate-400 dark:to-secondary"
            >
              CONDUCTOR
            </motion.span>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-3 rounded-md transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "dark:text-white bg-sky-200/50  border border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-sky-200/50 border-l-2 border-primary"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "h-5 w-5 z-10 transition-colors",
                      isActive ? "text-primary" : "group-hover:text-primary"
                    )}
                  />
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="ml-3 font-medium z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden from-slate-900 via-background to-background">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        {/* Header */}
        <header className="h-16 border-b border-border/50 bg-background/50 backdrop-blur-sm flex items-center justify-between px-8 z-10">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground/90">
              {navItems.find((i) => location.pathname.startsWith(i.path))?.label ||
                "Dashboard"}
            </h2>
            <p className="text-xs text-muted-foreground">
              System Status: <span className="text-green-500">Operational</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">A</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 z-10 scrollbar-thin">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
