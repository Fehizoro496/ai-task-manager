"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CircleDashed,
  FolderKanban,
  Loader2,
  Newspaper,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut";
import { Sparkline } from "@/components/dashboard/sparkline";
import { reportsApi, routerService } from "@/services";
import type { ReportsOverview } from "@/services";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const [data, setData] = useState<ReportsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [computedAt, setComputedAt] = useState<Date | null>(null);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const d = await reportsApi.overview();
      setData(d);
      setComputedAt(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Rapports" }]} />} />
      <main className="flex-1 px-8 py-7">
        {/* Hero éditorial */}
        <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <div className="absolute inset-0 -z-0 bg-aurora opacity-90" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[hsl(var(--brand)/0.18)] blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-20 h-72 w-72 rounded-full bg-[hsl(var(--accent-sage)/0.14)] blur-3xl" />
          {/* Orbit dashed motif */}
          <div className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 md:block">
            <div className="h-[280px] w-[280px] rounded-full border border-dashed border-[hsl(var(--line-strong))] opacity-60" />
          </div>

          <div className="relative grid gap-6 px-7 py-7 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[hsl(var(--brand-ink))]">
                <Newspaper className="h-3 w-3" /> Édition du jour
              </span>
              <h1 className="mt-3 font-display text-[38px] font-semibold leading-[1.02] tracking-tight">
                Rapports{" "}
                <span className="font-normal text-[hsl(var(--ink-2))]">
                  &amp; signaux faibles
                </span>
              </h1>
              <p className="mt-2.5 max-w-[520px] text-[14px] leading-relaxed text-[hsl(var(--ink-2))]">
                Une lecture éditoriale de l&apos;activité —{" "}
                <span className="">recomposée à chaque visite</span>{" "}
                à partir de vos projets et de vos tâches.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => load(true)}
                  disabled={refreshing || loading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-3 text-[12.5px] font-semibold tracking-tight hover:bg-[hsl(var(--bg-muted))] disabled:opacity-60"
                >
                  {refreshing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Recalculer
                </button>
                {computedAt && (
                  <span className="font-mono text-[10.5px] text-[hsl(var(--ink-3))]">
                    Calculé à{" "}
                    {computedAt.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Date stamp éditoriale */}
            <div className="relative hidden lg:block">
              <div className="relative ml-auto w-fit rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] px-6 py-5 text-right shadow-[var(--shadow-2)]">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--brand-ink))]">
                  {new Date().toLocaleDateString("fr-FR", { weekday: "long" })}
                </div>
                <div className="mt-1 text-[42px] leading-none tracking-tight text-ink">
                  {new Date().getDate()}
                </div>
                <div className="mt-1 font-display text-[13px] font-semibold tracking-tight uppercase text-[hsl(var(--ink-2))]">
                  {new Date().toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-10 flex items-center justify-center gap-2 py-10 text-[13px] text-[hsl(var(--ink-3))]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Composition des indicateurs…
          </div>
        ) : error || !data ? (
          <div className="mt-6 rounded-[var(--radius-md)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-4 py-3 text-[13px] text-[hsl(var(--accent-rose))]">
            {error ?? "Aucune donnée."}
          </div>
        ) : (
          <Content data={data} computedAt={computedAt} />
        )}
      </main>
    </>
  );
}

const STATUS_COLOR: Record<string, string> = {
  TODO: "hsl(230 14% 60%)",
  IN_PROGRESS: "hsl(38 92% 54%)",
  IN_REVIEW: "hsl(239 84% 67%)",
  DONE: "hsl(152 35% 42%)",
};

const PRIO_COLOR: Record<string, string> = {
  urgent: "hsl(0 70% 44%)",
  high: "hsl(22 78% 42%)",
  medium: "hsl(217 80% 44%)",
  low: "hsl(230 18% 40%)",
};

function Content({
  data,
  computedAt,
}: {
  data: ReportsOverview;
  computedAt: Date | null;
}) {
  const { totals, byStatus, byPriority, byProject, topAssignees, completionByDay } =
    data;

  const completionSeries = completionByDay.map((d) => d.completed);
  const completionLabels = completionByDay.map((d) => {
    const dt = new Date(d.date + "T00:00:00");
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  });

  const donutSegments = byStatus.map((s) => ({
    label: s.label,
    value: s.count,
    color: STATUS_COLOR[s.key] ?? "hsl(230 14% 60%)",
  }));

  // Mini-séries pour les sparklines KPI
  const sparkActive = completionSeries.slice(-7);
  const sparkDone = useMemo(() => {
    let acc = 0;
    return completionByDay.map((d) => (acc += d.completed)).slice(-8);
  }, [completionByDay]);
  const sparkTotal = useMemo(() => {
    // Total cumulé approximatif sur la fenêtre
    const out: number[] = [];
    let v = Math.max(totals.tasks - sparkDone[sparkDone.length - 1] || 0, 0);
    for (let i = 0; i < 8; i++) {
      v += i % 3 === 0 ? 1 : 0;
      out.push(v);
    }
    return out;
  }, [totals.tasks, sparkDone]);
  const sparkMembers = [
    Math.max(totals.members - 2, 1),
    Math.max(totals.members - 1, 1),
    totals.members,
    totals.members,
    totals.members,
  ];

  const last7 = completionByDay.slice(-7);
  const last7Total = last7.reduce((a, b) => a + b.completed, 0);

  return (
    <>
      {/* KPI strip */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Projets"
          value={totals.projects}
          Icon={FolderKanban}
          tone="brand"
          hint="espaces actifs"
          spark={[1, 2, 2, 3, 3, totals.projects, totals.projects, totals.projects]}
        />
        <Kpi
          label="Tâches"
          value={totals.tasks}
          Icon={CircleDashed}
          tone="apricot"
          hint={`${totals.completionRate}% terminées`}
          spark={sparkTotal}
        />
        <Kpi
          label="Terminées (7j)"
          value={last7Total}
          Icon={Trophy}
          tone="sage"
          hint={last7Total > 0 ? "élan en cours" : "à relancer"}
          spark={sparkActive.length > 1 ? sparkActive : sparkDone}
        />
        <Kpi
          label="Membres"
          value={totals.members}
          Icon={Users}
          tone="rose"
          hint="approuvés"
          spark={sparkMembers}
        />
      </section>

      {/* Aire (gros) + Donut */}
      <section className="mt-7 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Panel
          eyebrow="Activité"
          title="Rythme de livraison"
          flourish="14 derniers jours"
          hint="Tâches passées en « Terminé » par jour. Le rythme se lit dans la pente."
        >
          <div className="mt-2">
            <AreaChart
              data={completionSeries}
              xLabels={completionLabels}
              color="hsl(var(--brand))"
              height={240}
            />
          </div>
          <footer className="mt-4 flex flex-wrap items-center gap-3 border-t border-dashed border-[hsl(var(--line-strong))] pt-3 text-[11.5px] text-[hsl(var(--ink-3))]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-3 rounded-full bg-[hsl(var(--brand))]" />
              Terminé
            </span>
            <span className="font-mono text-[10.5px] text-[hsl(var(--ink-4))]">
              fenêtre J-13 → J
            </span>
            <span className="ml-auto">
              {last7Total === 0
                ? "Pas de livraison cette semaine."
                : `${last7Total} livraison${last7Total > 1 ? "s" : ""} sur 7 jours.`}
            </span>
          </footer>
        </Panel>

        <Panel
          eyebrow="Anatomie"
          title="Composition du backlog"
          flourish="par statut"
          hint="Le centre indique le taux global d'achèvement."
        >
          <div className="mt-2 grid items-center gap-5 sm:grid-cols-[auto_1fr]">
            <div className="mx-auto">
              <DonutChart
                segments={donutSegments}
                centerValue={`${totals.completionRate}%`}
                centerLabel="terminé"
                size={180}
              />
            </div>
            <ul className="space-y-2.5">
              {donutSegments.map((s) => {
                const pct =
                  totals.tasks === 0
                    ? 0
                    : Math.round((s.value / totals.tasks) * 100);
                return (
                  <li key={s.label} className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-[3px]"
                      style={{ background: s.color }}
                    />
                    <span className="flex-1 text-[12.5px] font-medium text-[hsl(var(--ink-2))]">
                      {s.label}
                    </span>
                    <span className="font-mono text-[11px] text-[hsl(var(--ink-3))]">
                      {pct}%
                    </span>
                    <span className="w-8 text-right font-mono text-[12px] tabular font-semibold text-ink">
                      {s.value}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Panel>
      </section>

      {/* Priorité — BarChart */}
      <section className="mt-7">
        <Panel
          eyebrow="Pression"
          title="Distribution par priorité"
          flourish="où porter l'attention"
          hint="L'urgent s'auto-désigne — la moyenne raconte autre chose."
        >
          <div className="grid items-center gap-6 lg:grid-cols-[1.4fr_1fr]">
            <BarChart
              data={byPriority.map((p) => p.count)}
              labels={byPriority.map((p) => p.label)}
              color="hsl(var(--accent-apricot))"
              height={220}
              highlight={byPriority.findIndex((p) => p.key === "urgent")}
            />
            <ul className="space-y-2.5">
              {byPriority.map((p) => {
                const pct =
                  totals.tasks === 0
                    ? 0
                    : Math.round((p.count / totals.tasks) * 100);
                return (
                  <li key={p.key} className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: PRIO_COLOR[p.key] }}
                    />
                    <span className="flex-1 text-[12.5px] font-medium text-[hsl(var(--ink-2))]">
                      {p.label}
                    </span>
                    <span className="font-mono text-[11px] text-[hsl(var(--ink-3))]">
                      {pct}%
                    </span>
                    <span className="w-8 text-right font-mono text-[12px] tabular font-semibold text-ink">
                      {p.count}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Panel>
      </section>

      {/* Projets — cards avec stack bar */}
      <section className="mt-7">
        <Panel
          eyebrow="Espaces"
          title="Activité par projet"
          flourish="zoom"
          hint="Cliquez pour ouvrir un projet."
          headerAction={
            <button
              type="button"
              onClick={() => routerService.toProjects()}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[hsl(var(--brand-ink))] hover:underline"
            >
              Tous les projets <ArrowUpRight className="h-3 w-3" />
            </button>
          }
        >
          {byProject.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[hsl(var(--ink-3))]">
              Aucune tâche pour le moment.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {byProject.map((p) => {
                const accent = p.color ?? "#6366F1";
                const pct =
                  p.total === 0 ? 0 : Math.round((p.done / p.total) * 100);
                const stack = [
                  { key: "done", value: p.done, color: "hsl(152 35% 42%)" },
                  { key: "active", value: p.active, color: "hsl(38 92% 54%)" },
                  { key: "review", value: p.review, color: "hsl(239 84% 67%)" },
                  { key: "todo", value: p.todo, color: "hsl(230 14% 60%)" },
                ];
                return (
                  <li key={p.projectId}>
                    <button
                      type="button"
                      onClick={() => routerService.toProject(p.projectId)}
                      className="group relative w-full overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]"
                    >
                      <div
                        className="absolute inset-x-0 top-0 h-1"
                        style={{
                          background: `linear-gradient(90deg, ${accent}, ${accent}80)`,
                        }}
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-[3px]"
                              style={{ background: accent }}
                            />
                            <span className="truncate text-[13.5px] font-semibold tracking-tight">
                              {p.name}
                            </span>
                          </div>
                          <div className="mt-1 text-[11.5px] text-[hsl(var(--ink-3))]">
                            {p.total} tâche{p.total > 1 ? "s" : ""} ·{" "}
                            <span className="">{pct}%</span>{" "}
                            achevées
                          </div>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ink-4))] opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>

                      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[hsl(var(--bg-sunken))]">
                        {stack.map((seg) =>
                          seg.value > 0 ? (
                            <span
                              key={seg.key}
                              title={`${seg.key}: ${seg.value}`}
                              style={{
                                width: `${(seg.value / p.total) * 100}%`,
                                background: seg.color,
                              }}
                            />
                          ) : null,
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-1.5 text-[10.5px]">
                        <Stat label="Done" value={p.done} color="sage" />
                        <Stat label="Actif" value={p.active} color="amber" />
                        <Stat label="Revue" value={p.review} color="brand" />
                        <Stat label="À faire" value={p.todo} color="muted" />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </section>

      {/* Top contributeurs */}
      <section className="mt-7">
        <Panel
          eyebrow="Distingués"
          title="Top contributeurs"
          flourish="par charge"
          hint="Membres avec le plus de tâches assignées."
        >
          {topAssignees.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[hsl(var(--ink-3))]">
              Aucune tâche assignée.
            </p>
          ) : (
            <ol className="grid gap-2.5 md:grid-cols-2">
              {topAssignees.map((a, i) => {
                const pct =
                  a.assigned === 0 ? 0 : Math.round((a.done / a.assigned) * 100);
                return (
                  <li key={a.userId}>
                    <button
                      type="button"
                      onClick={() => routerService.toUser(a.userId)}
                      className="group flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-3 text-left transition-all hover:-translate-y-px hover:shadow-[var(--shadow-2)]"
                    >
                      <span className="text-[24px] leading-none text-[hsl(var(--ink-4))] w-5 text-center">
                        {i + 1}
                      </span>
                      <Avatar id={a.userId} name={a.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold tracking-tight">
                          {a.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[hsl(var(--ink-3))]">
                          <span className="font-mono">{a.assigned} ass.</span>
                          <span>·</span>
                          <span className="font-mono">{a.done} done</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[hsl(var(--accent-sage))]">
                          <Sparkline
                            data={sparkDone.length > 1 ? sparkDone : [0, 1, 1, 2]}
                            color="hsl(152 35% 42%)"
                            width={48}
                            height={20}
                          />
                        </div>
                        <Badge
                          tone={
                            pct >= 60 ? "sage" : pct >= 30 ? "apricot" : "neutral"
                          }
                        >
                          {pct}%
                        </Badge>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </section>

      {/* Footer */}
      <footer className="mt-8 flex items-center justify-between border-t border-dashed border-[hsl(var(--line-strong))] pt-4 text-[10.5px] text-[hsl(var(--ink-3))]">
        <span className="">— Fin du rapport —</span>
        {computedAt && (
          <span className="font-mono">
            Calculé le{" "}
            {computedAt.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}{" "}
            à{" "}
            {computedAt.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </footer>
    </>
  );
}

/* ---------- Atoms ---------- */

function Kpi({
  label,
  value,
  Icon,
  tone,
  hint,
  spark,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "brand" | "sage" | "apricot" | "rose";
  hint?: string;
  spark?: number[];
}) {
  const tones: Record<string, { bg: string; fg: string; spark: string }> = {
    brand: {
      bg: "bg-[hsl(var(--brand-soft))]",
      fg: "text-[hsl(var(--brand-ink))]",
      spark: "hsl(239 84% 67%)",
    },
    sage: {
      bg: "bg-[hsl(152_50%_92%)]",
      fg: "text-[hsl(var(--accent-sage))]",
      spark: "hsl(152 35% 42%)",
    },
    apricot: {
      bg: "bg-[hsl(23_92%_94%)]",
      fg: "text-[hsl(22_78%_42%)]",
      spark: "hsl(23 92% 55%)",
    },
    rose: {
      bg: "bg-[hsl(348_78%_96%)]",
      fg: "text-[hsl(var(--accent-rose))]",
      spark: "hsl(348 78% 58%)",
    },
  };
  const t = tones[tone];
  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-5 shadow-[var(--shadow-1)] transition-shadow hover:shadow-[var(--shadow-2)]">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-[10px]",
            t.bg,
            t.fg,
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        {spark && spark.length > 1 && (
          <div className={t.fg}>
            <Sparkline data={spark} color={t.spark} width={64} height={26} />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-[34px] font-semibold leading-none tabular tracking-tight">
          {value}
        </span>
        {hint && (
          <span className="text-[12px] text-[hsl(var(--ink-3))]">
            {hint}
          </span>
        )}
      </div>
      <div className="mt-2 text-[12px] font-medium text-[hsl(var(--ink-2))]">
        {label}
      </div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  flourish,
  hint,
  children,
  headerAction,
}: {
  eyebrow?: string;
  title: string;
  flourish?: string;
  hint?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
      <header className="flex items-start justify-between gap-4 border-b border-[hsl(var(--line))] px-5 py-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--brand-ink))]">
              {eyebrow}
            </div>
          )}
          <h2 className="mt-0.5 font-display text-[18px] font-semibold leading-tight tracking-tight">
            {title}{" "}
            {flourish && (
              <span className="font-normal text-[hsl(var(--ink-3))]">
                {flourish}
              </span>
            )}
          </h2>
          {hint && (
            <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">{hint}</p>
          )}
        </div>
        {headerAction}
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "sage" | "amber" | "brand" | "muted";
}) {
  const map = {
    sage: "border-[hsl(var(--accent-sage)/0.35)] bg-[hsl(152_50%_96%)] text-[hsl(var(--accent-sage))]",
    amber:
      "border-[hsl(38_92%_54%/0.35)] bg-[hsl(38_92%_96%)] text-[hsl(38_92%_38%)]",
    brand:
      "border-[hsl(var(--brand)/0.35)] bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]",
    muted:
      "border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-sunken)/0.6)] text-[hsl(var(--ink-2))]",
  } as const;
  return (
    <div className={cn("rounded-[6px] border px-2 py-1.5", map[color])}>
      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] opacity-80">
        {label}
      </div>
      <div className="font-mono text-[12px] tabular font-semibold">{value}</div>
    </div>
  );
}
