"use client";
import { use } from "react";
import { KanbanBoard } from "@/components/kanban/board";
import { useProject } from "@/services";

export default function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { project } = useProject(id);

  return (
    <div className="flex min-h-[calc(100dvh-180px)] flex-col">
      <KanbanBoard projectId={id} projectName={project?.name ?? ""} />
    </div>
  );
}
