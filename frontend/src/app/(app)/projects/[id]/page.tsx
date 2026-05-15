"use client";
import { use } from "react";
import { Calendar as CalIcon, Hash, Palette } from "lucide-react";
import { Github } from "@/components/icons/github";
import { useProject, useProjectTasks } from "@/services";
import { colorForProject, prefixForProject, normalizeApiStatus } from "@/lib/mappers";
import { shortDate } from "@/lib/utils";

export default function ProjectOverview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { project } = useProject(id);
  const { tasks } = useProjectTasks(id);

  if (!project) return null;

  const total = tasks.length;
  const done = tasks.filter((t) => normalizeApiStatus(t.status) === "termine").length;
  const active = tasks.filter((t) => normalizeApiStatus(t.status) === "en_cours").length;
  const review = tasks.filter((t) => normalizeApiStatus(t.status) === "en_revue").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const color = colorForProject(project.id);
  const prefix = prefixForProject(project.name);

  return (
    <main className="px-8 py-7">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-5 shadow-[var(--shadow-1)]">
          <h2 className="font-display text-[16px] font-semibold tracking-tight">
            Statistiques
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total tâches" value={total} />
            <Stat
              label="Terminées"
              value={done}
              hint={total ? `${Math.round((done / total) * 100)}%` : "0%"}
              tone="sage"
            />
            <Stat label="Actives" value={active} tone="apricot" />
            <Stat label="En revue" value={review} tone="brand" />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-[11.5px] text-[hsl(var(--ink-3))]">
              <span>Progression</span>
              <span className="font-mono">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--bg-sunken))]">
              <div
                className="h-full rounded-full bg-[hsl(var(--brand))]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-5 shadow-[var(--shadow-1)]">
          <h2 className="font-display text-[16px] font-semibold tracking-tight">
            Informations
          </h2>
          <ul className="mt-3 space-y-2.5 text-[13px]">
            <InfoRow Icon={CalIcon} label="Créé le" value={shortDate(project.createdAt)} />
            {project.githubRepo && (
              <InfoRow Icon={Github} label="Dépôt" value={project.githubRepo} mono />
            )}
            <InfoRow Icon={Hash} label="Préfixe" value={`${prefix}-`} mono />
            <InfoRow
              Icon={Palette}
              label="Couleur"
              value={
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded" style={{ background: color }} />
                  <span className="font-mono">{color}</span>
                </span>
              }
            />
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-5">
        <h2 className="font-display text-[16px] font-semibold tracking-tight">
          Description
        </h2>
        <p className="mt-2 max-w-[68ch] text-[13.5px] leading-relaxed text-[hsl(var(--ink-2))]">
          {project.description ?? "—"}
        </p>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "sage" | "apricot" | "brand" | "rose";
}) {
  const toneMap = {
    sage: "border-l-[hsl(var(--accent-sage))]",
    apricot: "border-l-[hsl(var(--accent-apricot))]",
    brand: "border-l-[hsl(var(--brand))]",
    rose: "border-l-[hsl(var(--accent-rose))]",
  } as const;
  return (
    <div
      className={`rounded-[var(--radius-sm)] border border-[hsl(var(--line))] border-l-4 bg-[hsl(var(--bg-sunken)/0.4)] px-3 py-2.5 ${tone ? toneMap[tone] : ""}`}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-[24px] font-semibold tabular">{value}</span>
        {hint && (
          <span className="text-[11px] text-[hsl(var(--ink-3))] tabular">({hint})</span>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  Icon,
  label,
  value,
  mono,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[hsl(var(--bg-sunken)/0.5)]">
      <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-2))]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="text-[hsl(var(--ink-3))]">{label}</span>
      <span className={`ml-auto ${mono ? "font-mono text-[12px]" : ""} font-medium`}>
        {value}
      </span>
    </li>
  );
}
