"use client";
import { use } from "react";
import { Loader2, MoreHorizontal } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github } from "@/components/icons/github";
import { useProject } from "@/services";
import { colorForProject, projectPrefix } from "@/lib/mappers";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { project, loading, error } = useProject(id);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="flex items-center gap-2 text-[13px] text-[hsl(var(--ink-3))]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement du projet…
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="px-8 py-10">
        <div className="rounded-[var(--radius-md)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(348_78%_97%)] px-4 py-3 text-[13px] text-[hsl(var(--accent-rose))]">
          Projet introuvable.
        </div>
      </div>
    );
  }

  const color = colorForProject(project.id);
  const prefix = projectPrefix(project);

  return (
    <>
      <Topbar
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Projets", href: "/projects" },
              { label: project.name },
            ]}
          />
        }
      />
      <div className="border-b border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))]">
        <div className="px-8 pt-6 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span
                className="grid h-14 w-14 place-items-center rounded-[12px] text-white font-mono text-[13px] font-bold shadow-[inset_0_-2px_4px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.25)]"
                style={{ background: color }}
              >
                {prefix}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-[22px] font-semibold tracking-tight">
                    {project.name}
                  </h1>
                  <Badge tone="neutral">
                    <span className="font-mono text-[10px]">{prefix}-</span>
                  </Badge>
                </div>
                <p className="mt-1 max-w-[680px] text-[13.5px] text-[hsl(var(--ink-3))]">
                  {project.description ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(project.githubRepoUrl ||
                (project.githubOwner && project.githubRepo)) && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={
                      project.githubRepoUrl ||
                      `https://github.com/${project.githubOwner}/${project.githubRepo}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-3.5 w-3.5" />
                    {project.githubOwner && project.githubRepo
                      ? `${project.githubOwner}/${project.githubRepo}`
                      : "Dépôt GitHub"}
                  </a>
                </Button>
              )}
              <button className="grid h-9 w-9 place-items-center rounded-[8px] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-muted))]">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="px-6">
          <ProjectTabs projectId={project.id} />
        </div>
      </div>
      {children}
    </>
  );
}
