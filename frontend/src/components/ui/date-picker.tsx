"use client";
import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  /** Date sélectionnée en ISO 8601 (ou null). */
  value: string | null;
  /** Appelé avec une ISO (ou null pour effacer). */
  onChange: (iso: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Style appliqué au trigger (ex. couleur rouge pour overdue). */
  className?: string;
  /** Quand fourni, affiché à droite (ex. <Badge tone="rose">en retard</Badge>). */
  trailing?: React.ReactNode;
}

// Convertit une date locale en ISO « minuit UTC » du même jour calendaire.
// Permet ensuite de récupérer la portion YYYY-MM-DD sans dérive timezone.
const isoFromDate = (d: Date) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();

// Reconstruit une Date locale (pour l'affichage / comparaisons) à partir
// d'un ISO stocké à minuit UTC : on lit la portion calendaire en UTC.
const localFromIso = (iso: string): Date => {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Choisir une date",
  disabled,
  className,
  trailing,
}: DatePickerProps) {
  const selected = value ? localFromIso(value) : null;
  const [viewMonth, setViewMonth] = useState<Date>(
    selected ?? new Date(),
  );
  const [open, setOpen] = useState(false);

  // Quand on rouvre, recentre le mois sur la valeur courante.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setViewMonth(selected ?? new Date());
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { locale: fr });
    const end = endOfWeek(endOfMonth(viewMonth), { locale: fr });
    const out: Date[] = [];
    for (let d = start; d <= end; d = new Date(d.getTime() + 86_400_000)) {
      out.push(d);
    }
    return out;
  }, [viewMonth]);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { locale: fr });
    return Array.from({ length: 7 }, (_, i) =>
      format(new Date(start.getTime() + i * 86_400_000), "EEEEEE", { locale: fr }),
    );
  }, []);

  const triggerLabel = selected
    ? format(selected, "d MMM yyyy", { locale: fr })
    : placeholder;

  return (
    <div className="inline-flex items-center gap-2">
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "group inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border bg-[hsl(var(--bg-elevated))] px-2.5 text-[12.5px] font-medium text-ink transition-colors",
              "border-[hsl(var(--line-strong))] hover:border-[hsl(var(--ink-4))]",
              "focus:outline-none focus-visible:border-[hsl(var(--brand)/0.6)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.3)]",
              "data-[state=open]:border-[hsl(var(--brand)/0.6)] data-[state=open]:ring-2 data-[state=open]:ring-[hsl(var(--brand)/0.3)]",
              "disabled:cursor-not-allowed disabled:opacity-60",
              !selected && "text-[hsl(var(--ink-4))]",
              className,
            )}
          >
            <CalIcon className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ink-3))]" />
            <span className="min-w-0 truncate">{triggerLabel}</span>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            sideOffset={6}
            align="start"
            className={cn(
              "z-50 w-[280px] rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-3 shadow-[var(--shadow-3)] outline-none",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            )}
          >
            <header className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                aria-label="Mois précédent"
                className="grid h-7 w-7 place-items-center rounded-[6px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-sunken)/0.7)] hover:text-ink"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div className="font-display text-[13px] font-semibold capitalize tracking-tight">
                {format(viewMonth, "LLLL yyyy", { locale: fr })}
              </div>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                aria-label="Mois suivant"
                className="grid h-7 w-7 place-items-center rounded-[6px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-sunken)/0.7)] hover:text-ink"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="mb-1 grid grid-cols-7 gap-0.5 text-center font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink-4))]">
              {weekdayLabels.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {days.map((d) => {
                const inMonth = isSameMonth(d, viewMonth);
                const isSelected = selected ? isSameDay(d, selected) : false;
                const isToday = isSameDay(d, new Date());
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => {
                      onChange(isoFromDate(d));
                      setOpen(false);
                    }}
                    className={cn(
                      "relative grid h-8 place-items-center rounded-[6px] text-[12.5px] tabular-nums transition-colors",
                      "hover:bg-[hsl(var(--bg-sunken)/0.8)]",
                      !inMonth && "text-[hsl(var(--ink-4)/0.55)]",
                      inMonth && !isSelected && "text-[hsl(var(--ink-2))]",
                      isSelected &&
                        "bg-[hsl(var(--brand))] font-semibold text-white hover:bg-[hsl(var(--brand-ink))]",
                      isToday && !isSelected && "ring-1 ring-[hsl(var(--brand)/0.4)]",
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <footer className="mt-2 flex items-center justify-between gap-2 border-t border-[hsl(var(--line))] pt-2 text-[11.5px]">
              <button
                type="button"
                onClick={() => {
                  onChange(isoFromDate(new Date()));
                  setOpen(false);
                }}
                className="rounded-[5px] px-2 py-1 font-medium text-[hsl(var(--brand-ink))] hover:bg-[hsl(var(--brand-soft))]"
              >
                Aujourd&apos;hui
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="rounded-[5px] px-2 py-1 font-medium text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-sunken)/0.7)] hover:text-ink"
                >
                  Effacer
                </button>
              )}
            </footer>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {trailing}
    </div>
  );
}
