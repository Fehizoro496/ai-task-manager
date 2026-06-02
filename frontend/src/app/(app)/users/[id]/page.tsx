"use client";
import { use, useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Mail,
  ShieldCheck,
  Calendar as CalIcon,
  FolderKanban,
  ListChecks,
  ChevronRight,
} from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusPill, PriorityPill } from "@/components/ui/pill";
import { Github } from "@/components/icons/github";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { routerService, usersApi } from "@/services";
import type { UserDetail } from "@/services";
import {
  normalizeApiPriority,
  normalizeApiStatus,
} from "@/lib/mappers";
import { shortDate } from "@/lib/utils";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setError(null);
    return usersApi
      .getById(id)
      .then(setUser)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Utilisateur introuvable."),
      );
  }, [id]);

  useEffect(() => {
    setLoading(true);
    refetch().finally(() => setLoading(false));
  }, [refetch]);

  if (loading) {
    return (
      <>
        <Topbar breadcrumb={<Breadcrumb items={[{ label: "Utilisateur" }]} />} />
        <main className="flex-1 grid place-items-center py-20">
          <div className="flex items-center gap-2 text-[13px] text-[hsl(var(--ink-3))]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        </main>
      </>
    );
  }

  if (error || !user) {
    return (
      <>
        <Topbar breadcrumb={<Breadcrumb items={[{ label: "Utilisateur" }]} />} />
        <main className="flex-1 px-8 py-10">
          <div className="rounded-[var(--radius-md)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-4 py-3 text-[13px] text-[hsl(var(--accent-rose))]">
            {error ?? "Utilisateur introuvable."}
          </div>
        </main>
      </>
    );
  }

  const roleLabel = user.role === "ADMIN" ? "Administrateur" : "Membre";
  const joined = user.createdAt ? shortDate(user.createdAt) : "—";

  return (
    <>
      <Topbar
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Utilisateurs" },
              { label: user.name },
            ]}
          />
        }
      />
      <main className="flex-1 px-8 py-7">
        <div className="mx-auto max-w-[960px] space-y-6">
          {/* Header */}
          <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
            <div className="absolute inset-0 -z-0 bg-aurora opacity-70" />
            <div className="relative flex flex-wrap items-center gap-6 px-7 py-7">
              <Avatar
                id={user.id}
                name={user.name}
                size="2xl"
                className="ring-4 ring-[hsl(var(--bg-elevated))] shadow-[var(--shadow-2)]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-[26px] font-semibold tracking-tight">
                    {user.name}
                  </h1>
                  <Badge tone={user.role === "ADMIN" ? "brand" : "neutral"}>
                    {roleLabel}
                  </Badge>
                  <Badge
                    tone={user.status === "APPROVED" ? "sage" : "neutral"}
                  >
                    {user.status}
                  </Badge>
                </div>
                <a
                  href={`mailto:${user.email}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-[hsl(var(--ink-3))] hover:text-ink"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </a>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-[hsl(var(--ink-3))]">
                  <span className="inline-flex items-center gap-1.5">
                    <CalIcon className="h-3.5 w-3.5" />
                    Inscrit le {joined}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Provider : {(user.provider as string) ?? "—"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Github className="h-3.5 w-3.5" />
                    OAuth lié
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="grid gap-3 sm:grid-cols-2">
            <StatCard
              Icon={FolderKanban}
              label="Projets"
              value={user.stats.projectsCount}
              hint="membre actif"
              tone="brand"
            />
            <StatCard
              Icon={ListChecks}
              label="Tâches assignées"
              value={user.stats.tasksAssigned}
              hint="tous statuts"
              tone="apricot"
            />
          </section>

          {/* Recent tasks */}
          <section className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
            <header className="flex items-center justify-between border-b border-[hsl(var(--line))] px-5 py-4">
              <div>
                <h2 className="font-display text-[16px] font-semibold tracking-tight">
                  Tâches assignées récemment
                </h2>
                <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
                  Les 8 dernières mises à jour.
                </p>
              </div>
            </header>
            {user.recentTasks.length === 0 ? (
              <div className="grid place-items-center py-10 text-center text-[13px] text-[hsl(var(--ink-3))]">
                Aucune tâche assignée pour le moment.
              </div>
            ) : (
              <ul>
                {user.recentTasks.map((t, i) => {
                  const status = normalizeApiStatus(t.status);
                  const priority = normalizeApiPriority(t.priority);
                  return (
                    <li
                      key={t.id}
                      className={
                        i < user.recentTasks.length - 1
                          ? "border-b border-[hsl(var(--line))]"
                          : ""
                      }
                    >
                      <button
                        onClick={() => setOpenTaskId(t.id)}
                        className="group flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[hsl(var(--bg-sunken)/0.5)]"
                      >
                        <span className="font-mono text-[10.5px] font-semibold tracking-wider text-[hsl(var(--ink-3))] shrink-0 w-[58px]">
                          {t.identifier ?? "—"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium tracking-tight">
                            {t.title}
                          </span>
                          {t.projectName && t.projectId && (
                            <span
                              role="link"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                routerService.toProject(t.projectId!);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  routerService.toProject(t.projectId!);
                                }
                              }}
                              className="block w-fit cursor-pointer text-[11.5px] text-[hsl(var(--ink-3))] hover:underline focus:outline-none focus-visible:underline"
                            >
                              {t.projectName}
                            </span>
                          )}
                        </span>
                        <StatusPill status={status} />
                        <PriorityPill priority={priority} />
                        <span className="w-[100px] text-right text-[12px] tabular text-[hsl(var(--ink-2))]">
                          {t.dueDate ? shortDate(t.dueDate) : "—"}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-[hsl(var(--ink-4))] opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>

      <TaskDetailDialog
        taskId={openTaskId}
        onClose={() => setOpenTaskId(null)}
        onUpdated={() => refetch()}
      />
    </>
  );
}

function StatCard({
  Icon,
  label,
  value,
  hint,
  tone,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint: string;
  tone: "brand" | "apricot";
}) {
  const map = {
    brand: "bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]",
    apricot: "bg-[hsl(23_92%_94%)] text-[hsl(22_78%_42%)]",
  } as const;
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-5 shadow-[var(--shadow-1)]">
      <span
        className={`grid h-11 w-11 place-items-center rounded-[10px] ${map[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="font-display text-[28px] font-semibold leading-none tabular">
          {value}
        </div>
        <div className="mt-1.5 text-[12px] text-[hsl(var(--ink-2))]">
          <span className="font-semibold">{label}</span>
          <span className="ml-1 text-[hsl(var(--ink-3))]">· {hint}</span>
        </div>
      </div>
    </div>
  );
}
