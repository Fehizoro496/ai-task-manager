"use client";
import { FolderKanban, Loader2 } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { NewProjectButton } from "@/components/projects/new-project-modal";
import { routerService, useProjects } from "@/services";
import { colorForProject, projectPrefix } from "@/lib/mappers";

export default function ProjectsPage() {
  const { projects, loading, error } = useProjects();

  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Projets" }]} />} />
      <main className="flex-1 px-8 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[28px] font-semibold tracking-tight">
              Projets
            </h1>
            <p className="mt-1 text-[13.5px] text-[hsl(var(--ink-3))]">
              Vos espaces de travail. Chacun avec son backlog, son board et son IA.
            </p>
          </div>
          <NewProjectButton />
        </div>

        {loading ? (
          <div className="mt-12 flex items-center justify-center gap-2 text-[13px] text-[hsl(var(--ink-3))]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des projets…
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[var(--radius-md)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-4 py-3 text-[13px] text-[hsl(var(--accent-rose))]">
            Erreur : {error.message}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-12 grid place-items-center rounded-[var(--radius-lg)] border border-dashed border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-3))]">
              <FolderKanban className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-display text-[16px] font-semibold tracking-tight">
              Aucun projet pour l&apos;instant
            </h3>
            <p className="mt-1 max-w-[320px] text-[12.5px] text-[hsl(var(--ink-3))]">
              Créez votre premier projet pour démarrer la planification.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => {
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
                      className="grid h-10 w-10 place-items-center rounded-[10px] text-white font-mono text-[11px] font-bold shadow-[inset_0_-2px_4px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.25)]"
                      style={{ background: color }}
                    >
                      {prefix}
                    </span>
                    {p.githubRepo && (
                      <span className="text-[11px] font-medium text-[hsl(var(--ink-3))] truncate">
                        {p.githubRepo}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 font-display text-[16.5px] font-semibold tracking-tight">
                    {p.name}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12.5px] text-[hsl(var(--ink-3))]">
                    {p.description ?? "—"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
