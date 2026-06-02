"use client";
import { CalendarDays } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { MonthView } from "@/components/calendar/month-view";

export default function CalendarPage() {
  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Calendrier" }]} />} />
      <main className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-5 pt-4">
        {/* Hero compact */}
        <section className="relative shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <div className="absolute inset-0 -z-0 bg-aurora opacity-80" />
          <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[hsl(var(--accent-apricot)/0.18)] blur-3xl" />
          <div className="pointer-events-none absolute -right-10 -bottom-12 h-44 w-44 rounded-full bg-[hsl(var(--brand)/0.16)] blur-3xl" />

          <div className="relative flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-[hsl(var(--brand-ink))]">
                <CalendarDays className="h-2.5 w-2.5" /> Agenda
              </span>
              <h1 className="mt-1.5 font-display text-[20px] font-semibold leading-[1.1] tracking-tight">
                Les jours qui{" "}
                <span className="font-serif italic font-normal text-[hsl(var(--ink-2))]">
                  comptent
                </span>
              </h1>
            </div>
            <div className="hidden text-right md:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--brand-ink))]">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long" })}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-[hsl(var(--ink-3))]">
                {new Date().toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="min-h-0 flex-1">
          <MonthView />
        </div>
      </main>
    </>
  );
}
