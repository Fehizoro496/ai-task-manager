"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Flag,
  Loader2,
  X,
  MessageSquare,
} from "lucide-react";
import { statusLabel, statusToken } from "@/lib/labels";
import {
  normalizeApiPriority,
  normalizeApiStatus,
  statusFrToApi,
} from "@/lib/mappers";
import { Avatar } from "@/components/ui/avatar";
import { PriorityPill } from "@/components/ui/pill";
import { Badge } from "@/components/ui/badge";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { FilterPopover } from "@/components/ui/filter-popover";
import { projectsApi, toast, useProjectTasks } from "@/services";
import type { TaskPriority, TaskStatus } from "@/services";
import type { Task as ApiTask } from "@/services";
import type { Status } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLUMNS: Status[] = ["a_faire", "en_cours", "en_revue", "termine"];

const PRIORITY_OPTIONS: readonly { value: TaskPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "Élevée" },
  { value: "medium", label: "Moyenne" },
  { value: "low", label: "Faible" },
];

const COLUMN_DOT: Record<Status, string> = {
  a_faire: "bg-[hsl(var(--ink-3))]",
  en_cours: "bg-[hsl(var(--accent-amber))]",
  en_revue: "bg-[hsl(var(--brand))]",
  termine: "bg-[hsl(var(--accent-sage))]",
};

const COLUMN_BG: Record<Status, string> = {
  a_faire: "bg-[hsl(var(--col-todo))]",
  en_cours: "bg-[hsl(var(--col-doing))]",
  en_revue: "bg-[hsl(var(--col-review))]",
  termine: "bg-[hsl(var(--col-done))]",
};

const dropAnimation: DropAnimation = {
  duration: 180,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0" } },
  }),
};

const isColumnId = (id: string): id is Status =>
  (COLUMNS as string[]).includes(id);

interface KanbanBoardProps {
  projectId: string;
  projectPrefix: string;
}

export function KanbanBoard({ projectId, projectPrefix: prefix }: KanbanBoardProps) {
  const { tasks, loading, refetch, applyUpdate } = useProjectTasks(projectId);
  // Liste locale pour les rearrangements optimistes inter-colonnes pendant
  // le drag, avant la confirmation API au drop.
  const [localTasks, setLocalTasks] = useState<ApiTask[] | null>(null);
  const visibleTasks = localTasks ?? tasks;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Deep-link : ?task=<id> ouvre directement le dialog (ex: depuis une
  // notification de commentaire).
  useEffect(() => {
    const t = searchParams.get("task");
    if (t) setOpenTaskId(t);
  }, [searchParams]);
  const [createForStatus, setCreateForStatus] = useState<Status | null>(null);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Set<TaskPriority>>(
    new Set(),
  );
  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Liste des assignés présents dans les tâches (pour l'option du filtre)
  const assigneeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of tasks) {
      if (t.assigneeId && !seen.has(t.assigneeId)) {
        seen.set(
          t.assigneeId,
          t.assignee?.name ?? t.assigneeId.slice(0, 8),
        );
      }
    }
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleTasks.filter((t) => {
      if (q) {
        const haystack = `${t.title} ${t.identifier ?? ""} ${
          t.description ?? ""
        }`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (priorityFilter.size > 0) {
        const p = (t.priority ?? "medium") as TaskPriority;
        if (!priorityFilter.has(p)) return false;
      }
      if (assigneeFilter.size > 0) {
        if (!t.assigneeId || !assigneeFilter.has(t.assigneeId)) return false;
      }
      return true;
    });
  }, [visibleTasks, query, priorityFilter, assigneeFilter]);

  const grouped = useMemo(() => {
    const map: Record<Status, ApiTask[]> = {
      a_faire: [],
      en_cours: [],
      en_revue: [],
      termine: [],
    };
    for (const t of filteredTasks) {
      map[normalizeApiStatus(t.status)].push(t);
    }
    return map;
  }, [filteredTasks]);

  const activeFiltersCount =
    (query.trim() ? 1 : 0) + priorityFilter.size + assigneeFilter.size;

  const activeTask = visibleTasks.find((t) => t.id === activeId) || null;

  const columnOf = (id: string): Status | null => {
    if (isColumnId(id)) return id;
    const t = visibleTasks.find((tk) => tk.id === id);
    return t ? normalizeApiStatus(t.status) : null;
  };

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setLocalTasks([...tasks]);
  }

  // Rearrange en direct quand le pointer survole une autre colonne ou
  // une autre carte → preview WYSIWYG.
  function onDragOver(e: DragOverEvent) {
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || activeIdStr === overId) return;

    const overColumn = isColumnId(overId)
      ? overId
      : columnOf(overId);
    if (!overColumn) return;

    setLocalTasks((curr) => {
      if (!curr) return curr;
      const activeIdx = curr.findIndex((t) => t.id === activeIdStr);
      if (activeIdx === -1) return curr;
      const activeTask = curr[activeIdx];
      const activeColumn = normalizeApiStatus(activeTask.status);

      // Meme colonne + survol d'une carte : laisser onDragEnd faire le reorder
      if (activeColumn === overColumn && !isColumnId(overId)) return curr;

      const next = [...curr];
      next.splice(activeIdx, 1);
      const updated: ApiTask = {
        ...activeTask,
        status: statusFrToApi[overColumn],
      };

      if (isColumnId(overId)) {
        // Drop en fin de colonne cible
        let lastIdx = -1;
        next.forEach((t, i) => {
          if (normalizeApiStatus(t.status) === overColumn) lastIdx = i;
        });
        next.splice(lastIdx + 1, 0, updated);
      } else {
        const overIdx = next.findIndex((t) => t.id === overId);
        next.splice(overIdx, 0, updated);
      }
      return next;
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    setActiveId(null);

    if (!overId || !localTasks) {
      setLocalTasks(null);
      return;
    }

    let finalTasks = [...localTasks];

    const activeIdx = finalTasks.findIndex((t) => t.id === activeIdStr);
    if (activeIdx === -1) {
      setLocalTasks(null);
      return;
    }

    const targetColumn = columnOf(overId);
    if (!targetColumn) {
      setLocalTasks(null);
      return;
    }

    // Si on survole une carte différente de la meme colonne, applique le swap
    if (!isColumnId(overId) && activeIdStr !== overId) {
      const overIdx = finalTasks.findIndex((t) => t.id === overId);
      if (overIdx !== -1 && activeIdx !== overIdx) {
        finalTasks = arrayMove(finalTasks, activeIdx, overIdx);
      }
    }

    // Détermine les colonnes affectées (source + cible)
    const original = tasks.find((t) => t.id === activeIdStr);
    const originalStatus = original ? normalizeApiStatus(original.status) : null;
    const affectedColumns = new Set<Status>();
    affectedColumns.add(targetColumn);
    if (originalStatus) affectedColumns.add(originalStatus);

    setLocalTasks(finalTasks);

    // Si aucune modification d'ordre, skip
    const sameOrder =
      originalStatus === targetColumn &&
      JSON.stringify(
        tasks
          .filter((t) => normalizeApiStatus(t.status) === targetColumn)
          .map((t) => t.id),
      ) ===
        JSON.stringify(
          finalTasks
            .filter((t) => normalizeApiStatus(t.status) === targetColumn)
            .map((t) => t.id),
        );
    if (sameOrder) {
      setLocalTasks(null);
      return;
    }

    // Construit le payload bulk : pour chaque colonne touchée, la liste
    // ordonnée des IDs présents dans finalTasks.
    const columns: Partial<Record<TaskStatus, string[]>> = {};
    for (const col of affectedColumns) {
      columns[statusFrToApi[col]] = finalTasks
        .filter((t) => normalizeApiStatus(t.status) === col)
        .map((t) => t.id);
    }

    try {
      await projectsApi.reorderTasks(projectId, columns);
      await refetch();
    } catch (err) {
      console.error("Failed to reorder tasks", err);
      const message =
        err instanceof Error ? err.message : "Déplacement impossible.";
      toast.error(message, "Déplacement refusé");
    } finally {
      setLocalTasks(null);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="px-6 py-4 border-b border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--ink-3))]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une tâche…"
              className="h-9 w-[260px] rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] pl-8 pr-8 text-[13px] placeholder:text-[hsl(var(--ink-4))] focus:border-[hsl(var(--brand)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.3)]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Effacer"
                className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-sunken)/0.7)] hover:text-ink"
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
                  "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 text-[12.5px] font-medium",
                  priorityFilter.size > 0
                    ? "border-[hsl(var(--brand)/0.5)] bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]"
                    : "border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-muted))]",
                )}
              >
                <Flag className="h-3.5 w-3.5" />
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
            title="Assigné"
            options={assigneeOptions}
            selected={assigneeFilter}
            onChange={(s) => setAssigneeFilter(s)}
            emptyLabel="Aucune tâche assignée"
            trigger={
              <button
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 text-[12.5px] font-medium",
                  assigneeFilter.size > 0
                    ? "border-[hsl(var(--brand)/0.5)] bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]"
                    : "border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-muted))]",
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Assigné
                {assigneeFilter.size > 0 && (
                  <span className="rounded-full bg-[hsl(var(--brand))] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {assigneeFilter.size}
                  </span>
                )}
              </button>
            }
          />

          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setQuery("");
                setPriorityFilter(new Set());
                setAssigneeFilter(new Set());
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 text-[12px] font-medium text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-sunken)/0.7)] hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 py-20 text-[13px] text-[hsl(var(--ink-3))]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement du board…
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex min-w-max gap-3 p-6">
            {COLUMNS.map((col) => (
              <Column
                key={col}
                status={col}
                tasks={grouped[col]}
                prefix={prefix}
                accent={COLUMN_DOT[col]}
                bg={COLUMN_BG[col]}
                onOpenTask={setOpenTaskId}
                onAddTask={() => setCreateForStatus(col)}
              />
            ))}
          </div>
        </div>
      )}

      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask && <TaskCard task={activeTask} prefix={prefix} dragging />}
      </DragOverlay>

      <TaskDetailDialog
        taskId={openTaskId}
        onClose={() => setOpenTaskId(null)}
        onUpdated={(t) => applyUpdate(t)}
      />

      <NewTaskDialog
        open={createForStatus !== null}
        onClose={() => setCreateForStatus(null)}
        projectId={projectId}
        initialStatus={
          createForStatus ? statusFrToApi[createForStatus] : undefined
        }
        onCreated={() => refetch()}
      />
    </DndContext>
  );
}

function Column({
  status,
  tasks,
  prefix,
  accent,
  bg,
  onOpenTask,
  onAddTask,
}: {
  status: Status;
  tasks: ApiTask[];
  prefix: string;
  accent: string;
  bg: string;
  onOpenTask: (id: string) => void;
  onAddTask: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[300px] shrink-0 flex-col rounded-[var(--radius-lg)] border border-[hsl(var(--line))] transition-all duration-150",
        bg,
        isOver &&
          "ring-2 ring-[hsl(var(--brand)/0.5)] border-[hsl(var(--brand)/0.4)] shadow-[var(--shadow-2)]",
      )}
    >
      <header className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", accent)} />
          <h3 className="text-[12.5px] font-semibold tracking-tight">
            {statusLabel[status]}
          </h3>
          <span className="rounded-md bg-[hsl(var(--bg-elevated))] px-1.5 py-0.5 text-[10.5px] font-semibold tabular text-[hsl(var(--ink-2))] ring-1 ring-[hsl(var(--line))]">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          title="Ajouter une tâche"
          className="grid h-6 w-6 place-items-center rounded text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-elevated))] hover:text-ink"
        >
          <Plus className="h-3 w-3" />
        </button>
      </header>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2.5 px-2 pb-3 min-h-[40px]">
          {tasks.map((t) => (
            <SortableTaskCard
              key={t.id}
              task={t}
              prefix={prefix}
              onOpen={() => onOpenTask(t.id)}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableTaskCard({
  task,
  prefix,
  onOpen,
}: {
  task: ApiTask;
  prefix: string;
  onOpen: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "touch-none",
        isDragging && "opacity-0 pointer-events-none",
      )}
    >
      <TaskCard task={task} prefix={prefix} onOpen={onOpen} />
    </div>
  );
}

function TaskCard({
  task,
  prefix,
  dragging,
  onOpen,
}: {
  task: ApiTask;
  prefix: string;
  dragging?: boolean;
  onOpen?: () => void;
}) {
  const status = normalizeApiStatus(task.status);
  const priority = normalizeApiPriority(task.priority);
  const token = statusToken[status];
  const code = task.identifier ?? prefix;

  return (
    <button
      type="button"
      onClick={(e) => {
        if (dragging) {
          e.preventDefault();
          return;
        }
        onOpen?.();
      }}
      className={cn(
        "block w-full rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-3 text-left shadow-[var(--shadow-1)] transition-shadow hover:shadow-[var(--shadow-2)]",
        dragging &&
          "rotate-[1.5deg] cursor-grabbing shadow-[var(--shadow-3)] ring-2 ring-[hsl(var(--brand)/0.35)]",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] font-semibold tracking-wider text-[hsl(var(--ink-3))]">
          {code}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold",
            token.bg,
            token.fg,
          )}
        >
          <span className={cn("h-1 w-1 rounded-full", token.dot)} />
          {statusLabel[status]}
        </span>
      </div>
      <div className="mt-1.5 text-[13px] font-semibold leading-snug tracking-tight">
        {task.title}
      </div>
      {task.labels && task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 2).map((l) => (
            <Badge
              key={l}
              tone={l === "critical" ? "rose" : "neutral"}
              className="!text-[10px] !px-1.5"
            >
              {l}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {task.assigneeId && (
            <Avatar
              id={task.assigneeId}
              name={task.assignee?.name ?? task.assigneeId}
              size="xs"
            />
          )}
          {task.commentsCount != null && task.commentsCount > 0 && (
            <span
              className="inline-flex items-center gap-0.5 text-[10.5px] font-medium text-[hsl(var(--ink-3))]"
              title={`${task.commentsCount} commentaire${task.commentsCount > 1 ? "s" : ""}`}
            >
              <MessageSquare className="h-3 w-3" />
              <span className="font-mono tabular">{task.commentsCount}</span>
            </span>
          )}
        </div>
        <PriorityPill priority={priority} className="!text-[10px]" />
      </div>
    </button>
  );
}
