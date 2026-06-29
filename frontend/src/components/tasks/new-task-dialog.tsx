"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Sparkles, Loader2, Plus } from "lucide-react";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { projectsApi, toast, useAuth, useProjects } from "@/services";
import type { TaskPriority, TaskStatus } from "@/services";

const PRIORITY: { v: TaskPriority; l: string }[] = [
  { v: "urgent", l: "Urgent" },
  { v: "high", l: "Élevée" },
  { v: "medium", l: "Moyenne" },
  { v: "low", l: "Faible" },
];

interface NewTaskDialogProps {
  open: boolean;
  onClose: () => void;
  /** Préremplit + verrouille le projet quand fourni. */
  projectId?: string;
  /** Préremplit le statut initial (drop sur une colonne du board). */
  initialStatus?: TaskStatus;
  /** Callback après création réussie (ex: refetch board). */
  onCreated?: (taskId: string) => void;
}

export function NewTaskDialog({
  open,
  onClose,
  projectId: lockedProjectId,
  initialStatus,
  onCreated,
}: NewTaskDialogProps) {
  const { projects } = useProjects();
  const { isAdmin } = useAuth();
  const [projectId, setProjectId] = useState<string>(lockedProjectId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset après fermeture
      setTitle("");
      setDescription("");
      setPriority("medium");
      setError(null);
      setSaving(false);
      setProjectId(lockedProjectId ?? "");
    } else if (lockedProjectId) {
      setProjectId(lockedProjectId);
    }
  }, [open, lockedProjectId]);

  const submit = async () => {
    if (!projectId || !title.trim()) {
      setError("Sélectionnez un projet et saisissez un titre.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const task = await projectsApi.createTask(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        ...(initialStatus ? { status: initialStatus } : {}),
      });
      toast.success(`« ${task.title} » a été ajoutée.`, "Tâche créée");
      onCreated?.(task.id);
      onClose();
    } catch (e) {
      console.error("Create task failed", e);
      const message = e instanceof Error ? e.message : "Création impossible.";
      setError(message);
      toast.error(message, "Création de la tâche");
      setSaving(false);
    }
  };

  // Création de tâche réservée à l'admin (filet de sécurité côté UI).
  if (!isAdmin) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[hsl(230_30%_8%/0.45)] backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[520px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <header className="flex items-center justify-between border-b border-[hsl(var(--line))] px-5 py-4">
            <Dialog.Title className="font-display text-[18px] font-semibold tracking-tight">
              Créer une tâche
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </header>

          <div className="space-y-4 px-5 py-5">
            {!lockedProjectId && (
              <Field label="Projet">
                <Select
                  value={projectId}
                  onChange={setProjectId}
                  disabled={saving}
                  placeholder="— Sélectionner un projet —"
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.name,
                    swatch: p.color ?? undefined,
                  }))}
                />
              </Field>
            )}
            <Field label="Titre">
              <Input
                autoFocus
                placeholder="Ex. Implémenter la recherche"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
              />
            </Field>
            <Field label="Description">
              <Textarea
                placeholder="Décrivez la tâche…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                rows={3}
              />
            </Field>
            <Field label="Priorité">
              <Select
                value={priority}
                onChange={(v) => setPriority(v as TaskPriority)}
                disabled={saving}
                options={PRIORITY.map((p) => ({ value: p.v, label: p.l }))}
              />
            </Field>

            {error && (
              <div className="rounded-[var(--radius-sm)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-3 py-2 text-[12.5px] text-[hsl(var(--accent-rose))]">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--brand)/0.2)] bg-[hsl(var(--brand-soft))] px-3 py-2 text-[12.5px] text-[hsl(var(--brand-ink))]">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Astuce : ⌘/Ctrl+Entrée pour créer directement.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-5 py-3">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button variant="brand" size="sm" onClick={submit} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {saving ? "Création…" : "Créer la tâche"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

