import * as React from "react"
import { cn } from "@/lib/utils"

export type StatusType =
  | "active"
  | "inactive"
  | "running"
  | "success"
  | "warning"
  | "error"
  | "draft"
  | "archived"
  | "idle"
  | "ready"
  | "deployed"
  | "pending"
  | "building"
  | "failed"
  | "online"
  | "offline"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType
  showDot?: boolean
  size?: "sm" | "md"
}

const statusConfig: Record<StatusType, { label: string; dotClass: string; textClass: string; bgClass: string }> = {
  active:   { label: "Active",    dotClass: "bg-emerald-400", textClass: "text-emerald-400", bgClass: "bg-emerald-400/10 border-emerald-400/20" },
  online:   { label: "Online",   dotClass: "bg-emerald-400 animate-pulse", textClass: "text-emerald-400", bgClass: "bg-emerald-400/10 border-emerald-400/20" },
  success:  { label: "Success",  dotClass: "bg-emerald-400", textClass: "text-emerald-400", bgClass: "bg-emerald-400/10 border-emerald-400/20" },
  deployed: { label: "Deployed", dotClass: "bg-emerald-400", textClass: "text-emerald-400", bgClass: "bg-emerald-400/10 border-emerald-400/20" },
  ready:    { label: "Ready",    dotClass: "bg-sky-400",    textClass: "text-sky-400",    bgClass: "bg-sky-400/10 border-sky-400/20" },
  running:  { label: "Running",  dotClass: "bg-sky-400 animate-pulse", textClass: "text-sky-400", bgClass: "bg-sky-400/10 border-sky-400/20" },
  building: { label: "Building", dotClass: "bg-sky-400 animate-pulse", textClass: "text-sky-400", bgClass: "bg-sky-400/10 border-sky-400/20" },
  pending:  { label: "Pending",  dotClass: "bg-amber-400 animate-pulse", textClass: "text-amber-400", bgClass: "bg-amber-400/10 border-amber-400/20" },
  warning:  { label: "Warning",  dotClass: "bg-amber-400", textClass: "text-amber-400", bgClass: "bg-amber-400/10 border-amber-400/20" },
  draft:    { label: "Draft",    dotClass: "bg-amber-400", textClass: "text-amber-400", bgClass: "bg-amber-400/10 border-amber-400/20" },
  error:    { label: "Error",    dotClass: "bg-red-400",   textClass: "text-red-400",   bgClass: "bg-red-400/10 border-red-400/20" },
  failed:   { label: "Failed",   dotClass: "bg-red-400",   textClass: "text-red-400",   bgClass: "bg-red-400/10 border-red-400/20" },
  inactive: { label: "Inactive", dotClass: "bg-slate-500", textClass: "text-slate-400", bgClass: "bg-slate-500/10 border-slate-500/20" },
  idle:     { label: "Idle",     dotClass: "bg-slate-500", textClass: "text-slate-400", bgClass: "bg-slate-500/10 border-slate-500/20" },
  archived: { label: "Archived", dotClass: "bg-slate-500", textClass: "text-slate-400", bgClass: "bg-slate-500/10 border-slate-500/20" },
  offline:  { label: "Offline",  dotClass: "bg-slate-500", textClass: "text-slate-400", bgClass: "bg-slate-500/10 border-slate-500/20" },
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showDot = true, size = "md", className, children, ...props }, ref) => {
    const cfg = statusConfig[status] ?? statusConfig.idle
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 font-medium",
          size === "sm" ? "py-0.5 text-[10px]" : "py-1 text-xs",
          cfg.bgClass,
          cfg.textClass,
          className
        )}
        {...props}
      >
        {showDot && (
          <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", cfg.dotClass)} />
        )}
        {children ?? cfg.label}
      </span>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge }
