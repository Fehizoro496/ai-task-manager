"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarRange,
  CalendarCheck,
  Hourglass,
  ArrowRight,
} from "lucide-react";
import { PriorityPill, StatusPill } from "@/components/ui/pill";
import { calendarApi, routerService } from "@/services";
import type { CalendarEvent } from "@/services";
import { normalizeApiPriority, normalizeApiStatus } from "@/lib/mappers";
import { cn } from "@/lib/utils";

const DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTH_LABEL = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const WEEKDAY_LABEL = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
];

function isoFor(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function startOfMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  return (first.getDay() + 6) % 7;
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function isWeekend(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
}

export function MonthView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const todayIso = isoFor(now.getFullYear(), now.getMonth(), now.getDate());
  const [selected, setSelected] = useState<string>(todayIso);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fromDate = new Date(year, month, 1);
    fromDate.setDate(fromDate.getDate() - 7);
    const toDate = new Date(year, month + 1, 0);
    toDate.setDate(toDate.getDate() + 7);
    const from = fromDate.toISOString().slice(0, 10);
    const to = toDate.toISOString().slice(0, 10);

    setLoading(true);
    calendarApi
      .listEvents(from, to)
      .then((res) => setEvents(res.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      if (!ev.date) continue;
      if (!map.has(ev.date)) map.set(ev.date, []);
      map.get(ev.date)!.push(ev);
    }
    return map;
  }, [events]);

  const stats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    const monthEvents = events.filter((e) => e.date?.startsWith(monthPrefix));
    const todayEvents = eventsByDate.get(todayIso) ?? [];
    const upcoming = [...events]
      .filter((e) => e.date && e.date >= todayIso)
      .sort((a, b) => (a.date! < b.date! ? -1 : 1));
    const next = upcoming[0] ?? null;
    return { monthCount: monthEvents.length, todayCount: todayEvents.length, next };
  }, [events, eventsByDate, year, month, todayIso]);

  // Cells dynamiques : 5 ou 6 rangées selon le besoin
  const { cells, rowCount } = useMemo(() => {
    const offset = startOfMonth(year, month);
    const total = daysInMonth(year, month);
    const rows = Math.ceil((offset + total) / 7);
    const cellsCount = rows * 7;
    const result: { iso: string; day: number; out: boolean }[] = [];
    if (offset > 0) {
      const prevTotal = daysInMonth(year, month - 1);
      for (let i = offset; i > 0; i--) {
        const d = prevTotal - i + 1;
        result.push({ iso: isoFor(year, month - 1, d), day: d, out: true });
      }
    }
    for (let i = 1; i <= total; i++) {
      result.push({ iso: isoFor(year, month, i), day: i, out: false });
    }
    while (result.length < cellsCount) {
      const d = result.length - (offset + total) + 1;
      result.push({ iso: isoFor(year, month + 1, d), day: d, out: true });
    }
    return { cells: result.slice(0, cellsCount), rowCount: rows };
  }, [year, month]);

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelected(isoFor(d.getFullYear(), d.getMonth(), d.getDate()));
  };

  const selectedDate = new Date(selected + "T00:00:00");
  const selectedEvents = eventsByDate.get(selected) ?? [];
  const dayInMonth =
    selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

  const nextRelative = useMemo(() => {
    if (!stats.next?.date) return null;
    const a = new Date(todayIso + "T00:00:00");
    const b = new Date(stats.next.date + "T00:00:00");
    const days = Math.round((b.getTime() - a.getTime()) / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Demain";
    return `Dans ${days} j`;
  }, [stats.next, todayIso]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Mini-stats strip — compact */}
      <section className="grid shrink-0 gap-3 sm:grid-cols-3">
        <MiniStat
          Icon={CalendarRange}
          label="Ce mois"
          value={stats.monthCount}
          hint={`${MONTH_LABEL[month]} ${year}`}
          tone="brand"
        />
        <MiniStat
          Icon={CalendarCheck}
          label="Aujourd'hui"
          value={stats.todayCount}
          hint={stats.todayCount === 0 ? "aucune échéance" : "à surveiller"}
          tone="apricot"
        />
        <MiniStat
          Icon={Hourglass}
          label="Prochaine échéance"
          value={nextRelative ?? "—"}
          hint={
            stats.next?.title
              ? `${stats.next.identifier ?? ""} ${stats.next.title}`.trim()
              : "rien à venir"
          }
          tone="sage"
          isText
          onClick={
            stats.next?.taskId
              ? () => routerService.toTask(stats.next!.taskId)
              : undefined
          }
        />
      </section>

      {/* Grille + panneau jour — flex-1 pour remplir le viewport */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <header className="flex shrink-0 items-center justify-between border-b border-[hsl(var(--line))] px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-[17px] font-semibold tracking-tight">
                {MONTH_LABEL[month]}{" "}
                <span className="font-mono text-[13px] font-medium text-[hsl(var(--ink-3))]">
                  {year}
                </span>
              </h2>
              {loading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[hsl(var(--ink-3))]" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={goPrev}
                className="grid h-7 w-7 place-items-center rounded-[7px] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-muted))]"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={goToday}
                className="h-7 rounded-[7px] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-2.5 text-[11.5px] font-medium hover:bg-[hsl(var(--bg-muted))]"
              >
                Aujourd&apos;hui
              </button>
              <button
                type="button"
                onClick={goNext}
                className="grid h-7 w-7 place-items-center rounded-[7px] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-muted))]"
                aria-label="Mois suivant"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          <div className="grid shrink-0 grid-cols-7 border-b border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] text-center">
            {DAYS.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]",
                  i >= 5
                    ? "text-[hsl(var(--accent-apricot))]"
                    : "text-[hsl(var(--ink-3))]",
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grille dynamique : 5 ou 6 rangées qui se partagent la hauteur */}
          <div
            className="grid min-h-0 flex-1 grid-cols-7"
            style={{
              gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
            }}
          >
            {cells.map((cell, i) => {
              const dayEvents = eventsByDate.get(cell.iso) ?? [];
              const isSelected = cell.iso === selected;
              const isToday = cell.iso === todayIso;
              const row = Math.floor(i / 7);
              const lastRow = row === rowCount - 1;
              const lastCol = i % 7 === 6;
              const weekend = !cell.out && isWeekend(cell.iso);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(cell.iso)}
                  className={cn(
                    "relative min-h-0 overflow-hidden border-b border-r border-[hsl(var(--line))] p-1.5 text-left transition-colors",
                    lastCol && "border-r-0",
                    lastRow && "border-b-0",
                    cell.out
                      ? "bg-[hsl(var(--bg-sunken)/0.3)] text-[hsl(var(--ink-4))]"
                      : weekend
                        ? "bg-[hsl(var(--bg-sunken)/0.35)] hover:bg-[hsl(var(--bg-sunken)/0.6)]"
                        : "hover:bg-[hsl(var(--bg-sunken)/0.5)]",
                    isSelected &&
                      "bg-[hsl(var(--brand-soft)/0.55)] hover:bg-[hsl(var(--brand-soft)/0.55)]",
                  )}
                >
                  {isToday && !isSelected && (
                    <span className="pointer-events-none absolute inset-x-1.5 top-1.5 h-px bg-[hsl(var(--brand))]" />
                  )}
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full text-[12px] font-semibold tabular",
                      isSelected
                        ? "bg-[hsl(var(--brand))] text-white shadow-[var(--shadow-brand)]"
                        : isToday
                          ? "bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))] ring-1 ring-[hsl(var(--brand)/0.4)]"
                          : cell.out
                            ? "text-[hsl(var(--ink-4))]"
                            : "text-ink",
                    )}
                  >
                    {cell.day}
                  </span>

                  <div className="mt-1 flex min-h-0 flex-col gap-0.5">
                    {dayEvents.slice(0, 2).map((e) => {
                      const accent = e.projectColor ?? "#6366F1";
                      return (
                        <span
                          key={e.id}
                          className="inline-flex items-center gap-1 truncate rounded-[3px] border px-1 py-px text-[10px] font-medium"
                          style={{
                            background: `${accent}18`,
                            color: accent,
                            borderColor: `${accent}55`,
                          }}
                          title={`${e.identifier ?? ""} ${e.title}`}
                        >
                          {e.identifier && (
                            <span className="font-mono text-[9px] opacity-80">
                              {e.identifier}
                            </span>
                          )}
                          <span className="truncate">{e.title}</span>
                        </span>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="font-mono text-[9px] text-[hsl(var(--ink-3))]">
                        +{dayEvents.length - 2}
                      </span>
                    )}
                  </div>

                  {dayEvents.length > 0 && (
                    <span
                      className="pointer-events-none absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full"
                      style={{
                        background:
                          dayEvents[0].projectColor ?? "hsl(var(--brand))",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Side panel — page de journal scrollable */}
        <aside className="relative flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <div className="pointer-events-none absolute inset-0 bg-aurora opacity-60" />
          <header className="relative shrink-0 border-b border-[hsl(var(--line))] px-4 pt-4 pb-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--brand-ink))]">
              {WEEKDAY_LABEL[selectedDate.getDay()]}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="font-serif text-[44px] italic leading-none tracking-tight text-ink">
                {selectedDate.getDate()}
              </div>
              <div className="font-display text-[14px] font-semibold tracking-tight text-[hsl(var(--ink-2))]">
                {MONTH_LABEL[selectedDate.getMonth()]}
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-[hsl(var(--ink-3))]">
              <span>
                {selectedDate.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
              {!dayInMonth && (
                <span className="italic text-[hsl(var(--ink-4))]">
                  · hors du mois
                </span>
              )}
              {selected === todayIso && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--brand-soft))] px-1.5 py-0.5 text-[9px] font-semibold text-[hsl(var(--brand-ink))]">
                  Aujourd&apos;hui
                </span>
              )}
            </div>
            <div className="mt-2 text-[11px] font-medium text-[hsl(var(--ink-2))]">
              {selectedEvents.length === 0
                ? "Aucune échéance"
                : `${selectedEvents.length} échéance${selectedEvents.length > 1 ? "s" : ""}`}
            </div>
          </header>

          <ul className="relative min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {selectedEvents.length === 0 ? (
              <li className="grid place-items-center rounded-[var(--radius-sm)] border border-dashed border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-sunken)/0.4)] px-4 py-6 text-center">
                <span className="font-serif text-[15px] italic text-[hsl(var(--ink-3))]">
                  Une page blanche.
                </span>
                <span className="mt-0.5 text-[11px] text-[hsl(var(--ink-4))]">
                  Rien de prévu.
                </span>
              </li>
            ) : (
              selectedEvents.map((e) => {
                const accent = e.projectColor ?? "#6366F1";
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => routerService.toTask(e.taskId)}
                      className="group relative w-full overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-2.5 text-left shadow-[var(--shadow-1)] transition-all hover:-translate-y-px hover:shadow-[var(--shadow-2)]"
                    >
                      <span
                        className="absolute inset-y-0 left-0 w-1"
                        style={{ background: accent }}
                      />
                      <div className="pl-2">
                        <div className="flex items-center gap-2">
                          {e.identifier && (
                            <span className="font-mono text-[10px] font-semibold tracking-wider text-[hsl(var(--ink-3))]">
                              {e.identifier}
                            </span>
                          )}
                          {e.projectName && (
                            <span className="truncate text-[10px] text-[hsl(var(--ink-4))]">
                              · {e.projectName}
                            </span>
                          )}
                          <ArrowRight className="ml-auto h-3 w-3 shrink-0 text-[hsl(var(--ink-4))] opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div className="mt-0.5 text-[12.5px] font-semibold leading-snug tracking-tight text-ink">
                          {e.title}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <StatusPill status={normalizeApiStatus(e.status)} />
                          <PriorityPill
                            priority={normalizeApiPriority(e.priority)}
                          />
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Mini stat strip ---------- */

function MiniStat({
  Icon,
  label,
  value,
  hint,
  tone,
  isText,
  onClick,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  hint?: string;
  tone: "brand" | "apricot" | "sage";
  isText?: boolean;
  onClick?: () => void;
}) {
  const tones: Record<
    string,
    { bg: string; fg: string; accent: string; border: string }
  > = {
    brand: {
      bg: "bg-[hsl(var(--brand-soft))]",
      fg: "text-[hsl(var(--brand-ink))]",
      accent: "hsl(var(--brand))",
      border: "border-[hsl(var(--brand)/0.18)]",
    },
    apricot: {
      bg: "bg-[hsl(23_92%_94%)]",
      fg: "text-[hsl(22_78%_42%)]",
      accent: "hsl(var(--accent-apricot))",
      border: "border-[hsl(var(--accent-apricot)/0.3)]",
    },
    sage: {
      bg: "bg-[hsl(152_50%_92%)]",
      fg: "text-[hsl(var(--accent-sage))]",
      accent: "hsl(var(--accent-sage))",
      border: "border-[hsl(var(--accent-sage)/0.25)]",
    },
  };
  const t = tones[tone];
  const interactive = !!onClick;

  const Content = (
    <>
      <div className="flex items-center gap-2.5">
        <span className={cn("grid h-8 w-8 place-items-center rounded-[8px]", t.bg, t.fg)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
            {label}
          </div>
          <div
            className={cn(
              "mt-0.5 font-display font-semibold tracking-tight",
              isText ? "text-[15px]" : "text-[18px] tabular",
            )}
          >
            {value}
          </div>
        </div>
      </div>
      {hint && (
        <div className="mt-1.5 truncate font-serif text-[11.5px] italic text-[hsl(var(--ink-3))]">
          {hint}
        </div>
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group relative overflow-hidden rounded-[var(--radius-md)] border bg-[hsl(var(--bg-elevated))] p-3 text-left shadow-[var(--shadow-1)] transition-all hover:-translate-y-px hover:shadow-[var(--shadow-2)]",
          t.border,
        )}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-80"
          style={{ background: t.accent }}
        />
        {Content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-md)] border bg-[hsl(var(--bg-elevated))] p-3 shadow-[var(--shadow-1)]",
        t.border,
      )}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-80"
        style={{ background: t.accent }}
      />
      {Content}
    </div>
  );
}
