"use client";
import * as React from "react";
import { Input as AntInput } from "antd";
import { cn } from "@/lib/utils";

const AntTextArea = AntInput.TextArea;

export const Input = React.forwardRef<
  React.ComponentRef<typeof AntInput>,
  React.ComponentProps<typeof AntInput>
>(({ className, ...props }, ref) => (
  <AntInput ref={ref} className={cn(className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  React.ComponentRef<typeof AntTextArea>,
  React.ComponentProps<typeof AntTextArea>
>(({ className, ...props }, ref) => (
  <AntTextArea ref={ref} className={cn(className)} {...props} />
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
