"use client";
import {
  FolderKanban,
  CheckCircle2,
  CircleDashed,
  Eye,
  Plus,
  Sparkles,
  ArrowUpRight,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Button } from "@/components/ui/button";
import { routerService, useAuth, useProjects } from "@/services";
import { colorForProject, projectPrefix } from "@/lib/mappers";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, loading } = useProjects();

  const firstName = user?.name?.split(" ")[0] ?? "vous";

  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Tableau de bord" }]} />} />
      <main className="flex-1 px-8 py-7">
        <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <div className="absolute inset-0 -z-0 bg-aurora opacity-90" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[hsl(var(--brand)/0.18)] blur-3xl" />

          <div className="relative grid gap-6 px-7 py-6 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--brand-ink))]">
                Bonjour
              </p>
              <h1 className="mt-2 font-display text-[36px] font-semibold leading-[1.02] tracking-tight">
                Bonjour {firstName}{" "}
                <span className="inline-block animate-[float_4s_ease-in-out_infinite] origin-bottom-left">
                  👋
                </span>
              </h1>
              <p className="mt-2 max-w-[560px] text-[14.5px] leading-relaxed text-[hsl(var(--ink-2))]">
                Vous avez{" "}
                <span className="font-semibold text-ink">{projects.length} projet{projects.length > 1 ? "s" : ""}</span>{" "}
                en cours. Bonne énergie ce matin.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button variant="brand" size="md" onClick={() => routerService.toProjects()}>
                  <Plus className="h-4 w-4" />
                  Voir les projets
                </Button>
                <Button variant="outline" size="md" onClick={() => routerService.toAiNew()}>
                  <Sparkles className="h-4 w-4" />
                  Plan IA
                </Button>
                <Button variant="ghost" size="md" onClick={() => routerService.toMyTasks()}>
                  Mes tâches du jour →
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Projets" value={projects.length} Icon={FolderKanban} tone="brand" />
          <Kpi label="Tâches actives" value={0} Icon={CircleDashed} tone="apricot" />
          <Kpi label="En revue" value={0} Icon={Eye} tone="rose" />
          <Kpi label="Terminées" value={0} Icon={CheckCircle2} tone="sage" />
        </section>

        <section className="mt-7">
          <header className="flex items-baseline justify-between">
            <div>
              <h2 className="font-display text-[20px] font-semibold tracking-tight">
                Mes projets
              </h2>
              <p className="mt-0.5 text-[12.5px] text-[hsl(var(--ink-3))]">
                Vos espaces de travail actifs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => routerService.toProjects()}
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[hsl(var(--brand-ink))] hover:underline"
            >
              Voir tous les projets <ArrowUpRight className="h-3 w-3" />
            </button>
          </header>

          {loading ? (
            <div className="mt-6 flex items-center justify-center gap-2 text-[13px] text-[hsl(var(--ink-3))]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] p-8 text-center text-[13px] text-[hsl(var(--ink-3))]">
              Aucun projet pour le moment.{" "}
              <button
                type="button"
                onClick={() => routerService.toProjects()}
                className="font-medium text-[hsl(var(--brand-ink))] underline"
              >
                En créer un
              </button>
              .
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {projects.slice(0, 8).map((p) => {
                const color = colorForProject(p.id);
                const prefix = projectPrefix(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => routerService.toProject(p.id)}
                    className="group relative w-full overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-5 text-left shadow-[var(--shadow-1)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
                    />
                    <div className="flex items-start justify-between">
                      <span
                        className="grid h-11 w-11 place-items-center rounded-[10px] text-white font-mono text-[11px] font-bold"
                        style={{ background: color }}
                      >
                        {prefix}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[hsl(var(--ink-4))] opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="mt-4">
                      <div className="font-display text-[16.5px] font-semibold tracking-tight">
                        {p.name}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-[hsl(var(--ink-3))]">
                        {p.description ?? "—"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-7">
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--brand)/0.18)] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)] grain">
            <div className="absolute inset-0 -z-0 bg-aurora opacity-90" />
            <div className="relative grid items-center gap-6 px-7 py-7 md:grid-cols-[1.4fr_auto]">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.16em] uppercase text-[hsl(var(--brand-ink))]">
                  <Sparkles className="h-3 w-3" /> Planification IA
                </span>
                <h3 className="mt-3 font-display text-[24px] font-semibold tracking-tight leading-tight">
                  Du brief à la roadmap en 90 secondes.
                </h3>
                <p className="mt-1.5 max-w-md text-[13.5px] text-[hsl(var(--ink-2))]">
                  Décrivez votre projet, l&apos;IA structure les epics, stories et tâches.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="brand" size="lg" onClick={() => routerService.toAiNew()}>
                  <Sparkles className="h-4 w-4" />
                  Lancer un plan IA
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function Kpi({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "brand" | "sage" | "apricot" | "rose";
}) {
  const toneMap: Record<string, { bg: string; fg: string }> = {
    brand: { bg: "bg-[hsl(var(--brand-soft))]", fg: "text-[hsl(var(--brand-ink))]" },
    sage: { bg: "bg-[hsl(152_50%_92%)]", fg: "text-[hsl(var(--accent-sage))]" },
    apricot: { bg: "bg-[hsl(23_92%_94%)]", fg: "text-[hsl(22_78%_42%)]" },
    rose: { bg: "bg-[hsl(348_78%_96%)]", fg: "text-[hsl(var(--accent-rose))]" },
  };
  const t = toneMap[tone];
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-5 shadow-[var(--shadow-1)]">
      <span className={cn("grid h-9 w-9 place-items-center rounded-[10px]", t.bg, t.fg)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="mt-4">
        <div className="font-display text-[34px] font-semibold leading-none tabular tracking-tight">
          {value}
        </div>
        <div className="mt-2 text-[12px] font-medium text-[hsl(var(--ink-2))]">
          {label}
        </div>
      </div>
    </div>
  );
}
