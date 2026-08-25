"use client";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  GitBranch,
  Calendar as CalIcon,
  User,
  Tag,
  Sparkles,
  Loader2,
  UserPlus,
  UserMinus,
  MessageSquare,
  Send,
  Trash2,
  Plus,
  Wand2,
  ImagePlus,
} from "lucide-react";
import { Select as AntSelect } from "antd";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { UserCombobox } from "@/components/ui/user-combobox";
import { useImageViewer } from "@/components/ui/image-viewer";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  API_BASE_URL,
  commentsApi,
  distributionApi,
  labelsApi,
  projectsApi,
  routerService,
  tasksApi,
  toast,
  useAuth,
  useTask,
} from "@/services";
import type {
  AssigneeSuggestion,
  Label,
  ProjectMember,
  Task,
  TaskComment,
  TaskPriority,
  TaskStatus,
  User as ApiUser,
} from "@/services";
import type { UpdateTaskInput } from "@/services/api/tasks.api";
import {
  normalizeApiStatus,
  normalizeApiPriority,
  statusFrToApi,
  priorityFrToApi,
} from "@/lib/mappers";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "in_review", label: "En revue" },
  { value: "done", label: "Terminé" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; swatch: string }[] = [
  { value: "urgent", label: "Urgent", swatch: "hsl(var(--accent-rose))" },
  { value: "high", label: "Élevée", swatch: "hsl(var(--accent-amber))" },
  { value: "medium", label: "Moyenne", swatch: "hsl(var(--brand))" },
  { value: "low", label: "Faible", swatch: "hsl(var(--ink-3))" },
];

/** Info-bulle des champs verrouillés parce que la tâche appartient à un autre. */
const LOCKED_HINT = "Tâche assignée à un autre membre : modification réservée à son assigné et aux admins.";

/** Types et taille max acceptés pour l'image d'une tâche (alignés sur le backend). */
const IMAGE_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 Mo

/** URL absolue d'une image servie par le backend (/uploads/...). */
function mediaUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
}


interface TaskDetailDialogProps {
  taskId: string | null;
  onClose: () => void;
  /** Appelé à chaque mutation locale de la tâche pour que le parent
   *  (board, my-tasks, etc.) puisse synchroniser sa propre liste. */
  onUpdated?: (task: Task) => void;
  /** Appelé après suppression de la tâche (admin) pour retirer la carte. */
  onDeleted?: (taskId: string) => void;
}

export function TaskDetailDialog({
  taskId,
  onClose,
  onUpdated,
  onDeleted,
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
              onDeleted={onDeleted}
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
  onDeleted,
}: {
  taskId: string;
  onClose: () => void;
  onUpdated?: (task: Task) => void;
  onDeleted?: (taskId: string) => void;
}) {
  const { task, loading, error, refetch, setTask } = useTask(taskId);
  const { user, isAdmin } = useAuth();
  const openImage = useImageViewer();
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  // Edition inline du titre / description : drafts locaux + flag d'édition.
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState<string | null>(null);
  const [labelCatalog, setLabelCatalog] = useState<Label[]>([]);
  // Suggestion d'assigné (algo de répartition).
  const [suggestions, setSuggestions] = useState<AssigneeSuggestion[] | null>(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  // Suppression de la tâche (admin) : confirmation inline.
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  // Image de la tâche : upload / suppression.
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageBusy, setImageBusy] = useState(false);

  // Patch unifié : optimistic, rollback en cas d'erreur, toast.
  const patchTask = async (
    patch: UpdateTaskInput,
    optimistic: Partial<Task>,
    successMsg?: string,
  ) => {
    if (!task) return;
    const previous = task;
    setTask({ ...task, ...optimistic });
    setSaving(true);
    try {
      const updated = await tasksApi.update(task.id, patch);
      setTask(updated);
      onUpdated?.(updated);
      if (successMsg) toast.success(successMsg, "Mise à jour");
    } catch (e) {
      console.error("Update task failed", e);
      setTask(previous);
      toast.error(
        e instanceof Error ? e.message : "Modification impossible.",
        "Modification refusée",
      );
      refetch();
    } finally {
      setSaving(false);
    }
  };

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
    await patchTask(
      { assigneeId },
      { assigneeId },
      assigneeId ? "Tâche assignée." : "Assignation retirée.",
    );
  };

  const handleAssignSelf = async () => {
    if (!task || !user) return;
    const previous = task;
    setTask({ ...task, assigneeId: user.id });
    setSaving(true);
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
      setSaving(false);
    }
  };

  const commitTitle = () => {
    if (!task || titleDraft === null) return;
    const next = titleDraft.trim();
    setTitleDraft(null);
    if (!next || next === task.title) return;
    patchTask({ title: next }, { title: next });
  };

  const commitDescription = () => {
    if (!task || descDraft === null) return;
    const next = descDraft.trim();
    setDescDraft(null);
    if (next === (task.description ?? "")) return;
    patchTask(
      { description: next || undefined },
      { description: next || null },
    );
  };

  const addLabel = (name: string) => {
    if (!task || !name) return;
    const current = task.labels ?? [];
    if (current.includes(name)) return;
    const labels = [...current, name];
    patchTask({ labels }, { labels });
  };

  const removeLabel = (label: string) => {
    if (!task) return;
    const labels = (task.labels ?? []).filter((l) => l !== label);
    patchTask({ labels }, { labels });
  };

  const fetchSuggestions = async () => {
    if (!task) return;
    setLoadingSuggest(true);
    try {
      const res = await distributionApi.suggestAssignee(task.id);
      setSuggestions(res.suggestions);
    } catch (e) {
      console.error("Suggest assignee failed", e);
      toast.error(
        e instanceof Error ? e.message : "Suggestion impossible.",
        "Échec",
      );
    } finally {
      setLoadingSuggest(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task || deletingTask) return;
    setDeletingTask(true);
    try {
      await tasksApi.remove(task.id);
      toast.success("La tâche a été supprimée.", "Tâche supprimée");
      onDeleted?.(task.id);
      onClose();
    } catch (e) {
      console.error("Delete task failed", e);
      toast.error(
        e instanceof Error ? e.message : "Suppression impossible.",
        "Suppression refusée",
      );
      setDeletingTask(false);
      setConfirmDelete(false);
    }
  };

  const handlePickImage = () => imageInputRef.current?.click();

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Réinitialise l'input pour permettre de re-sélectionner le même fichier.
    e.target.value = "";
    if (!file || !task || imageBusy) return;

    if (!IMAGE_ACCEPT.split(",").includes(file.type)) {
      toast.error("Formats acceptés : PNG, JPEG, GIF, WebP.", "Image refusée");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("L'image ne doit pas dépasser 10 Mo.", "Image trop lourde");
      return;
    }

    setImageBusy(true);
    try {
      const updated = await tasksApi.uploadImage(task.id, file);
      setTask(updated);
      onUpdated?.(updated);
      toast.success("Image ajoutée à la tâche.", "Image enregistrée");
    } catch (err) {
      console.error("Upload task image failed", err);
      toast.error(
        err instanceof Error ? err.message : "Envoi impossible.",
        "Image refusée",
      );
    } finally {
      setImageBusy(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!task || imageBusy) return;
    setImageBusy(true);
    try {
      const updated = await tasksApi.removeImage(task.id);
      setTask(updated);
      onUpdated?.(updated);
      toast.success("Image retirée de la tâche.", "Image supprimée");
    } catch (err) {
      console.error("Remove task image failed", err);
      toast.error(
        err instanceof Error ? err.message : "Suppression impossible.",
        "Refusé",
      );
    } finally {
      setImageBusy(false);
    }
  };

  // Réinitialise les suggestions + la confirmation quand on change de tâche.
  useEffect(() => {
    setSuggestions(null);
    setConfirmDelete(false);
  }, [taskId]);

  // Catalogue de labels (géré par l'admin) — on ne peut choisir que parmi eux.
  useEffect(() => {
    labelsApi
      .listAll()
      .then((res) => setLabelCatalog(res.labels))
      .catch(() => setLabelCatalog([]));
  }, []);

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
  // Miroir de la règle serveur : une tâche libre est modifiable par tout membre,
  // une tâche assignée ne l'est plus que par son assigné (et les admins).
  const canEdit = isAdmin || !task.assigneeId || task.assigneeId === user?.id;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-[hsl(var(--line))] px-6 py-4">
        <span className="font-mono text-[12px] font-semibold tracking-wider text-[hsl(var(--ink-3))]">
          {code}
        </span>
        <Select
          value={statusFrToApi[status]}
          onChange={(v) =>
            patchTask({ status: v as TaskStatus }, { status: v as TaskStatus })
          }
          disabled={saving || !canEdit}
          options={STATUS_OPTIONS}
          className="!h-8 w-[148px] !px-2.5 text-[12px]"
        />
        <div className="ml-auto flex items-center gap-1">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              title="Supprimer la tâche"
              className="grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--alert-danger-bg))] hover:text-[hsl(var(--accent-rose))]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <Dialog.Close asChild aria-label="Fermer">
            <button className="grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </div>
      </header>

      <div className="overflow-y-auto px-6 py-5">
        {confirmDelete && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-3.5 py-2.5">
            <span className="text-[12.5px] text-[hsl(var(--accent-rose))]">
              Supprimer définitivement cette tâche ? Action irréversible.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deletingTask}
                className="rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-2.5 py-1 text-[12px] font-medium hover:bg-[hsl(var(--bg-muted))] disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={deletingTask}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[hsl(var(--accent-rose))] px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-[hsl(348_70%_50%)] disabled:opacity-60"
              >
                {deletingTask ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        )}
        {titleDraft !== null ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setTitleDraft(null);
              }
            }}
            disabled={saving}
            className="-mx-2 block w-[calc(100%+1rem)] rounded-[var(--radius-sm)] border border-[hsl(var(--brand)/0.5)] bg-[hsl(var(--bg))] px-2 py-1 font-display text-[22px] font-semibold leading-tight tracking-tight text-ink outline-none ring-2 ring-[hsl(var(--brand)/0.3)] disabled:opacity-60"
          />
        ) : (
          <h1
            onClick={canEdit ? () => setTitleDraft(task.title) : undefined}
            title={canEdit ? "Cliquer pour modifier" : LOCKED_HINT}
            className={cn(
              "-mx-2 rounded-[var(--radius-sm)] px-2 py-1 font-display text-[22px] font-semibold leading-tight tracking-tight",
              canEdit && "cursor-text hover:bg-[hsl(var(--bg-sunken)/0.6)]",
            )}
          >
            {task.title}
          </h1>
        )}

        {descDraft !== null ? (
          <textarea
            autoFocus
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            onBlur={commitDescription}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setDescDraft(null);
              } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                (e.target as HTMLTextAreaElement).blur();
              }
            }}
            disabled={saving}
            rows={4}
            placeholder="Décrire la tâche…"
            className="mt-3 block w-full resize-y rounded-[var(--radius-sm)] border border-[hsl(var(--brand)/0.5)] bg-[hsl(var(--bg))] px-3 py-2 text-[14px] leading-relaxed text-[hsl(var(--ink-2))] outline-none ring-2 ring-[hsl(var(--brand)/0.3)] disabled:opacity-60"
          />
        ) : task.description ? (
          <p
            onClick={canEdit ? () => setDescDraft(task.description ?? "") : undefined}
            title={canEdit ? "Cliquer pour modifier" : LOCKED_HINT}
            className={cn(
              "mt-3 -mx-2 rounded-[var(--radius-sm)] px-2 py-1 text-[14px] leading-relaxed text-[hsl(var(--ink-2))]",
              canEdit && "cursor-text hover:bg-[hsl(var(--bg-sunken)/0.6)]",
            )}
          >
            {task.description}
          </p>
        ) : canEdit ? (
          <button
            type="button"
            onClick={() => setDescDraft("")}
            className="mt-3 -mx-2 block w-[calc(100%+1rem)] rounded-[var(--radius-sm)] px-2 py-1 text-left text-[13px] text-[hsl(var(--ink-4))] hover:bg-[hsl(var(--bg-sunken)/0.6)]"
          >
            Ajouter une description…
          </button>
        ) : null}

        <input
          ref={imageInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={handleImageSelected}
          className="hidden"
        />
        {task.imageUrl ? (
          <div className="group relative mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)]">
            <button
              type="button"
              onClick={() =>
                openImage({ src: mediaUrl(task.imageUrl!), alt: task.title })
              }
              title="Ouvrir l'image"
              className="block w-full cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(task.imageUrl)}
                alt={task.title}
                className="max-h-[320px] w-full object-contain"
              />
            </button>
            <div className="absolute right-2 top-2 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={handlePickImage}
                disabled={imageBusy || !canEdit}
                title="Remplacer l'image"
                className="inline-flex h-7 items-center gap-1 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-2 text-[11.5px] font-medium text-[hsl(var(--ink-2))] shadow-[var(--shadow-1)] hover:bg-[hsl(var(--bg-muted))] hover:text-ink disabled:opacity-60"
              >
                {imageBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
                Remplacer
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={imageBusy || !canEdit}
                title="Supprimer l'image"
                className="grid h-7 w-7 place-items-center rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--ink-3))] shadow-[var(--shadow-1)] hover:bg-[hsl(var(--alert-danger-bg))] hover:text-[hsl(var(--accent-rose))] disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePickImage}
            disabled={imageBusy || !canEdit}
            title={canEdit ? undefined : LOCKED_HINT}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-sunken)/0.4)] px-3 py-4 text-[12.5px] font-medium text-[hsl(var(--ink-3))] transition hover:border-[hsl(var(--brand)/0.5)] hover:bg-[hsl(var(--brand-soft)/0.4)] hover:text-[hsl(var(--brand-ink))] disabled:opacity-60"
          >
            {imageBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            Ajouter une image
          </button>
        )}

        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] p-4 text-[13px]">
          <Meta Icon={User} label="Assigné" className="col-span-2">
            <AssigneePicker
              currentAssigneeId={task.assigneeId}
              members={members}
              membersLoaded={membersLoaded}
              currentUser={user}
              disabled={saving || !canEdit}
              onAssign={handleAssign}
              onAssignSelf={handleAssignSelf}
            />
            <SuggestionStrip
              suggestions={suggestions}
              loading={loadingSuggest}
              currentAssigneeId={task.assigneeId}
              disabled={saving || !canEdit}
              onFetch={fetchSuggestions}
              onPick={(id) => handleAssign(id)}
            />
          </Meta>
          <Meta Icon={Sparkles} label="Priorité">
            <Select
              value={priorityFrToApi[priority]}
              onChange={(v) =>
                patchTask(
                  { priority: v as TaskPriority },
                  { priority: v as TaskPriority },
                )
              }
              disabled={saving || !canEdit}
              options={PRIORITY_OPTIONS}
              className="!h-9"
            />
          </Meta>
          <Meta Icon={CalIcon} label="Échéance">
            <DatePicker
              value={task.dueDate}
              onChange={(iso) => patchTask({ dueDate: iso }, { dueDate: iso })}
              disabled={saving || !canEdit}
              placeholder="Aucune échéance"
              className={
                overdue
                  ? "!border-[hsl(var(--accent-rose)/0.5)] !text-[hsl(var(--accent-rose))]"
                  : undefined
              }
              trailing={
                overdue ? (
                  <Badge tone="rose" className="!text-[10px]">
                    en retard
                  </Badge>
                ) : null
              }
            />
          </Meta>
          <Meta Icon={Tag} label="Labels">
            <div className="flex flex-wrap items-center gap-1.5">
              {(task.labels ?? []).map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--bg-elevated))] px-2 py-0.5 text-[11px] ring-1 ring-[hsl(var(--line))]"
                >
                  {l}
                  <button
                    type="button"
                    onClick={() => removeLabel(l)}
                    disabled={saving || !canEdit}
                    title={canEdit ? "Retirer" : LOCKED_HINT}
                    className="grid h-3.5 w-3.5 place-items-center rounded-full text-[hsl(var(--ink-4))] hover:bg-[hsl(var(--bg-muted))] hover:text-[hsl(var(--accent-rose))] disabled:opacity-60"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {(() => {
                const available = labelCatalog.filter(
                  (l) => !(task.labels ?? []).includes(l.name),
                );
                if (available.length === 0 || !canEdit) return null;
                return (
                  <AntSelect
                    showSearch
                    value={null}
                    onSelect={(v) => v && addLabel(v)}
                    disabled={saving}
                    placeholder="+ label…"
                    size="small"
                    optionFilterProp="label"
                    notFoundContent="Aucun label trouvé"
                    options={available.map((l) => ({
                      value: l.name,
                      label: l.name,
                    }))}
                    getPopupContainer={(trigger) =>
                      trigger.parentElement ?? document.body
                    }
                    className="w-32"
                    title="Ajouter un label"
                  />
                );
              })()}
            </div>
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
            <span className="">Pas encore de mot écrit.</span>{" "}
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

/* ---------- SuggestionStrip ---------- */

function SuggestionStrip({
  suggestions,
  loading,
  currentAssigneeId,
  disabled,
  onFetch,
  onPick,
}: {
  suggestions: AssigneeSuggestion[] | null;
  loading: boolean;
  currentAssigneeId: string | null;
  disabled: boolean;
  onFetch: () => void;
  onPick: (id: string) => void;
}) {
  const top = suggestions?.slice(0, 3) ?? [];

  return (
    <div className="mt-2">
      {suggestions === null ? (
        <button
          type="button"
          onClick={onFetch}
          disabled={disabled || loading}
          className="inline-flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[hsl(var(--brand)/0.3)] bg-[hsl(var(--brand-soft))] px-2.5 text-[11.5px] font-semibold text-[hsl(var(--brand-ink))] hover:bg-[hsl(var(--brand)/0.18)] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          Suggérer un assigné
        </button>
      ) : top.length === 0 ? (
        <p className="text-[11.5px] text-[hsl(var(--ink-3))]">
          Aucun membre à suggérer.
        </p>
      ) : (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            <Wand2 className="h-3 w-3" />
            Recommandations
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {top.map((s, i) => {
              const isCurrent = s.id === currentAssigneeId;
              const pct = Math.round(s.score * 100);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onPick(s.id)}
                    disabled={disabled || isCurrent}
                    title={`Compétence ${Math.round(
                      s.breakdown.skill * 100,
                    )}% · Dispo ${Math.round(
                      s.breakdown.availability * 100,
                    )}% · Perf ${Math.round(s.breakdown.performance * 100)}%`}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2 text-[11.5px] transition-colors",
                      isCurrent
                        ? "border-[hsl(var(--accent-sage)/0.4)] bg-[hsl(152_50%_95%)] text-[hsl(var(--accent-sage))]"
                        : "border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] hover:border-[hsl(var(--brand)/0.5)] hover:bg-[hsl(var(--brand-soft)/0.5)]",
                    )}
                  >
                    {i === 0 && !isCurrent && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-[hsl(var(--brand))] text-[9px] font-bold text-white">
                        ★
                      </span>
                    )}
                    <Avatar id={s.id} name={s.name} size="xs" />
                    <span className="font-medium">{s.name}</span>
                    <span className="font-mono text-[10px] text-[hsl(var(--ink-3))]">
                      {pct}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
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
