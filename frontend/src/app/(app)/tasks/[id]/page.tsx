"use client";
import { use } from "react";
import { X, GitBranch, Calendar as CalIcon, User, Tag, Link as LinkIcon, Sparkles, Loader2 } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PriorityPill, StatusPill } from "@/components/ui/pill";
import { routerService, useTask } from "@/services";
import { normalizeApiStatus, normalizeApiPriority } from "@/lib/mappers";
import { shortDate } from "@/lib/utils";

export default function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { task, loading, error } = useTask(id);

  if (loading) {
    return (
      <>
        <Topbar breadcrumb={<Breadcrumb items={[{ label: "Tâche" }]} />} />
        <div className="grid min-h-[40vh] place-items-center">
          <div className="flex items-center gap-2 text-[13px] text-[hsl(var(--ink-3))]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        </div>
      </>
    );
  }

  if (error || !task) {
    return (
      <>
        <Topbar breadcrumb={<Breadcrumb items={[{ label: "Tâche" }]} />} />
        <div className="px-8 py-10">
          <div className="rounded-[var(--radius-md)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-4 py-3 text-[13px] text-[hsl(var(--accent-rose))]">
            Tâche introuvable.
          </div>
        </div>
      </>
    );
  }

  const status = normalizeApiStatus(task.status);
  const priority = normalizeApiPriority(task.priority);
  const code = task.identifier ?? task.id.slice(0, 8);
  const branchName = task.githubBranch ?? task.branch ?? null;
  const branchUrl = task.githubBranchUrl ?? null;
  const overdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;
  const projectId = task.projectId;

  return (
    <>
      <Topbar
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Projets", href: "/projects" },
              ...(projectId
                ? [{ label: "Projet", href: `/projects/${projectId}` }]
                : []),
              { label: code },
            ]}
          />
        }
      />

      <main className="flex-1 px-8 py-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <article className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
            <header className="flex items-center gap-3 px-6 pt-5 pb-3">
              <span className="font-mono text-[12px] font-semibold tracking-wider text-[hsl(var(--ink-3))]">
                {code}
              </span>
              <StatusPill status={status} />
              {projectId && (
                <button
                  type="button"
                  onClick={() => routerService.toProjectBoard(projectId)}
                  className="ml-auto grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </header>

            <div className="px-6 pb-5">
              <h1 className="font-display text-[24px] font-semibold leading-tight tracking-tight">
                {task.title}
              </h1>
              {task.description && (
                <p className="mt-3 text-[14px] leading-relaxed text-[hsl(var(--ink-2))]">
                  {task.description}
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] p-4 text-[13px]">
                <Meta Icon={User} label="Assigné">
                  {task.assigneeId ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar id={task.assigneeId} name={task.assigneeId.slice(0, 2)} size="xs" />
                      <span className="font-mono text-[11px]">{task.assigneeId.slice(0, 8)}…</span>
                    </span>
                  ) : (
                    <span className="text-[hsl(var(--ink-3))]">—</span>
                  )}
                </Meta>
                <Meta Icon={Sparkles} label="Priorité">
                  <PriorityPill priority={priority} />
                </Meta>
                <Meta Icon={CalIcon} label="Échéance">
                  <span
                    className={
                      overdue ? "font-medium text-[hsl(var(--accent-rose))]" : "font-medium"
                    }
                  >
                    {task.dueDate ? shortDate(task.dueDate) : "—"}
                    {overdue && (
                      <Badge tone="rose" className="ml-2 !text-[10px]">
                        en retard
                      </Badge>
                    )}
                  </span>
                </Meta>
                <Meta Icon={Tag} label="Labels">
                  {task.labels && task.labels.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {task.labels.map((l) => (
                        <Badge key={l} tone={l === "critical" ? "rose" : "neutral"}>
                          {l}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[hsl(var(--ink-3))]">—</span>
                  )}
                </Meta>
                {branchName && (
                  <Meta Icon={GitBranch} label="Branche">
                    {branchUrl ? (
                      <a
                        href={branchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[12px] text-[hsl(var(--brand-ink))] underline-offset-2 hover:underline"
                      >
                        {branchName}
                      </a>
                    ) : (
                      <span className="font-mono text-[12px]">{branchName}</span>
                    )}
                  </Meta>
                )}
                {task.storyId && (
                  <Meta Icon={LinkIcon} label="Story liée">
                    <span className="font-mono text-[11px]">{task.storyId.slice(0, 8)}…</span>
                  </Meta>
                )}
              </div>
            </div>
          </article>

          <aside className="overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)] p-6">
            <h3 className="font-display text-[14px] font-semibold tracking-tight">
              Activité
            </h3>
            <p className="mt-2 text-[12.5px] text-[hsl(var(--ink-3))]">
              L&apos;historique d&apos;activité n&apos;est pas encore disponible.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}

function Meta({
  Icon,
  label,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-md bg-[hsl(var(--bg-elevated))] text-[hsl(var(--ink-3))] ring-1 ring-[hsl(var(--line))]">
        <Icon className="h-3 w-3" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))] font-semibold">
          {label}
        </div>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}
