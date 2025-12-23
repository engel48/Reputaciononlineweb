import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Nuevo branding cyan
        default: "bg-[#00E5FF] text-[#0B1120] hover:bg-[#00B8D4] shadow-[0_4px_20px_rgba(0,229,255,0.15)] hover:shadow-[0_6px_25px_rgba(0,229,255,0.25)] hover:-translate-y-0.5",
        // Navy oscuro
        navy: "bg-[#0B1120] text-white hover:bg-[#1A202C]",
        destructive:
          "bg-error text-white hover:bg-error/90",
        outline:
          "border-2 border-[#00E5FF] bg-transparent text-[#00E5FF] hover:bg-[#00E5FF]/10",
        secondary:
          "bg-[#1A202C] text-white hover:bg-[#2D3748]",
        ghost: "hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]",
        link: "text-[#00E5FF] underline-offset-4 hover:underline",
        // Legacy - mantener compatibilidad
        blueHref: "bg-[#00E5FF] text-[#0B1120] hover:bg-[#00B8D4]",
        // Success variant
        success: "bg-success text-white hover:bg-success/90",
        // Warning variant
        warning: "bg-warning text-white hover:bg-warning/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
