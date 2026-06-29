"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  SortDesc,
  MoreHorizontal,
  Loader2,
  Plus,
  Search,
  X,
  Check,
} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill, PriorityPill } from "@/components/ui/pill";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { Button } from "@/components/ui/button";
import { FilterPopover } from "@/components/ui/filter-popover";
import { projectsApi, routerService, useAuth, useProjects } from "@/services";
import type { Task, TaskPriority } from "@/services";
import {
  normalizeApiPriority,
  normalizeApiStatus,
  colorForProject,
} from "@/lib/mappers";
import { shortDate, cn } from "@/lib/utils";

type ProjectTask = Task & { _projectName: string; _projectId: string };
type SortMode = "due_asc" | "due_desc" | "priority" | "recent";

const PRIORITY_OPTIONS: readonly { value: TaskPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "Élevée" },
  { value: "medium", label: "Moyenne" },
  { value: "low", label: "Faible" },
];

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SORT_OPTIONS: { v: SortMode; label: string }[] = [
  { v: "due_asc", label: "Échéance (proche → loin)" },
  { v: "due_desc", label: "Échéance (loin → proche)" },
  { v: "priority", label: "Priorité (urgent → faible)" },
  { v: "recent", label: "Récemment créées" },
];

export default function MyTasksPage() {
  const { user } = useAuth();
  const { projects } = useProjects();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Set<TaskPriority>>(
    new Set(),
  );
  const [projectFilter, setProjectFilter] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>("due_asc");

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
  }, [projects, refreshTick]);

  const projectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of tasks) {
      if (!seen.has(t._projectId)) seen.set(t._projectId, t._projectName);
    }
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [tasks]);

  const list = useMemo(() => {
    let arr = tasks.filter((t) => !user || t.assigneeId === user.id);
    if (arr.length === 0 && tasks.length > 0) arr = tasks;

    if (filter === "active")
      arr = arr.filter(
        (t) => !["done", "termine"].includes(normalizeApiStatus(t.status)),
      );
    if (filter === "done")
      arr = arr.filter((t) => normalizeApiStatus(t.status) === "termine");

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter((t) => {
        const hay = `${t.title} ${t.identifier ?? ""} ${t._projectName}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (priorityFilter.size > 0) {
      arr = arr.filter((t) => {
        const p = (t.priority ?? "medium") as TaskPriority;
        return priorityFilter.has(p);
      });
    }
    if (projectFilter.size > 0) {
      arr = arr.filter((t) => projectFilter.has(t._projectId));
    }

    const sorted = [...arr];
    sorted.sort((a, b) => {
      if (sortMode === "priority") {
        return (
          PRIORITY_RANK[(a.priority ?? "medium") as TaskPriority] -
          PRIORITY_RANK[(b.priority ?? "medium") as TaskPriority]
        );
      }
      if (sortMode === "recent") {
        return 0; // ordre du backend (insertion)
      }
      // due dates : null en dernier
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return sortMode === "due_asc" ? da - db : db - da;
    });
    return sorted;
  }, [tasks, user, filter, query, priorityFilter, projectFilter, sortMode]);

  const activeFilterCount =
    (query.trim() ? 1 : 0) + priorityFilter.size + projectFilter.size;

  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Mes tâches" }]} />} />
      <main className="flex-1 px-8 py-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-tight">
              Mes tâches
            </h1>
            <p className="mt-1 text-[13px] text-[hsl(var(--ink-3))]">
              Tout ce qui vous concerne, du backlog au sprint en cours.
            </p>
          </div>
          {/* <Button
            variant="brand"
            size="md"
            onClick={() => setNewTaskOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nouvelle tâche
          </Button> */}
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

            <div className="relative ml-auto">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--ink-3))]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="h-8 w-[220px] rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] pl-8 pr-7 text-[12.5px] placeholder:text-[hsl(var(--ink-4))] focus:border-[hsl(var(--brand)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.3)]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-sunken)/0.7)]"
                  aria-label="Effacer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <FilterPopover<TaskPriority>
              title="Priorité"
              options={PRIORITY_OPTIONS}
              selected={priorityFilter}
              onChange={(s) => setPriorityFilter(s)}
              trigger={
                <button
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 text-[12px] font-medium",
                    priorityFilter.size > 0
                      ? "border-[hsl(var(--brand)/0.5)] bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]"
                      : "border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-muted))]",
                  )}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Priorité
                  {priorityFilter.size > 0 && (
                    <span className="rounded-full bg-[hsl(var(--brand))] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {priorityFilter.size}
                    </span>
                  )}
                </button>
              }
            />

            <FilterPopover<string>
              title="Projet"
              options={projectOptions}
              selected={projectFilter}
              onChange={(s) => setProjectFilter(s)}
              emptyLabel="Aucun projet"
              trigger={
                <button
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 text-[12px] font-medium",
                    projectFilter.size > 0
                      ? "border-[hsl(var(--brand)/0.5)] bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]"
                      : "border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-muted))]",
                  )}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Projet
                  {projectFilter.size > 0 && (
                    <span className="rounded-full bg-[hsl(var(--brand))] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {projectFilter.size}
                    </span>
                  )}
                </button>
              }
            />

            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-2.5 text-[12px] font-medium hover:bg-[hsl(var(--bg-muted))]">
                  <SortDesc className="h-3.5 w-3.5" />
                  Trier
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={6}
                  className="z-40 w-[240px] overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] outline-none"
                >
                  <header className="border-b border-[hsl(var(--line))] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
                    Trier par
                  </header>
                  <ul className="py-1">
                    {SORT_OPTIONS.map((opt) => (
                      <li key={opt.v}>
                        <button
                          onClick={() => setSortMode(opt.v)}
                          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12.5px] hover:bg-[hsl(var(--bg-sunken)/0.6)]"
                        >
                          <span
                            className={cn(
                              "grid h-4 w-4 place-items-center rounded-full border",
                              sortMode === opt.v
                                ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white"
                                : "border-[hsl(var(--line-strong))]",
                            )}
                          >
                            {sortMode === opt.v && (
                              <Check className="h-2.5 w-2.5" strokeWidth={3} />
                            )}
                          </span>
                          <span className="flex-1">{opt.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setQuery("");
                  setPriorityFilter(new Set());
                  setProjectFilter(new Set());
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 text-[12px] font-medium text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-sunken)/0.7)] hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
            )}
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
                        {t.identifier ?? "—"}
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
                      <button
                        type="button"
                        onClick={() => routerService.toProject(t._projectId)}
                        className="truncate text-[12.5px] text-[hsl(var(--ink-2))] hover:underline"
                      >
                        {t._projectName}
                      </button>
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
                          name={t.assignee?.name ?? t.assigneeId}
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

      <TaskDetailDialog
        taskId={openTaskId}
        onClose={() => setOpenTaskId(null)}
        onUpdated={() => setRefreshTick((n) => n + 1)}
        onDeleted={() => setRefreshTick((n) => n + 1)}
      />
      <NewTaskDialog
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onCreated={() => setRefreshTick((n) => n + 1)}
      />
    </>
  );
}
