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
  UserPlus,
  UserMinus,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PriorityPill, StatusPill } from "@/components/ui/pill";
import { UserCombobox } from "@/components/ui/user-combobox";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  commentsApi,
  projectsApi,
  routerService,
  tasksApi,
  toast,
  useAuth,
  useTask,
} from "@/services";
import type {
  ProjectMember,
  Task,
  TaskComment,
  User as ApiUser,
} from "@/services";
import { normalizeApiStatus, normalizeApiPriority } from "@/lib/mappers";
import { shortDate } from "@/lib/utils";

interface TaskDetailDialogProps {
  taskId: string | null;
  onClose: () => void;
  /** Appelé à chaque mutation locale de la tâche pour que le parent
   *  (board, my-tasks, etc.) puisse synchroniser sa propre liste. */
  onUpdated?: (task: Task) => void;
}

export function TaskDetailDialog({
  taskId,
  onClose,
  onUpdated,
}: TaskDetailDialogProps) {
  const open = !!taskId;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[hsl(230_30%_8%/0.45)] backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[88vh] w-[760px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_1fr] overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <VisuallyHidden.Root>
            <Dialog.Title>Détails de la tâche</Dialog.Title>
          </VisuallyHidden.Root>
          {taskId && (
            <TaskDetailBody
              taskId={taskId}
              onClose={onClose}
              onUpdated={onUpdated}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TaskDetailBody({
  taskId,
  onClose,
  onUpdated,
}: {
  taskId: string;
  onClose: () => void;
  onUpdated?: (task: Task) => void;
}) {
  const { task, loading, error, refetch, setTask } = useTask(taskId);
  const { user, isAdmin } = useAuth();
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Charge les commentaires à chaque ouverture / changement de tâche
  useEffect(() => {
    setComments([]);
    setCommentsLoading(true);
    commentsApi
      .list(taskId)
      .then((res) => setComments(res.comments))
      .catch((e) => {
        console.error("Load comments failed", e);
        setComments([]);
      })
      .finally(() => setCommentsLoading(false));
  }, [taskId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = comment.trim();
    if (!body || submittingComment) return;
    setSubmittingComment(true);
    try {
      const created = await commentsApi.create(taskId, body);
      setComments((curr) => [...curr, created]);
      setComment("");
      if (task) {
        const next = {
          ...task,
          commentsCount: (task.commentsCount ?? 0) + 1,
        };
        setTask(next);
        onUpdated?.(next);
      }
    } catch (err) {
      console.error("Submit comment failed", err);
      toast.error(
        err instanceof Error ? err.message : "Envoi impossible.",
        "Commentaire refusé",
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    setDeletingId(id);
    try {
      await commentsApi.remove(id);
      setComments((curr) => curr.filter((c) => c.id !== id));
      if (task) {
        const next = {
          ...task,
          commentsCount: Math.max((task.commentsCount ?? 1) - 1, 0),
        };
        setTask(next);
        onUpdated?.(next);
      }
    } catch (err) {
      console.error("Delete comment failed", err);
      toast.error(
        err instanceof Error ? err.message : "Suppression impossible.",
        "Refusé",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Reset comment when task changes
  useEffect(() => setComment(""), [taskId]);

  // Charge la liste des membres du projet pour le sélecteur.
  // Ne déclenche le reset que si projectId change vers une autre valeur
  // définie — sinon on conserve la liste précédente pour éviter de vider
  // l'autocomplete pendant une réponse API tronquée.
  const projectId = task?.projectId ?? null;
  useEffect(() => {
    if (!projectId) return;
    setMembersLoaded(false);
    projectsApi
      .listMembers(projectId)
      .then((res) => setMembers(res.members))
      .catch(() => setMembers([]))
      .finally(() => setMembersLoaded(true));
  }, [projectId]);

  const handleAssign = async (assigneeId: string | null) => {
    if (!task) return;
    if (assigneeId === task.assigneeId) return;
    const previous = task;
    // Optimistic update — l'input reflète le choix immédiatement
    setTask({ ...task, assigneeId });
    setAssigning(true);
    try {
      const updated = await tasksApi.update(task.id, { assigneeId });
      setTask(updated);
      onUpdated?.(updated);
      toast.success(
        assigneeId ? "Tâche assignée." : "Assignation retirée.",
        "Mise à jour",
      );
    } catch (e) {
      console.error("Assign failed", e);
      // Rollback sur l'état précédent
      setTask(previous);
      toast.error(
        e instanceof Error ? e.message : "Assignation impossible.",
        "Assignation refusée",
      );
      refetch();
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignSelf = async () => {
    if (!task || !user) return;
    const previous = task;
    setTask({ ...task, assigneeId: user.id });
    setAssigning(true);
    try {
      const updated = await tasksApi.assign(task.id);
      setTask(updated);
      onUpdated?.(updated);
      toast.success("Vous êtes assigné à cette tâche.", "Assignation");
    } catch (e) {
      console.error("Self-assign failed", e);
      setTask(previous);
      toast.error(
        e instanceof Error ? e.message : "Assignation impossible.",
        "Assignation refusée",
      );
    } finally {
      setAssigning(false);
    }
  };

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
        <div className="rounded-[var(--radius-md)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-4 py-3 text-[13px] text-[hsl(var(--accent-rose))]">
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
  const code = task.identifier ?? task.id.slice(0, 8);
  const overdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;
  const branchName = task.githubBranch ?? task.branch ?? null;
  const branchUrl = task.githubBranchUrl ?? null;

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
          <Meta Icon={User} label="Assigné" className="col-span-2">
            <AssigneePicker
              currentAssigneeId={task.assigneeId}
              members={members}
              membersLoaded={membersLoaded}
              currentUser={user}
              disabled={assigning}
              onAssign={handleAssign}
              onAssignSelf={handleAssignSelf}
            />
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
          {branchName && (
            <Meta Icon={GitBranch} label="Branche">
              {branchUrl ? (
                <button
                  type="button"
                  onClick={() => routerService.openExternal(branchUrl)}
                  className="font-mono text-[12px] text-[hsl(var(--brand-ink))] underline-offset-2 hover:underline"
                >
                  {branchName}
                </button>
              ) : (
                <span className="font-mono text-[12px]">{branchName}</span>
              )}
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

        <CommentsSection
          comments={comments}
          loading={commentsLoading}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
          deletingId={deletingId}
          onDelete={handleDeleteComment}
          comment={comment}
          setComment={setComment}
          submitting={submittingComment}
          onSubmit={handleSubmitComment}
        />
      </div>
    </>
  );
}

/* ---------- CommentsSection ---------- */

function CommentsSection({
  comments,
  loading,
  currentUserId,
  isAdmin,
  deletingId,
  onDelete,
  comment,
  setComment,
  submitting,
  onSubmit,
}: {
  comments: TaskComment[];
  loading: boolean;
  currentUserId: string | null;
  isAdmin: boolean;
  deletingId: string | null;
  onDelete: (id: string) => void;
  comment: string;
  setComment: (v: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const sorted = [...comments].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : 1,
  );
  const canSubmit = comment.trim().length > 0 && !submitting;

  return (
    <section className="mt-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-[hsl(var(--ink-3))]" />
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            Commentaires
          </div>
          {comments.length > 0 && (
            <Badge tone="neutral" className="!text-[10px]">
              {comments.length}
            </Badge>
          )}
        </div>
      </header>

      {/* Liste */}
      <div className="mt-3 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-[12px] text-[hsl(var(--ink-3))]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Chargement…
          </div>
        ) : sorted.length === 0 ? (
          <p className="rounded-[var(--radius-sm)] border border-dashed border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-sunken)/0.4)] px-3 py-3 text-center text-[12px] text-[hsl(var(--ink-3))]">
            <span className="font-serif italic">Pas encore de mot écrit.</span>{" "}
            Soyez le premier à commenter.
          </p>
        ) : (
          sorted.map((c) => {
            const canDelete =
              isAdmin || (currentUserId && c.authorId === currentUserId);
            const isDeleting = deletingId === c.id;
            return (
              <article
                key={c.id}
                className="group relative flex gap-2.5 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg))] p-3"
              >
                <Avatar
                  id={c.authorId}
                  name={c.author?.name ?? c.authorId}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-[12.5px] font-semibold tracking-tight">
                      {c.author?.name ?? "Auteur inconnu"}
                    </span>
                    <span className="font-mono text-[10.5px] text-[hsl(var(--ink-4))]">
                      {formatCommentDate(c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[hsl(var(--ink-2))]">
                    {c.body}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(c.id)}
                    disabled={isDeleting}
                    title="Supprimer"
                    className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-[5px] text-[hsl(var(--ink-4))] opacity-0 transition hover:bg-[hsl(var(--bg-muted))] hover:text-[hsl(var(--accent-rose))] focus:opacity-100 group-hover:opacity-100 disabled:opacity-40"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Form */}
      <form
        onSubmit={onSubmit}
        className="mt-3 rounded-[var(--radius-md)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] focus-within:border-[hsl(var(--brand)/0.5)] focus-within:ring-2 focus-within:ring-[hsl(var(--brand)/0.3)]"
      >
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              onSubmit(e);
            }
          }}
          placeholder="Ajouter un commentaire…"
          rows={2}
          maxLength={2000}
          disabled={submitting}
          className="block w-full resize-none bg-transparent px-3 py-2.5 text-[13px] placeholder:text-[hsl(var(--ink-4))] focus:outline-none disabled:opacity-60"
        />
        <div className="flex items-center justify-between gap-2 border-t border-[hsl(var(--line))] px-3 py-2">
          <span className="font-mono text-[10px] text-[hsl(var(--ink-4))]">
            <kbd className="rounded border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-1.5 py-0.5 text-[9.5px]">
              ⌘
            </kbd>
            <span className="mx-1">+</span>
            <kbd className="rounded border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-1.5 py-0.5 text-[9.5px]">
              Entrée
            </kbd>{" "}
            pour publier
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[hsl(var(--brand))] px-3 text-[12px] font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-[hsl(var(--brand-ink))] disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Publier
          </button>
        </div>
      </form>
    </section>
  );
}

function formatCommentDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.round(h / 24);
  if (days < 7) return `il y a ${days} j`;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: now.getFullYear() === d.getFullYear() ? undefined : "numeric",
  });
}

function Meta({
  Icon,
  label,
  children,
  className,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-2.5${className ? " " + className : ""}`}>
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

/* ---------- AssigneePicker ---------- */

function AssigneePicker({
  currentAssigneeId,
  members,
  membersLoaded,
  currentUser,
  disabled,
  onAssign,
  onAssignSelf,
}: {
  currentAssigneeId: string | null;
  members: ProjectMember[];
  membersLoaded: boolean;
  currentUser: ApiUser | null;
  disabled: boolean;
  onAssign: (id: string | null) => void;
  onAssignSelf: () => void;
}) {
  const options = members
    .filter((m) => !!m.user)
    .map((m) => ({
      id: m.userId,
      name: m.user!.name,
      email: m.user!.email,
      avatar_url: m.user!.avatar_url ?? null,
    }));

  const selfIsMember =
    !!currentUser &&
    members.some((m) => m.userId === currentUser.id);
  const canSelfAssign =
    !!currentUser && selfIsMember && currentAssigneeId !== currentUser.id;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-[260px] flex-1">
        <UserCombobox
          users={options}
          value={currentAssigneeId ?? ""}
          onChange={(id) => onAssign(id || null)}
          placeholder={
            membersLoaded
              ? "Choisir un assigné…"
              : "Chargement des membres…"
          }
          emptyLabel={
            membersLoaded ? "Aucun membre disponible" : "Chargement…"
          }
          disabled={disabled || !membersLoaded}
        />
      </div>
      {currentAssigneeId && (
        <button
          type="button"
          onClick={() => onAssign(null)}
          disabled={disabled}
          className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-2.5 text-[11.5px] font-medium text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink disabled:opacity-60"
          title="Retirer l'assignation"
        >
          <UserMinus className="h-3.5 w-3.5" />
          Retirer
        </button>
      )}
      {canSelfAssign && (
        <button
          type="button"
          onClick={onAssignSelf}
          disabled={disabled}
          className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-sm)] bg-[hsl(var(--brand))] px-2.5 text-[11.5px] font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-[hsl(var(--brand-ink))] disabled:opacity-60"
        >
          <UserPlus className="h-3.5 w-3.5" />
          M&apos;assigner
        </button>
      )}
    </div>
  );
}
