"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
  swatch?: string;
  disabled?: boolean;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly ComboboxOption[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * Select avec saisie : le trigger est lui-même le champ de recherche, la liste
 * s'ouvre en popover. La saisie ne sert qu'à filtrer, pas à créer une valeur.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  emptyLabel = "Aucun résultat",
  disabled,
  className,
  contentClassName,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // La saisie ne survit pas à la fermeture : on réaffiche la valeur choisie.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  // Garde l'option survolée au clavier dans la zone visible.
  useEffect(() => {
    listRef.current?.children[highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const pick = (opt: ComboboxOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) pick(opt);
    } else if (e.key === "Escape") {
      // Le focus reste dans le champ : Radix ne voit pas cette touche.
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div
          ref={anchorRef}
          onClick={() => {
            if (!disabled) {
              setOpen(true);
              inputRef.current?.focus();
            }
          }}
          className={cn(
            "group inline-flex h-10 w-full cursor-text items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-3 text-[13px] text-ink transition-colors",
            open
              ? "border-[hsl(var(--brand)/0.6)] ring-2 ring-[hsl(var(--brand)/0.3)]"
              : "hover:border-[hsl(var(--ink-4))]",
            disabled && "pointer-events-none opacity-60",
            className,
          )}
        >
          {selected?.swatch && !open && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: selected.swatch }}
            />
          )}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls="combobox-list"
            value={open ? query : (selected?.label ?? "")}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder={open ? (selected?.label ?? placeholder) : placeholder}
            disabled={disabled}
            autoComplete="off"
            className="min-w-0 flex-1 truncate bg-transparent text-[length:inherit] placeholder:text-[hsl(var(--ink-4))] focus:outline-none"
          />
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-[hsl(var(--ink-3))] transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          id="combobox-list"
          align="start"
          sideOffset={4}
          // Le focus doit rester dans le champ de saisie du trigger.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // Un clic sur le champ lui-même ne doit pas refermer la liste.
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node))
              e.preventDefault();
          }}
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] min-w-[180px] overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1",
            contentClassName,
          )}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-5 text-center text-[12.5px] text-[hsl(var(--ink-3))]">
              {emptyLabel}
            </div>
          ) : (
            <ul ref={listRef} className="max-h-[280px] overflow-y-auto p-1">
              {filtered.map((opt, i) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      disabled={opt.disabled}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(opt)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-[13px] disabled:pointer-events-none disabled:opacity-50",
                        i === highlight && "bg-[hsl(var(--bg-sunken)/0.7)]",
                        isSelected &&
                          "bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]",
                      )}
                    >
                      {opt.swatch && (
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                          style={{ background: opt.swatch }}
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {opt.label}
                      </span>
                      {opt.hint && (
                        <span className="shrink-0 text-[10.5px] text-[hsl(var(--ink-4))]">
                          {opt.hint}
                        </span>
                      )}
                      {isSelected && (
                        <Check
                          className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--brand-ink))]"
                          strokeWidth={3}
                        />
                      )}
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
