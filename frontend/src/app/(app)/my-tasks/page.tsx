"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Filter, SortDesc, MoreHorizontal, Loader2 } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill, PriorityPill } from "@/components/ui/pill";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { projectsApi, useAuth, useProjects } from "@/services";
import type { Task } from "@/services";
import {
  normalizeApiPriority,
  normalizeApiStatus,
  taskCode,
  colorForProject,
} from "@/lib/mappers";
import { shortDate, cn } from "@/lib/utils";

type ProjectTask = Task & { _projectName: string; _projectId: string };

export default function MyTasksPage() {
  const { user } = useAuth();
  const { projects } = useProjects();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (projects.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      projects.map((p) =>
        projectsApi
          .listTasks(p.id)
          .then((r) =>
            r.tasks.map((t) => ({
              ...t,
              _projectName: p.name,
              _projectId: p.id,
            })),
          )
          .catch(() => [] as ProjectTask[]),
      ),
    )
      .then((all) => setTasks(all.flat()))
      .finally(() => setLoading(false));
  }, [projects]);

  const list = useMemo(() => {
    let arr = tasks.filter((t) => !user || t.assigneeId === user.id);
    if (arr.length === 0 && tasks.length > 0) arr = tasks;
    if (filter === "active")
      arr = arr.filter(
        (t) => !["done", "termine"].includes(normalizeApiStatus(t.status)),
      );
    if (filter === "done")
      arr = arr.filter((t) => normalizeApiStatus(t.status) === "termine");
    return arr;
  }, [tasks, user, filter]);

  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Mes tâches" }]} />} />
      <main className="flex-1 px-8 py-7">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-tight">
              Mes tâches
            </h1>
            <p className="mt-1 text-[13px] text-[hsl(var(--ink-3))]">
              Tout ce qui vous concerne, du backlog au sprint en cours.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[hsl(var(--line))] px-4 py-3">
            <div className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[hsl(var(--bg-sunken)/0.7)] p-0.5">
              {(["all", "active", "done"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={cn(
                    "h-7 rounded-[6px] px-3 text-[12px] font-medium",
                    filter === v
                      ? "bg-[hsl(var(--bg-elevated))] text-ink shadow-[var(--shadow-1)]"
                      : "text-[hsl(var(--ink-3))]",
                  )}
                >
                  {v === "all"
                    ? "Toutes les tâches"
                    : v === "active"
                      ? "Actives"
                      : "Terminées"}
                </button>
              ))}
            </div>
            <button className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-2.5 text-[12px] font-medium hover:bg-[hsl(var(--bg-muted))]">
              <Filter className="h-3.5 w-3.5" />
              Filtre
            </button>
            <button className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-2.5 text-[12px] font-medium hover:bg-[hsl(var(--bg-muted))]">
              <SortDesc className="h-3.5 w-3.5" />
              Trier
            </button>
          </div>

          <div className="grid grid-cols-[1.5fr_1fr_120px_120px_120px_40px] items-center gap-2 border-b border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            <span>Tâche</span>
            <span>Projet</span>
            <span>Statut</span>
            <span>Priorité</span>
            <span>Échéance</span>
            <span />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[hsl(var(--ink-3))]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[hsl(var(--ink-3))]">
              Aucune tâche.
            </div>
          ) : (
            <ul>
              {list.map((t, i) => {
                const status = normalizeApiStatus(t.status);
                const priority = normalizeApiPriority(t.priority);
                return (
                  <li
                    key={t.id}
                    className={cn(
                      "grid grid-cols-[1.5fr_1fr_120px_120px_120px_40px] items-center gap-2 px-4 py-3 hover:bg-[hsl(var(--bg-sunken)/0.4)]",
                      i < list.length - 1 && "border-b border-[hsl(var(--line))]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenTaskId(t.id)}
                      className="flex items-center gap-3 min-w-0 text-left"
                    >
                      <span className="font-mono text-[10.5px] font-semibold tracking-wider text-[hsl(var(--ink-3))] shrink-0 w-[58px]">
                        {taskCode("AM", t.id)}
                      </span>
                      <span className="truncate text-[13px] font-medium tracking-tight">
                        {t.title}
                      </span>
                    </button>
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 rounded-[3px] shrink-0"
                        style={{ background: colorForProject(t._projectId) }}
                      />
                      <Link
                        href={`/projects/${t._projectId}`}
                        className="truncate text-[12.5px] text-[hsl(var(--ink-2))] hover:underline"
                      >
                        {t._projectName}
                      </Link>
                    </div>
                    <div>
                      <StatusPill status={status} />
                    </div>
                    <div>
                      <PriorityPill priority={priority} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] tabular text-[hsl(var(--ink-2))]">
                        {t.dueDate ? shortDate(t.dueDate) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      {t.assigneeId && (
                        <Avatar
                          id={t.assigneeId}
                          name={t.assigneeId.slice(0, 2)}
                          size="xs"
                        />
                      )}
                      <button className="grid h-7 w-7 place-items-center rounded text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.5)] px-4 py-2.5 text-[11.5px] text-[hsl(var(--ink-3))]">
            <span>
              {list.length} tâche{list.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </main>

      <TaskDetailDialog taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </>
  );
}
