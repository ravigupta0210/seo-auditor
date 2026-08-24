import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * shadcn's Input, re-scaled to this site's field metrics.
 *
 * Colours come from the `@theme inline` mapping in globals.css (`border-input`
 * → `--border-strong`, `bg-background` → `--bg`); only the sizing is changed,
 * because shadcn ships a 36px/14px control and every hand-written field on this
 * site is 44px/15px. Mixing the two scales in one form is what looks broken.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[var(--radius-sm)] border border-input bg-background px-[15px] py-0 font-[inherit] text-[15px] transition-[color,border-color,box-shadow] outline-none",
        "selection:bg-primary selection:text-primary-foreground",
        "placeholder:text-[var(--text-faint)]",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
        className
      )}
      {...props}
    />
  )
}

export { Input }
