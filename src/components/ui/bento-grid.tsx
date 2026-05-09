import * as React from "react"
import { cn } from "@/lib/utils"

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ cols = 4, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid gap-4 auto-rows-auto",
        cols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
BentoGrid.displayName = "BentoGrid"

interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2
}

const colSpanMap = {
  1: "",
  2: "col-span-1 md:col-span-2",
  3: "col-span-1 md:col-span-2 lg:col-span-3",
  4: "col-span-1 md:col-span-2 lg:col-span-4",
}

const rowSpanMap = {
  1: "",
  2: "row-span-2",
}

const BentoItem = React.forwardRef<HTMLDivElement, BentoItemProps>(
  ({ colSpan = 1, rowSpan = 1, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        colSpanMap[colSpan],
        rowSpanMap[rowSpan],
        className
      )}
      {...props}
    />
  )
)
BentoItem.displayName = "BentoItem"

export { BentoGrid, BentoItem }
