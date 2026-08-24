import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * shadcn's Textarea at this site's field scale. `field-sizing-content` is
 * deliberately dropped: it overrides the `rows` prop, and the quote form sizes
 * its box explicitly so the field reads as "we expect a paragraph".
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-32 w-full resize-y rounded-[var(--radius-sm)] border border-input bg-background px-[15px] py-3 font-[inherit] text-[15px] leading-[1.55] transition-[color,border-color,box-shadow] outline-none",
        "placeholder:text-[var(--text-faint)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
