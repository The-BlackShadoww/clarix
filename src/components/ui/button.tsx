import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#5b76fe] text-white hover:bg-[#4a65ed] active:bg-[#2a41b6] shadow-sm",
        outline:
          "border-[#c7cad5] bg-transparent text-[#1c1c1e] hover:bg-[#f5f6f8] active:bg-[#e0e2e8]",
        secondary:
          "bg-[#f5f6f8] text-[#1c1c1e] hover:bg-[#e0e2e8] active:bg-[#c7cad5]",
        ghost: "hover:bg-[#f5f6f8] text-[#1c1c1e] active:bg-[#e0e2e8]",
        destructive:
          "bg-[#fbd4d4] text-[#e53e3e] hover:bg-[#ffc6c6] active:bg-[#e3c5c5] focus-visible:border-[#e53e3e]/40 focus-visible:ring-[#e53e3e]/20",
        link: "text-[#5b76fe] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 py-[7px] text-[14px] tracking-[0.175px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-7 gap-1 rounded-md px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-md px-2.5 text-[13px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-4 py-2 text-[15px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-9",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
