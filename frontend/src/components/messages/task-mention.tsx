"use client";
import Link from "next/link";
import { Fragment } from "react";
import { routerService } from "@/services";
import type { MentionedTask } from "@/services";
import { parseTaskMentions } from "@/lib/task-mentions";
import { normalizeApiStatus } from "@/lib/mappers";
import { statusLabel, statusToken } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * Puce cliquable rendue à la place d'une mention `#AM-001` résolue.
 */
function TaskMentionChip({ task }: { task: MentionedTask }) {
  const status = normalizeApiStatus(task.status);
  const token = statusToken[status];

  // Cible l'onglet Tâches du projet, qui ouvre le dialog via `?task=`. Le
  // repli sur la page tâche ne sert qu'aux tâches sans projet rattaché.
  const href = task.projectId
    ? routerService.paths.projectBoardTask(task.projectId, task.id)
    : routerService.paths.task(task.id);

  return (
    <Link
      href={href}
      title={`${task.title} · ${statusLabel[status]}${task.projectName ? ` · ${task.projectName}` : ""}`}
      className={cn(
        "inline-flex max-w-full items-baseline gap-1 rounded-[5px] border border-[hsl(var(--brand)/0.25)]",
        "bg-[hsl(var(--brand)/0.1)] px-1.5 py-px align-baseline text-[12.5px] font-medium",
        "text-[hsl(var(--brand))] transition-colors hover:bg-[hsl(var(--brand)/0.18)]",
      )}
    >
      <span className="font-mono text-[11.5px]">{task.identifier}</span>
      <span className="truncate text-[hsl(var(--ink-2))]">{task.title}</span>
    </Link>
  );
}

/**
 * Rend le contenu d'un message en transformant les mentions résolues en puces.
 * Les mentions non résolues (tâche supprimée ou hors de portée du lecteur)
 * restent affichées telles quelles.
 */
export function MessageContent({
  content,
  mentionedTasks,
  className,
}: {
  content: string;
  mentionedTasks?: MentionedTask[];
  className?: string;
}) {
  const segments = parseTaskMentions(content, mentionedTasks);

  return (
    <div className={cn("whitespace-pre-wrap", className)}>
      {segments.map((segment, i) => (
        <Fragment key={i}>
          {segment.kind === "text" ? (
            segment.value
          ) : segment.task ? (
            <TaskMentionChip task={segment.task} />
          ) : (
            segment.raw
          )}
        </Fragment>
      ))}
    </div>
  );
}
