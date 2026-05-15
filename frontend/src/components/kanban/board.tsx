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
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
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
import { useProjectTasks } from "@/services";
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

interface KanbanBoardProps {
  projectId: string;
  projectName: string;
}

export function KanbanBoard({ projectId, projectName }: KanbanBoardProps) {
  const { tasks, loading, move } = useProjectTasks(projectId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const grouped = useMemo(() => {
    const map: Record<Status, ApiTask[]> = {
      a_faire: [],
      en_cours: [],
      en_revue: [],
      termine: [],
    };
    for (const t of tasks) {
      map[normalizeApiStatus(t.status)].push(t);
    }
    return map;
  }, [tasks]);

  const prefix = prefixForProject(projectName);
  const activeTask = tasks.find((t) => t.id === activeId) || null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id;
    if (!overId) return;
    const taskId = String(e.active.id);
    const target = COLUMNS.find((c) => c === overId);
    if (!target) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (normalizeApiStatus(task.status) === target) return;

    try {
      await move(taskId, { status: statusFrToApi[target] });
    } catch (err) {
      console.error("Failed to move task", err);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
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

      <DragOverlay>
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
        "w-[300px] shrink-0 rounded-[var(--radius-lg)] border border-[hsl(var(--line))] transition-colors",
        bg,
        isOver && "ring-2 ring-[hsl(var(--brand)/0.45)]",
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
      <div className="flex flex-col gap-2.5 px-2 pb-3">
        {tasks.map((t) => (
          <DraggableTaskCard
            key={t.id}
            task={t}
            prefix={prefix}
            onOpen={() => onOpenTask(t.id)}
          />
        ))}
      </div>
    </section>
  );
}

function DraggableTaskCard({
  task,
  prefix,
  onOpen,
}: {
  task: ApiTask;
  prefix: string;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("touch-none", isDragging && "opacity-40")}
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
        "block w-full rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-3 text-left shadow-[var(--shadow-1)] transition-all hover:-translate-y-px hover:shadow-[var(--shadow-2)]",
        dragging && "rotate-1 shadow-[var(--shadow-3)]",
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
