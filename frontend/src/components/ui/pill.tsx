import * as React from "react";
import { cn } from "@/lib/utils";
import type { Priority, Status } from "@/lib/types";
import { priorityLabel, priorityToken, statusLabel, statusToken } from "@/lib/labels";

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const t = statusToken[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-tight",
        t.bg,
        t.fg,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
      {statusLabel[status]}
    </span>
  );
}

export function PriorityPill({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const t = priorityToken[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-tight",
        t.bg,
        t.fg,
        className,
      )}
    >
      {priorityLabel[priority]}
    </span>
  );
}
