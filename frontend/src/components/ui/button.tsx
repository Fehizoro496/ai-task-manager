"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-tight transition-all disabled:opacity-50 disabled:pointer-events-none select-none [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[hsl(var(--ink))] text-white shadow-[var(--shadow-2)] hover:bg-[hsl(var(--ink)/0.92)] active:translate-y-px",
        brand:
          "bg-[hsl(var(--brand))] text-white shadow-[var(--shadow-brand)] hover:bg-[hsl(var(--brand-ink))] active:translate-y-px",
        outline:
          "bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--line-strong))] text-ink shadow-[var(--shadow-1)] hover:bg-[hsl(var(--bg-muted))]",
        ghost:
          "text-ink hover:bg-[hsl(var(--bg-muted))]",
        soft:
          "bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))] hover:bg-[hsl(var(--brand-tint))]",
        sage:
          "bg-[hsl(var(--accent-sage))] text-white hover:bg-[hsl(var(--accent-sage)/0.9)] shadow-[var(--shadow-1)]",
        link: "text-[hsl(var(--brand-ink))] underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-2.5 rounded-[var(--radius-xs)] text-xs",
        sm: "h-8 px-3 rounded-[var(--radius-sm)]",
        md: "h-10 px-4 rounded-[var(--radius-md)]",
        lg: "h-11 px-5 rounded-[var(--radius-md)] text-[15px]",
        xl: "h-12 px-6 rounded-[var(--radius-md)] text-base",
        icon: "h-9 w-9 rounded-[var(--radius-sm)]",
        "icon-sm": "h-7 w-7 rounded-[var(--radius-xs)]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
