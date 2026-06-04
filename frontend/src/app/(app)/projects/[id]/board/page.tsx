"use client";
import { use } from "react";
import { KanbanBoard } from "@/components/kanban/board";
import { useAuth, useProject } from "@/services";
import { projectPrefix } from "@/lib/mappers";

export default function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { project } = useProject(id);
  const { user, isAdmin } = useAuth();
  const prefix = projectPrefix(project);
  const canDistribute =
    isAdmin || (!!project?.ownerId && project.ownerId === user?.id);

  return (
    <div className="flex min-h-[calc(100dvh-180px)] flex-col">
      <KanbanBoard
        projectId={id}
        projectPrefix={prefix}
        canDistribute={canDistribute}
      />
    </div>
  );
}
