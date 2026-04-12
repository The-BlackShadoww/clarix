import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-[#e9eaef] bg-white px-4 py-2 text-[15px] text-[#1c1c1e] transition-colors duration-200 outline-none placeholder:text-[#a5a8b5] focus-visible:border-[#5b76fe] focus-visible:ring-3 focus-visible:ring-[#5b76fe]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#f5f6f8] disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#1c1c1e]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
