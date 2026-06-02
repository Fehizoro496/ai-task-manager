"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { User } from "@/services";
import { cn } from "@/lib/utils";

type ComboUser = Pick<User, "id" | "name" | "email"> & {
  avatar_url?: string | null;
};

interface UserComboboxProps {
  users: ComboUser[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
}

export function UserCombobox({
  users,
  value,
  onChange,
  placeholder = "Rechercher un utilisateur…",
  emptyLabel = "Aucun utilisateur disponible",
  disabled,
}: UserComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => users.find((u) => u.id === value) ?? null,
    [users, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, query]);

  // Click outside → fermer
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  const clear = () => {
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const u = filtered[highlight];
      if (u) pick(u.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] pl-2.5 pr-2 transition-colors",
          open
            ? "border-[hsl(var(--brand)/0.6)] ring-2 ring-[hsl(var(--brand)/0.3)]"
            : "hover:border-[hsl(var(--ink-4))]",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        {selected && !open ? (
          <>
            <Avatar id={selected.id} name={selected.name} size="xs" />
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-[13px] font-medium">
                {selected.name}
              </span>
            </button>
            <button
              type="button"
              onClick={clear}
              className="grid h-6 w-6 place-items-center rounded text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink"
              aria-label="Effacer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <Search className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ink-3))]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-w-0 flex-1 bg-transparent text-[13px] placeholder:text-[hsl(var(--ink-4))] focus:outline-none"
              autoComplete="off"
            />
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-[hsl(var(--ink-3))] transition-transform",
                open && "rotate-180",
              )}
            />
          </>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-[280px] overflow-y-auto rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-2)]">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12.5px] text-[hsl(var(--ink-3))]">
              {emptyLabel}
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((u, i) => {
                const isSelected = u.id === value;
                const isHighlighted = i === highlight;
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(u.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-2.5 py-2 text-left",
                        isHighlighted && "bg-[hsl(var(--bg-sunken)/0.7)]",
                      )}
                    >
                      <Avatar id={u.id} name={u.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium tracking-tight">
                          {u.name}
                        </div>
                        <div className="truncate text-[11.5px] text-[hsl(var(--ink-3))]">
                          {u.email}
                        </div>
                      </div>
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
        </div>
      )}
    </div>
  );
}
