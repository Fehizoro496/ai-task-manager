"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal } from "lucide-react";
import { calendarEvents } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const MONTH = "Mai 2024";
const DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

// Days of May 2024: starts on Wednesday (offset 2), 31 days
const FIRST_OFFSET = 2;
const DAYS_IN_MONTH = 31;
const PREV_OVERFLOW = [29, 30]; // Apr 29-30 to fill before May 1
// We have 5 weeks * 7 = 35 cells; 2 + 31 = 33, so 2 trailing days from June

const COLOR_BG: Record<string, string> = {
  brand: "bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))] border-[hsl(var(--brand)/0.25)]",
  apricot: "bg-[hsl(23_92%_94%)] text-[hsl(22_78%_42%)] border-[hsl(var(--accent-apricot)/0.3)]",
  sage: "bg-[hsl(152_50%_94%)] text-[hsl(var(--accent-sage))] border-[hsl(var(--accent-sage)/0.3)]",
  rose: "bg-[hsl(348_78%_96%)] text-[hsl(var(--accent-rose))] border-[hsl(var(--accent-rose)/0.3)]",
  teal: "bg-[hsl(184_64%_94%)] text-[hsl(var(--accent-teal))] border-[hsl(var(--accent-teal)/0.3)]",
};

function isoFor(day: number) {
  return `2024-05-${String(day).padStart(2, "0")}`;
}

export function MonthView() {
  const [selected, setSelected] = useState(15);

  const cells: { d: number; out?: boolean; month?: "prev" | "next" }[] = [];
  PREV_OVERFLOW.forEach((d) => cells.push({ d, out: true, month: "prev" }));
  for (let i = 1; i <= DAYS_IN_MONTH; i++) cells.push({ d: i });
  for (let i = 1; cells.length < 35; i++) cells.push({ d: i, out: true, month: "next" });

  const selectedEvents = calendarEvents.filter((e) => e.date === isoFor(selected));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      {/* Month grid */}
      <section className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
        <header className="flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--line))]">
          <h2 className="font-display text-[18px] font-semibold tracking-tight">
            {MONTH}
          </h2>
          <div className="flex items-center gap-1.5">
            <button className="grid h-8 w-8 place-items-center rounded-[8px] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-muted))]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="h-8 rounded-[8px] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-3 text-[12.5px] font-medium hover:bg-[hsl(var(--bg-muted))]">
              Aujourd&apos;hui
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-[8px] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-muted))]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-7 border-b border-[hsl(var(--line))] text-center">
          {DAYS.map((d) => (
            <div
              key={d}
              className="py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--ink-3))]"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const iso = isoFor(cell.d);
            const events = !cell.out
              ? calendarEvents.filter((e) => e.date === iso)
              : [];
            const isSelected = !cell.out && cell.d === selected;
            return (
              <button
                key={i}
                onClick={() => !cell.out && setSelected(cell.d)}
                className={cn(
                  "relative h-[88px] border-b border-r border-[hsl(var(--line))] p-2 text-left transition-colors",
                  i % 7 === 6 && "border-r-0",
                  i >= 28 && "border-b-0",
                  cell.out ? "bg-[hsl(var(--bg-sunken)/0.3)] text-[hsl(var(--ink-4))]" : "hover:bg-[hsl(var(--bg-sunken)/0.5)]",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full text-[12.5px] font-semibold tabular",
                    isSelected
                      ? "bg-[hsl(var(--brand))] text-white shadow-[var(--shadow-brand)]"
                      : cell.out
                        ? "text-[hsl(var(--ink-4))]"
                        : "text-ink",
                  )}
                >
                  {cell.d}
                </span>
                <div className="mt-1 flex flex-col gap-0.5">
                  {events.slice(0, 2).map((e) => (
                    <span
                      key={e.id}
                      className={cn(
                        "inline-flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10.5px] font-medium border",
                        COLOR_BG[e.color],
                      )}
                    >
                      <span className="font-mono text-[9.5px]">{e.start}</span>
                      <span className="truncate">{e.title}</span>
                    </span>
                  ))}
                  {events.length > 2 && (
                    <span className="text-[10px] text-[hsl(var(--ink-3))]">
                      +{events.length - 2} de plus
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Day agenda */}
      <aside className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
        <header className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[hsl(var(--line))]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--brand-ink))]">
              Mercredi
            </div>
            <div className="font-display text-[20px] font-semibold tracking-tight">
              {selected} mai
            </div>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-[8px] bg-[hsl(var(--brand))] text-white shadow-[var(--shadow-brand)]">
            <Plus className="h-4 w-4" />
          </button>
        </header>

        <ul className="space-y-3 p-4">
          {selectedEvents.length === 0 ? (
            <li className="rounded-[var(--radius-sm)] border border-dashed border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-sunken)/0.4)] p-4 text-center text-[12.5px] text-[hsl(var(--ink-3))]">
              Aucun événement planifié.
            </li>
          ) : (
            selectedEvents.map((e) => (
              <li
                key={e.id}
                className={cn(
                  "relative overflow-hidden rounded-[var(--radius-md)] border bg-[hsl(var(--bg-elevated))] p-3 shadow-[var(--shadow-1)]",
                  COLOR_BG[e.color],
                )}
              >
                <span className="absolute inset-y-0 left-0 w-1 bg-current" />
                <div className="flex items-start justify-between pl-2">
                  <div className="min-w-0">
                    {e.taskCode && (
                      <div className="font-mono text-[10.5px] font-semibold tracking-wider opacity-80">
                        {e.taskCode}
                      </div>
                    )}
                    <div className="mt-0.5 text-[13.5px] font-semibold tracking-tight text-ink">
                      {e.title}
                    </div>
                    <div className="mt-1 font-mono text-[11.5px] text-[hsl(var(--ink-2))]">
                      {e.start} – {e.end}
                    </div>
                  </div>
                  <button className="grid h-7 w-7 place-items-center rounded text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))]">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </aside>
    </div>
  );
}
