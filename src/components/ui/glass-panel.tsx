import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
  glowColor?: "cyan" | "violet" | "success" | "warning" | "error"
}

const glowColorMap = {
  cyan:    "shadow-[0_0_0_1px_hsl(189_85%_52%_/_0.3),_0_0_20px_hsl(189_85%_52%_/_0.08)]",
  violet:  "shadow-[0_0_0_1px_hsl(258_90%_65%_/_0.3),_0_0_20px_hsl(258_90%_65%_/_0.08)]",
  success: "shadow-[0_0_0_1px_hsl(160_84%_39%_/_0.3),_0_0_20px_hsl(160_84%_39%_/_0.08)]",
  warning: "shadow-[0_0_0_1px_hsl(38_92%_50%_/_0.3),_0_0_20px_hsl(38_92%_50%_/_0.08)]",
  error:   "shadow-[0_0_0_1px_hsl(0_84%_60%_/_0.3),_0_0_20px_hsl(0_84%_60%_/_0.08)]",
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, glow = false, glowColor = "cyan", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-card/80 backdrop-blur-sm",
        glow && glowColorMap[glowColor],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
GlassPanel.displayName = "GlassPanel"

export { GlassPanel }
