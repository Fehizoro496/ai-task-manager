import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))]",
        "px-3 text-sm text-ink placeholder:text-[hsl(var(--ink-4))]",
        "transition-shadow focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.4)] focus:border-[hsl(var(--brand)/0.6)]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[120px] w-full rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))]",
      "px-3 py-2.5 text-sm text-ink placeholder:text-[hsl(var(--ink-4))]",
      "transition-shadow focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.4)] focus:border-[hsl(var(--brand)/0.6)]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-[12px] font-semibold tracking-tight text-[hsl(var(--ink-2))]">
          {label}
        </span>
      )}
      {children}
      {hint && (
        <span className="text-[11px] text-[hsl(var(--ink-3))]">{hint}</span>
      )}
    </label>
  );
}
