"use client";
import * as Popover from "@radix-ui/react-popover";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption<T extends string> {
  value: T;
  label: string;
  swatch?: string;
}

interface FilterPopoverProps<T extends string> {
  trigger: React.ReactNode;
  title: string;
  options: readonly FilterOption<T>[];
  selected: ReadonlySet<T>;
  onChange: (next: Set<T>) => void;
  emptyLabel?: string;
  align?: "start" | "center" | "end";
}

export function FilterPopover<T extends string>({
  trigger,
  title,
  options,
  selected,
  onChange,
  emptyLabel = "Aucune option",
  align = "start",
}: FilterPopoverProps<T>) {
  const toggle = (v: T) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(next);
  };
  const clear = () => onChange(new Set());

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align={align}
          sideOffset={6}
          className="z-40 w-[240px] overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <header className="flex items-center justify-between border-b border-[hsl(var(--line))] px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
              {title}
            </span>
            {selected.size > 0 && (
              <button
                onClick={clear}
                className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-medium text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-sunken)/0.6)] hover:text-ink"
              >
                <X className="h-3 w-3" />
                Effacer
              </button>
            )}
          </header>
          {options.length === 0 ? (
            <div className="px-3 py-4 text-center text-[12px] text-[hsl(var(--ink-3))]">
              {emptyLabel}
            </div>
          ) : (
            <ul className="max-h-[280px] overflow-y-auto py-1">
              {options.map((opt) => {
                const isOn = selected.has(opt.value);
                return (
                  <li key={opt.value}>
                    <button
                      onClick={() => toggle(opt.value)}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12.5px] hover:bg-[hsl(var(--bg-sunken)/0.6)]"
                    >
                      <span
                        className={cn(
                          "grid h-4 w-4 place-items-center rounded border transition-colors",
                          isOn
                            ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white"
                            : "border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))]",
                        )}
                      >
                        {isOn && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      {opt.swatch && (
                        <span
                          className="h-2.5 w-2.5 rounded-[3px]"
                          style={{ background: opt.swatch }}
                        />
                      )}
                      <span className="flex-1 truncate">{opt.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
