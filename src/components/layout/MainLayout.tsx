import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LayoutGrid,
  Workflow,
  Server,
  Database,
  FolderGit2,
  Package,
  Menu,
  ChevronLeft,
  Activity,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { path: "/hub",          label: "控制台",           icon: LayoutGrid },
  { path: "/overview",     label: "Overview",        icon: LayoutDashboard },
  { path: "/workflow",     label: "Workflows",       icon: Workflow },
  { path: "/services",     label: "Services",        icon: Server },
  { path: "/datasources",  label: "Data Sources",    icon: Database },
  { path: "/projects",     label: "Projects",        icon: FolderGit2 },
  { path: "/delivery",     label: "Delivery",        icon: Package },
];

const SIDEBAR_EXPANDED = 228;
const SIDEBAR_COLLAPSED = 64;

export function MainLayout() {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();

  const currentPage = navItems.find(i => location.pathname.startsWith(i.path));

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">

        {/* ── Sidebar ── */}
        <motion.aside
          animate={{ width: expanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex flex-col flex-shrink-0 border-r border-sidebar-border bg-sidebar overflow-hidden z-20"
        >
          {/* Logo */}
          <div className="flex h-14 items-center px-4 border-b border-sidebar-border gap-3 overflow-hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 border border-primary/30 flex-shrink-0">
              <Activity className="h-3.5 w-3.5 text-primary" />
            </div>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col leading-none overflow-hidden"
                >
                  <span className="text-sm font-bold tracking-widest text-foreground">CONDUCTOR</span>
                  <span className="text-[10px] text-muted-foreground tracking-wider">ORCHESTRATION</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const link = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm font-medium transition-colors duration-150 overflow-hidden",
                    isActive
                      ? "text-primary bg-primary/8"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-sidebar-foreground/50"
                    )}
                  />
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.span
                        key={`label-${item.path}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              );

              if (!expanded) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return link;
            })}
          </nav>

          {/* Bottom: system status + collapse */}
          <div className="border-t border-sidebar-border p-2 space-y-1 overflow-hidden">
            {/* System status row */}
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="status"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center gap-2 px-2.5 py-1.5"
                >
                  <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400 flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground">System Operational</span>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Collapse button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-2 rounded-md px-2.5 py-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors text-sm"
              aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {expanded ? (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-xs">Collapse</span>
                </>
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </motion.aside>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <header className="h-14 flex-shrink-0 border-b border-border/50 bg-background/70 backdrop-blur-sm flex items-center justify-between px-6 z-10">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {currentPage?.label ?? "Dashboard"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Conductor · Production Orchestration Console
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ModeToggle />
              <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">C</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto relative">
            {/* Subtle grid background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="relative z-10 p-6 h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
