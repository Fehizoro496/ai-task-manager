"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  GitBranch,
  Calendar as CalIcon,
  User,
  Tag,
  Link as LinkIcon,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PriorityPill, StatusPill } from "@/components/ui/pill";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useTask } from "@/services";
import { normalizeApiStatus, normalizeApiPriority, taskCode } from "@/lib/mappers";
import { shortDate } from "@/lib/utils";

interface TaskDetailDialogProps {
  taskId: string | null;
  onClose: () => void;
}

export function TaskDetailDialog({ taskId, onClose }: TaskDetailDialogProps) {
  const open = !!taskId;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[hsl(230_30%_8%/0.45)] backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[88vh] w-[760px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_1fr] overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <VisuallyHidden.Root>
            <Dialog.Title>Détails de la tâche</Dialog.Title>
          </VisuallyHidden.Root>
          {taskId && <TaskDetailBody taskId={taskId} onClose={onClose} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TaskDetailBody({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { task, loading, error } = useTask(taskId);
  const [comment, setComment] = useState("");

  // Reset comment when task changes
  useEffect(() => setComment(""), [taskId]);

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <div className="flex items-center gap-2 text-[13px] text-[hsl(var(--ink-3))]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement…
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="px-6 py-8">
        <div className="rounded-[var(--radius-md)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(348_78%_97%)] px-4 py-3 text-[13px] text-[hsl(var(--accent-rose))]">
          Tâche introuvable.
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-3 py-1.5 text-[12.5px] font-medium hover:bg-[hsl(var(--bg-muted))]"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const status = normalizeApiStatus(task.status);
  const priority = normalizeApiPriority(task.priority);
  const code = taskCode("AM", task.id);
  const overdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-[hsl(var(--line))] px-6 py-4">
        <span className="font-mono text-[12px] font-semibold tracking-wider text-[hsl(var(--ink-3))]">
          {code}
        </span>
        <StatusPill status={status} />
        <Dialog.Close
          asChild
          aria-label="Fermer"
        >
          <button className="ml-auto grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </Dialog.Close>
      </header>

      <div className="overflow-y-auto px-6 py-5">
        <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight">
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
                <Avatar
                  id={task.assigneeId}
                  name={task.assigneeId.slice(0, 2)}
                  size="xs"
                />
                <span className="font-mono text-[11px]">
                  {task.assigneeId.slice(0, 8)}…
                </span>
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
                overdue
                  ? "font-medium text-[hsl(var(--accent-rose))]"
                  : "font-medium"
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
          {task.branch && (
            <Meta Icon={GitBranch} label="Branche">
              <span className="font-mono text-[12px]">{task.branch}</span>
            </Meta>
          )}
          {task.storyId && (
            <Meta Icon={LinkIcon} label="Story liée">
              <span className="font-mono text-[11px]">
                {task.storyId.slice(0, 8)}…
              </span>
            </Meta>
          )}
        </div>

        <div className="mt-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            Commentaire
          </div>
          <div className="mt-2 rounded-[var(--radius-md)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] focus-within:border-[hsl(var(--brand)/0.5)] focus-within:ring-2 focus-within:ring-[hsl(var(--brand)/0.3)]">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire…"
              rows={2}
              className="block w-full resize-none bg-transparent px-3 py-2.5 text-[13px] placeholder:text-[hsl(var(--ink-4))] focus:outline-none"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[hsl(var(--ink-3))]">
            Les commentaires ne sont pas encore persistés côté backend.
          </p>
        </div>
      </div>
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
