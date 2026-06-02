"use client";
import * as RSelect from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
  swatch?: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Largeur du dropdown : par défaut suit le trigger via CSS var Radix. */
  contentClassName?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  disabled,
  className,
  contentClassName,
}: SelectProps) {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <RSelect.Root value={value} onValueChange={onChange} disabled={disabled}>
      <RSelect.Trigger
        className={cn(
          "group inline-flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-3 text-[13px] text-ink transition-colors",
          "hover:border-[hsl(var(--ink-4))]",
          "focus:outline-none focus-visible:border-[hsl(var(--brand)/0.6)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.3)]",
          "data-[state=open]:border-[hsl(var(--brand)/0.6)] data-[state=open]:ring-2 data-[state=open]:ring-[hsl(var(--brand)/0.3)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-left">
          {selected?.swatch && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: selected.swatch }}
            />
          )}
          {selected ? (
            <RSelect.Value>{selected.label}</RSelect.Value>
          ) : (
            <span className="text-[hsl(var(--ink-4))]">{placeholder}</span>
          )}
        </span>
        <RSelect.Icon asChild>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ink-3))] transition-transform group-data-[state=open]:rotate-180" />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-50 max-h-[320px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1",
            contentClassName,
          )}
        >
          <RSelect.ScrollUpButton className="flex h-6 items-center justify-center bg-[hsl(var(--bg-elevated))] text-[hsl(var(--ink-3))]">
            <ChevronUp className="h-3 w-3" />
          </RSelect.ScrollUpButton>
          <RSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RSelect.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  "relative flex cursor-pointer select-none items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 pr-8 text-[13px] outline-none",
                  "data-[highlighted]:bg-[hsl(var(--bg-sunken)/0.7)]",
                  "data-[state=checked]:bg-[hsl(var(--brand-soft))] data-[state=checked]:text-[hsl(var(--brand-ink))]",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                )}
              >
                {opt.swatch && (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                    style={{ background: opt.swatch }}
                  />
                )}
                <RSelect.ItemText asChild>
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                </RSelect.ItemText>
                {opt.hint && (
                  <span className="text-[10.5px] text-[hsl(var(--ink-4))]">
                    {opt.hint}
                  </span>
                )}
                <RSelect.ItemIndicator className="absolute right-2.5 inline-flex items-center">
                  <Check
                    className="h-3.5 w-3.5 text-[hsl(var(--brand-ink))]"
                    strokeWidth={3}
                  />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
          <RSelect.ScrollDownButton className="flex h-6 items-center justify-center bg-[hsl(var(--bg-elevated))] text-[hsl(var(--ink-3))]">
            <ChevronDown className="h-3 w-3" />
          </RSelect.ScrollDownButton>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
