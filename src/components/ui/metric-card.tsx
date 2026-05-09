import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlassPanel } from "./glass-panel"

type MetricVariant = "default" | "cyan" | "violet" | "success" | "warning" | "error"

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: { value: number; label?: string }
  variant?: MetricVariant
  loading?: boolean
}

const variantIconBg: Record<MetricVariant, string> = {
  default: "bg-primary/10 text-primary",
  cyan:    "bg-sky-400/10 text-sky-400",
  violet:  "bg-violet-400/10 text-violet-400",
  success: "bg-emerald-400/10 text-emerald-400",
  warning: "bg-amber-400/10 text-amber-400",
  error:   "bg-red-400/10 text-red-400",
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ label, value, icon: Icon, description, trend, variant = "default", loading, className, ...props }, ref) => (
    <GlassPanel
      ref={ref}
      className={cn(
        "p-4 flex items-start gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80",
        className
      )}
      {...props}
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0", variantIconBg[variant])}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {loading ? (
          <div className="mt-1 h-6 w-16 rounded bg-muted animate-pulse" />
        ) : (
          <p className="mt-0.5 text-xl font-semibold text-foreground tabular-nums">{value}</p>
        )}
        {description && (
          <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{description}</p>
        )}
        {trend !== undefined && !loading && (
          <p className={cn(
            "mt-0.5 text-[11px] font-medium",
            trend.value >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%{trend.label ? ` ${trend.label}` : ""}
          </p>
        )}
      </div>
    </GlassPanel>
  )
)
MetricCard.displayName = "MetricCard"

export { MetricCard }
