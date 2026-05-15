import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { MonthView } from "@/components/calendar/month-view";

export default function CalendarPage() {
  return (
    <>
      <Topbar
        breadcrumb={<Breadcrumb items={[{ label: "Calendrier" }]} />}
      />
      <main className="flex-1 px-8 py-7">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-tight">
              Calendrier
            </h1>
            <p className="mt-1 text-[13px] text-[hsl(var(--ink-3))]">
              Vos échéances et événements, synchronisés depuis vos projets.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <MonthView />
        </div>
      </main>
    </>
  );
}
