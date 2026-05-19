"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { projectsApi, toast, useProjects } from "@/services";
import type { TaskPriority } from "@/services";

const PRIORITY: { v: TaskPriority; l: string }[] = [
  { v: "urgent", l: "Urgent" },
  { v: "high", l: "Élevée" },
  { v: "medium", l: "Moyenne" },
  { v: "low", l: "Faible" },
];

export default function NewTaskPage() {
  const router = useRouter();
  const { projects } = useProjects();
  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!projectId || !title.trim()) {
      setError("Sélectionnez un projet et entrez un titre.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const task = await projectsApi.createTask(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      toast.success("La tâche a été créée.", "Tâche créée");
      router.replace(`/tasks/${task.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Création impossible.";
      setError(message);
      toast.error(message, "Création de la tâche");
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar
        breadcrumb={
          <Breadcrumb items={[{ label: "Tâches", href: "/my-tasks" }, { label: "Nouvelle" }]} />
        }
      />
      <main className="flex-1 px-8 py-7">
        <div className="mx-auto max-w-[680px] rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-2)]">
          <header className="flex items-center justify-between px-6 pt-4 pb-3">
            <h1 className="font-display text-[18px] font-semibold tracking-tight">
              Créer une tâche
            </h1>
            <Link
              href="/my-tasks"
              className="grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))]"
            >
              <X className="h-4 w-4" />
            </Link>
          </header>

          <div className="space-y-4 px-6 pb-4">
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
            <Field label="Titre">
              <Input
                placeholder="Ex. Implémenter la recherche"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
              />
            </Field>
            <Field label="Description">
              <Textarea
                placeholder="Décrivez la tâche…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
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
              <Sparkles className="h-3.5 w-3.5" />
              Astuce : utilisez la planification IA pour générer plusieurs tâches d&apos;un coup.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-6 py-3">
            <Button variant="outline" size="sm" onClick={() => router.back()} disabled={saving}>
              Annuler
            </Button>
            <Button variant="brand" size="sm" onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? "Création…" : "Créer la tâche"}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
