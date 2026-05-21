import { routerService } from "@/services";
import {
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Clock3,
  Target,
  CheckCircle2,
  TrendingUp,
  Trophy,
  Filter,
} from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Sparkline } from "@/components/dashboard/sparkline";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut";
import { projects, tasks, users } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  // Burndown — sprint 10 jours, idéal = ligne droite, réel = quelques aléas
  const burndownIdeal = [96, 86, 76, 67, 58, 48, 38, 29, 19, 10, 0];
  const burndownActual = [96, 92, 88, 80, 75, 70, 62, 58, 50, 42, 34];
  const burndownLabels = ["J1", "J2", "J3", "J4", "J5", "J6", "J7", "J8", "J9", "J10", "J11"];

  // Velocity — 8 derniers sprints
  const velocity = [48, 52, 58, 55, 62, 60, 68, 72];
  const velocityLabels = ["S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20"];

  // Distribution par statut
  const statusSegments = [
    { label: "Terminé",  value: 128, color: "hsl(152 35% 42%)" },
    { label: "En cours", value: 45,  color: "hsl(38 92% 54%)"  },
    { label: "En revue", value: 18,  color: "hsl(239 84% 67%)" },
    { label: "À faire",  value: 34,  color: "hsl(230 14% 78%)" },
  ];
  const totalTasks = statusSegments.reduce((acc, s) => acc + s.value, 0);

  // Throughput
  const throughput = [12, 18, 14, 22, 19, 28, 24];
  const throughputLabels = ["L", "M", "M", "J", "V", "S", "D"];

  // Leaderboard
  const performers = [
    { user: users[1], delivered: 34, points: 48, trend: [4, 5, 6, 5, 7, 8, 9] },
    { user: users[2], delivered: 28, points: 39, trend: [3, 4, 4, 5, 6, 5, 7] },
    { user: users[3], delivered: 22, points: 31, trend: [2, 3, 3, 4, 4, 5, 5] },
    { user: users[0], delivered: 18, points: 24, trend: [3, 3, 2, 3, 4, 3, 4] },
  ];

  // Project health
  const health = projects.map((p, i) => ({
    project: p,
    progress: [62, 78, 45, 88][i] ?? 60,
    health: ["good", "good", "warn", "good"][i] ?? "good",
    delivered: [62, 18, 14, 19][i] ?? 30,
    velocity: [+12, +8, -4, +6][i] ?? 0,
  }));

  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Rapports" }]} />} />
      <main className="flex-1 px-8 py-7">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--brand-soft))] px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.16em] uppercase text-[hsl(var(--brand-ink))]">
              <Sparkles className="h-3 w-3" /> Analytique
            </span>
            <h1 className="mt-2 font-display text-[30px] font-semibold tracking-tight leading-tight">
              Rapports &{" "}
              <span className="font-serif italic font-normal text-[hsl(var(--ink-2))]">
                signaux
              </span>
            </h1>
            <p className="mt-1.5 max-w-[560px] text-[13.5px] text-[hsl(var(--ink-3))]">
              Vélocité, throughput, santé des projets — l&apos;essentiel pour piloter
              vos cycles sans micro-management.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-0.5 rounded-[var(--radius-sm)] bg-[hsl(var(--bg-sunken)/0.7)] p-0.5">
              {["7 j", "30 j", "Sprint", "Trimestre"].map((v, i) => (
                <button
                  key={v}
                  className={cn(
                    "h-8 rounded-[6px] px-3 text-[12px] font-medium",
                    i === 2
                      ? "bg-[hsl(var(--bg-elevated))] text-ink shadow-[var(--shadow-1)]"
                      : "text-[hsl(var(--ink-3))]",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button variant="outline" size="md">
              <Filter className="h-3.5 w-3.5" />
              Filtrer
            </Button>
            <Button variant="brand" size="md">
              <Download className="h-3.5 w-3.5" />
              Exporter
            </Button>
          </div>
        </header>

        {/* KPI strip */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KPI
            label="Vélocité moyenne"
            value="62"
            unit="pts/sprint"
            delta="+12%"
            positive
            Icon={TrendingUp}
            tone="brand"
            spark={velocity}
          />
          <KPI
            label="Throughput"
            value="24"
            unit="tâches/sem."
            delta="+8%"
            positive
            Icon={CheckCircle2}
            tone="sage"
            spark={throughput}
          />
          <KPI
            label="Cycle time médian"
            value="2,4"
            unit="jours"
            delta="-14%"
            positive
            Icon={Clock3}
            tone="apricot"
            spark={[3.2, 3.0, 2.8, 2.9, 2.6, 2.5, 2.4]}
          />
          <KPI
            label="Objectifs trimestre"
            value="74%"
            unit="atteints"
            delta="+6 pts"
            positive
            Icon={Target}
            tone="rose"
            spark={[40, 48, 55, 60, 65, 70, 74]}
          />
        </section>

        {/* Burndown + Velocity */}
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          <ChartCard
            title="Burndown — Sprint 20"
            subtitle="Réel vs. courbe idéale (96 points)"
            badge={<Badge tone="apricot">+8 pts de dette</Badge>}
          >
            <AreaChart
              data={burndownActual}
              ideal={burndownIdeal}
              xLabels={burndownLabels}
              height={240}
              color="hsl(239 84% 67%)"
            />
            <Legend
              items={[
                { color: "hsl(239 84% 67%)", label: "Restant réel" },
                { color: "hsl(var(--ink-4))", label: "Idéal", dashed: true },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Vélocité"
            subtitle="Points livrés par sprint (8 derniers)"
            badge={
              <Badge tone="sage">
                <ArrowUpRight className="h-2.5 w-2.5" />
                Sprint 20
              </Badge>
            }
          >
            <BarChart
              data={velocity}
              labels={velocityLabels}
              height={240}
              color="hsl(239 84% 67%)"
            />
            <Legend
              items={[
                { color: "hsl(239 84% 67%)", label: "Sprint en cours" },
                { color: "hsl(var(--line-strong))", label: "Précédents" },
              ]}
            />
          </ChartCard>
        </section>

        {/* Distribution + Throughput */}
        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <ChartCard
            title="Répartition par statut"
            subtitle={`${totalTasks} tâches actives ce trimestre`}
          >
            <div className="flex flex-wrap items-center gap-6 px-2 py-3">
              <DonutChart
                segments={statusSegments}
                centerLabel="Tâches"
                centerValue={totalTasks}
              />
              <ul className="flex-1 min-w-[180px] space-y-2.5">
                {statusSegments.map((s) => {
                  const pct = Math.round((s.value / totalTasks) * 100);
                  return (
                    <li key={s.label}>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: s.color }}
                          />
                          <span className="font-medium">{s.label}</span>
                        </span>
                        <span className="font-mono font-semibold tabular text-[hsl(var(--ink-2))]">
                          {s.value}{" "}
                          <span className="text-[hsl(var(--ink-3))]">({pct}%)</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--bg-sunken))]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: s.color }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </ChartCard>

          <ChartCard
            title="Throughput — 7 derniers jours"
            subtitle="Tâches terminées par jour"
            badge={<Badge tone="sage">Moy. 19,6/j</Badge>}
          >
            <BarChart
              data={throughput}
              labels={throughputLabels}
              height={200}
              color="hsl(152 35% 42%)"
            />
            <div className="grid grid-cols-3 gap-2 px-2 pb-2">
              <Mini label="Lundi—Vendredi" value="95" hint="69% du total" />
              <Mini label="Week-end" value="42" hint="31% du total" />
              <Mini label="Pic du jour" value="28" hint="jeudi 13h–16h" />
            </div>
          </ChartCard>
        </section>

        {/* Leaderboard + Project health */}
        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <ChartCard
            title="Top contributeurs"
            subtitle="Points livrés sur les 4 dernières semaines"
            badge={
              <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(38_92%_94%)] px-2 py-0.5 text-[10.5px] font-semibold text-[hsl(38_92%_38%)]">
                <Trophy className="h-3 w-3" />
                Classement
              </span>
            }
          >
            <ul className="divide-y divide-[hsl(var(--line))]">
              {performers.map((p, i) => (
                <li
                  key={p.user.id}
                  className="flex items-center gap-3 px-1 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full font-mono text-[11px] font-bold tabular",
                      i === 0
                        ? "bg-[hsl(38_92%_88%)] text-[hsl(38_92%_28%)]"
                        : i === 1
                          ? "bg-[hsl(0_0%_85%)] text-[hsl(0_0%_30%)]"
                          : i === 2
                            ? "bg-[hsl(23_60%_88%)] text-[hsl(23_70%_30%)]"
                            : "bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-3))]",
                    )}
                  >
                    {i + 1}
                  </span>
                  <Avatar id={p.user.id} name={p.user.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold tracking-tight">
                      {p.user.name}
                    </div>
                    <div className="text-[11px] text-[hsl(var(--ink-3))]">
                      {p.delivered} tâches · {p.points} pts
                    </div>
                  </div>
                  <div className="text-[hsl(var(--accent-sage))]">
                    <Sparkline
                      data={p.trend}
                      color="hsl(152 35% 42%)"
                      width={56}
                      height={22}
                    />
                  </div>
                  <span className="font-display text-[18px] font-semibold tabular w-9 text-right">
                    {p.points}
                  </span>
                </li>
              ))}
            </ul>
          </ChartCard>

          <ChartCard
            title="Santé des projets"
            subtitle="Avancement vs. plan, vélocité, alertes"
          >
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line))]">
              <table className="w-full text-[12.5px]">
                <thead className="bg-[hsl(var(--bg-sunken)/0.4)] text-[hsl(var(--ink-3))]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.14em]">
                      Projet
                    </th>
                    <th className="px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.14em]">
                      Avancement
                    </th>
                    <th className="px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.14em]">
                      Livré
                    </th>
                    <th className="px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.14em]">
                      Vélocité
                    </th>
                    <th className="px-3 py-2 text-right text-[10.5px] font-semibold uppercase tracking-[0.14em]">
                      Santé
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {health.map((h, i) => (
                    <tr
                      key={h.project.id}
                      className={cn(
                        i < health.length - 1 && "border-b border-[hsl(var(--line))]",
                        "hover:bg-[hsl(var(--bg-sunken)/0.4)]",
                      )}
                    >
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => routerService.toProject(h.project.id)}
                          className="flex items-center gap-2 text-left"
                        >
                          <span
                            className="h-2 w-2 rounded-[3px]"
                            style={{ background: h.project.color }}
                          />
                          <span className="font-medium tracking-tight">
                            {h.project.name}
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[hsl(var(--bg-sunken))]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${h.progress}%`,
                                background: h.project.color,
                              }}
                            />
                          </div>
                          <span className="font-mono text-[11px] tabular text-[hsl(var(--ink-2))] w-9 text-right">
                            {h.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono tabular text-[hsl(var(--ink-2))]">
                        {h.delivered} pts
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 font-mono tabular text-[11.5px] font-semibold",
                            h.velocity >= 0
                              ? "text-[hsl(var(--accent-sage))]"
                              : "text-[hsl(var(--accent-rose))]",
                          )}
                        >
                          {h.velocity >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {h.velocity > 0 ? "+" : ""}
                          {h.velocity} pts
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Badge tone={h.health === "good" ? "sage" : "apricot"}>
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              h.health === "good"
                                ? "bg-[hsl(var(--accent-sage))]"
                                : "bg-[hsl(var(--accent-apricot))]",
                            )}
                          />
                          {h.health === "good" ? "En piste" : "Attention"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </section>

        {/* AI insight */}
        <section className="mt-6">
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--brand)/0.18)] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)] grain">
            <div className="absolute inset-0 -z-0 bg-aurora opacity-90" />
            <div className="relative grid items-start gap-5 px-6 py-5 md:grid-cols-[auto_1fr_auto]">
              <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-gradient-to-br from-[hsl(var(--brand))] to-[#A78BFA] text-white shadow-[var(--shadow-brand)]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[hsl(var(--brand-ink))]">
                  Insight IA
                </div>
                <p className="mt-1 max-w-[680px] text-[13.5px] leading-relaxed text-[hsl(var(--ink-2))]">
                  Le sprint 20 affiche un retard de{" "}
                  <span className="font-semibold text-ink">8 points</span>, principalement
                  sur le module{" "}
                  <span className="font-serif italic text-ink">authentification</span>.
                  La revue de PR <span className="font-mono text-[12px]">AM-107</span>{" "}
                  bloque deux autres tâches. Envisagez de paralléliser la revue ou de
                  déplacer <span className="font-mono text-[12px]">AM-103</span> au sprint
                  suivant.
                </p>
              </div>
              <button
                type="button"
                onClick={() => routerService.toAiAssistant()}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[hsl(var(--brand))] px-3 py-2 text-[12.5px] font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-[hsl(var(--brand-ink))]"
              >
                Approfondir
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

/* ---------- helpers ---------- */

function KPI({
  label, value, unit, delta, positive, Icon, tone, spark,
}: {
  label: string;
  value: string;
  unit: string;
  delta: string;
  positive?: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "brand" | "sage" | "apricot" | "rose";
  spark: number[];
}) {
  const toneMap: Record<string, { bg: string; fg: string; spark: string }> = {
    brand:   { bg: "bg-[hsl(var(--brand-soft))]", fg: "text-[hsl(var(--brand-ink))]", spark: "hsl(239,84%,67%)" },
    sage:    { bg: "bg-[hsl(152_50%_92%)]",       fg: "text-[hsl(var(--accent-sage))]", spark: "hsl(152,35%,42%)" },
    apricot: { bg: "bg-[hsl(23_92%_94%)]",        fg: "text-[hsl(22_78%_42%)]",         spark: "hsl(23,92%,55%)" },
    rose:    { bg: "bg-[hsl(348_78%_96%)]",       fg: "text-[hsl(var(--accent-rose))]", spark: "hsl(348,78%,58%)" },
  };
  const t = toneMap[tone];
  return (
    <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-5 shadow-[var(--shadow-1)]">
      <div className="flex items-center justify-between">
        <span className={cn("grid h-9 w-9 place-items-center rounded-[10px]", t.bg, t.fg)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold",
            positive
              ? "bg-[hsl(152_50%_92%)] text-[hsl(var(--accent-sage))]"
              : "bg-[hsl(348_78%_96%)] text-[hsl(var(--accent-rose))]",
          )}
        >
          {positive ? (
            <ArrowUpRight className="h-2.5 w-2.5" />
          ) : (
            <ArrowDownRight className="h-2.5 w-2.5" />
          )}
          {delta}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="font-display text-[30px] font-semibold leading-none tabular tracking-tight">
            {value}
            <span className="ml-1 text-[12px] font-normal text-[hsl(var(--ink-3))]">
              {unit}
            </span>
          </div>
          <div className="mt-2 text-[12px] font-medium text-[hsl(var(--ink-2))]">
            {label}
          </div>
        </div>
        <div className={cn("opacity-90", t.fg)}>
          <Sparkline data={spark} color={t.spark} width={70} height={28} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[hsl(var(--line))]">
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-semibold tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">{subtitle}</p>
          )}
        </div>
        {badge}
      </header>
      <div className="p-3">{children}</div>
    </div>
  );
}

function Legend({
  items,
}: {
  items: { color: string; label: string; dashed?: boolean }[];
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 px-3 pb-1 text-[11.5px] text-[hsl(var(--ink-3))]">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          {it.dashed ? (
            <span
              className="inline-block h-px w-5"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, ${it.color}, ${it.color} 3px, transparent 3px, transparent 6px)`,
              }}
            />
          ) : (
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: it.color }}
            />
          )}
          {it.label}
        </span>
      ))}
    </div>
  );
}

function Mini({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-3 py-2">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
        {label}
      </div>
      <div className="mt-0.5 font-display text-[15px] font-semibold tabular tracking-tight">
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-[10px] text-[hsl(var(--ink-4))]">{hint}</div>
      )}
    </div>
  );
}
