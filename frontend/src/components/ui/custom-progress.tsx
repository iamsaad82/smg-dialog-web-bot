import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

/**
 * Eine einfache Progress-Komponente ohne externe Abhängigkeiten
 */
export function CustomProgress({ value = 0, className, ...props }: ProgressProps) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)} {...props}>
      <div 
        className="h-full w-full flex-1 bg-primary transition-all" 
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
} 