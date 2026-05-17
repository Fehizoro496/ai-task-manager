"use client";
import { useMemo, useState } from "react";
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
import { Plus, Search, SlidersHorizontal, Flag, Loader2 } from "lucide-react";
import { statusLabel, statusToken } from "@/lib/labels";
import {
  normalizeApiPriority,
  normalizeApiStatus,
  statusFrToApi,
  prefixForProject,
  taskCode,
} from "@/lib/mappers";
import { Avatar } from "@/components/ui/avatar";
import { PriorityPill } from "@/components/ui/pill";
import { Badge } from "@/components/ui/badge";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { tasksApi, toast, useProjectTasks } from "@/services";
import type { Task as ApiTask } from "@/services";
import type { Status } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLUMNS: Status[] = ["a_faire", "en_cours", "en_revue", "termine"];

const COLUMN_DOT: Record<Status, string> = {
  a_faire: "bg-[hsl(var(--ink-3))]",
  en_cours: "bg-[hsl(var(--accent-amber))]",
  en_revue: "bg-[hsl(var(--brand))]",
  termine: "bg-[hsl(var(--accent-sage))]",
};

const COLUMN_BG: Record<Status, string> = {
  a_faire: "bg-[hsl(230_24%_97%)]",
  en_cours: "bg-[hsl(32_92%_97%)]",
  en_revue: "bg-[hsl(271_76%_97%)]",
  termine: "bg-[hsl(152_40%_96%)]",
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
  projectName: string;
}

export function KanbanBoard({ projectId, projectName }: KanbanBoardProps) {
  const { tasks, loading, refetch } = useProjectTasks(projectId);
  // Liste locale pour les rearrangements optimistes inter-colonnes pendant
  // le drag, avant la confirmation API au drop.
  const [localTasks, setLocalTasks] = useState<ApiTask[] | null>(null);
  const visibleTasks = localTasks ?? tasks;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const grouped = useMemo(() => {
    const map: Record<Status, ApiTask[]> = {
      a_faire: [],
      en_cours: [],
      en_revue: [],
      termine: [],
    };
    for (const t of visibleTasks) {
      map[normalizeApiStatus(t.status)].push(t);
    }
    return map;
  }, [visibleTasks]);

  const prefix = prefixForProject(projectName);
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

    // Position dans la colonne cible
    const targetColumnTasks = finalTasks.filter(
      (t) => normalizeApiStatus(t.status) === targetColumn,
    );
    const positionInColumn = targetColumnTasks.findIndex(
      (t) => t.id === activeIdStr,
    );

    const original = tasks.find((t) => t.id === activeIdStr);
    const originalStatus = original ? normalizeApiStatus(original.status) : null;

    setLocalTasks(finalTasks);

    // Pas de changement utile
    if (originalStatus === targetColumn) {
      const originalSameCol = tasks
        .filter((t) => normalizeApiStatus(t.status) === targetColumn)
        .findIndex((t) => t.id === activeIdStr);
      if (originalSameCol === positionInColumn) {
        setLocalTasks(null);
        return;
      }
    }

    try {
      await tasksApi.move(activeIdStr, {
        status: statusFrToApi[targetColumn],
        order: positionInColumn,
      });
      await refetch();
    } catch (err) {
      console.error("Failed to move task", err);
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
              placeholder="Rechercher une tâche…"
              className="h-9 w-[260px] rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] pl-8 pr-3 text-[13px] placeholder:text-[hsl(var(--ink-4))] focus:border-[hsl(var(--brand)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.3)]"
            />
          </div>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-3 text-[12.5px] font-medium hover:bg-[hsl(var(--bg-muted))]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtre
          </button>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-3 text-[12.5px] font-medium hover:bg-[hsl(var(--bg-muted))]">
            <Flag className="h-3.5 w-3.5" />
            Priorité
          </button>
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
              />
            ))}
          </div>
        </div>
      )}

      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask && <TaskCard task={activeTask} prefix={prefix} dragging />}
      </DragOverlay>

      <TaskDetailDialog taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
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
}: {
  status: Status;
  tasks: ApiTask[];
  prefix: string;
  accent: string;
  bg: string;
  onOpenTask: (id: string) => void;
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
        <button className="grid h-6 w-6 place-items-center rounded text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-elevated))]">
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
  const code = taskCode(prefix, task.id);

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
            <Avatar id={task.assigneeId} name={task.assigneeId.slice(0, 2)} size="xs" />
          )}
        </div>
        <PriorityPill priority={priority} className="!text-[10px]" />
      </div>
    </button>
  );
}
