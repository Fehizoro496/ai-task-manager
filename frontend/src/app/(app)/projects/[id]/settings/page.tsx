"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, AlertTriangle, Palette } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Github } from "@/components/icons/github";
import {
  toast,
  useAuth,
  useProject,
  useProjects,
} from "@/services";
import { colorForProject } from "@/lib/mappers";

const PRESET_COLORS = [
  "#6366F1",
  "#A855F7",
  "#EC4899",
  "#F472B6",
  "#FB7185",
  "#F59E0B",
  "#10B981",
  "#14B8A6",
  "#0EA5E9",
];

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { project, loading } = useProject(projectId);
  const { update, remove } = useProjects();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [identifierPrefix, setIdentifierPrefix] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!project) return;
    setName(project.name);
    setDescription(project.description ?? "");
    setColor(project.color ?? colorForProject(project.id));
    setGithubRepoUrl(project.githubRepoUrl ?? "");
    setIdentifierPrefix(project.identifierPrefix ?? "");
  }, [project]);

  if (loading || !project) {
    return (
      <main className="px-8 py-7">
        <div className="flex items-center gap-2 text-[13px] text-[hsl(var(--ink-3))]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement…
        </div>
      </main>
    );
  }

  const canEdit = isAdmin || project.ownerId === user?.id;
  const canDelete = canEdit;

  const isDirty =
    name !== project.name ||
    description !== (project.description ?? "") ||
    color !== (project.color ?? colorForProject(project.id)) ||
    githubRepoUrl !== (project.githubRepoUrl ?? "") ||
    identifierPrefix !== (project.identifierPrefix ?? "");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Le nom est requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await update(projectId, {
        name: name.trim(),
        description: description.trim(),
        color,
        githubRepoUrl: githubRepoUrl.trim() || null,
        identifierPrefix: identifierPrefix.trim() || undefined,
      });
      toast.success("Modifications enregistrées.", "Projet mis à jour");
    } catch (e) {
      console.error("Update project failed", e);
      const message = e instanceof Error ? e.message : "Mise à jour impossible.";
      setError(message);
      toast.error(message, "Sauvegarde refusée");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await remove(projectId);
      toast.success(`« ${project.name} » a été supprimé.`, "Projet supprimé");
      setConfirmOpen(false);
      router.replace("/projects");
    } catch (e) {
      console.error("Delete project failed", e);
      toast.error(
        e instanceof Error ? e.message : "Suppression impossible.",
        "Suppression refusée",
      );
      setDeleting(false);
    }
  };

  if (!canEdit) {
    return (
      <main className="px-8 py-7">
        <div className="mt-6 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-6 text-[13px] text-[hsl(var(--ink-3))]">
          Seul le propriétaire du projet ou un administrateur peut modifier ces
          paramètres.
        </div>
      </main>
    );
  }

  return (
    <main className="px-8 py-7">
      <div className="mx-auto max-w-[760px] space-y-6">
        {/* Identité */}
        <section className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <header className="border-b border-[hsl(var(--line))] px-5 py-4">
            <h2 className="font-display text-[16px] font-semibold tracking-tight">
              Identité
            </h2>
            <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
              Nom, description et préfixe utilisé pour les codes de tâche.
            </p>
          </header>

          <div className="space-y-4 px-5 py-5">
            <Field label="Nom du projet">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
              />
            </Field>
            <Field
              label="Préfixe d'identifiant"
              hint="Sert à générer les codes de tâche (ex. MP-001)."
            >
              <Input
                value={identifierPrefix}
                onChange={(e) =>
                  setIdentifierPrefix(e.target.value.toUpperCase().slice(0, 10))
                }
                disabled={saving}
                className="font-mono uppercase"
              />
            </Field>
          </div>
        </section>

        {/* Apparence */}
        <section className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <header className="border-b border-[hsl(var(--line))] px-5 py-4">
            <h2 className="font-display text-[16px] font-semibold tracking-tight">
              Apparence
            </h2>
            <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
              Couleur d'accent affichée sur les cartes et la sidebar.
            </p>
          </header>

          <div className="px-5 py-5">
            <Field label="Couleur">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="grid h-10 w-16 place-items-center rounded-[var(--radius-sm)] font-mono text-[11px] font-semibold text-white"
                  style={{ background: color }}
                >
                  <Palette className="h-3.5 w-3.5" />
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={c}
                      style={{
                        background: c,
                        boxShadow:
                          color.toLowerCase() === c.toLowerCase()
                            ? `0 0 0 2px ${c}, inset 0 0 0 2px white`
                            : "inset 0 0 0 1px rgba(0,0,0,0.05)",
                      }}
                      className="h-7 w-7 rounded-full"
                    />
                  ))}
                </div>
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="font-mono uppercase w-[120px]"
                  placeholder="#6366F1"
                  disabled={saving}
                />
              </div>
            </Field>
          </div>
        </section>

        {/* Intégration GitHub */}
        <section className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <header className="border-b border-[hsl(var(--line))] px-5 py-4">
            <h2 className="font-display text-[16px] font-semibold tracking-tight">
              Intégration GitHub
            </h2>
            <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
              Lien vers le dépôt utilisé pour les branches automatiques.
            </p>
          </header>

          <div className="px-5 py-5">
            <Field
              label="URL du dépôt"
              hint="Format : https://github.com/owner/repo"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-2))]">
                  <Github className="h-4 w-4" />
                </span>
                <Input
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  disabled={saving}
                  className="font-mono text-[12.5px]"
                />
              </div>
            </Field>
            {project.githubOwner && project.githubRepo && (
              <p className="mt-2 text-[11.5px] text-[hsl(var(--ink-3))]">
                Détecté :{" "}
                <span className="font-mono text-ink">
                  {project.githubOwner}/{project.githubRepo}
                </span>
              </p>
            )}
          </div>
        </section>

        {error && (
          <div className="rounded-[var(--radius-md)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-4 py-3 text-[13px] text-[hsl(var(--accent-rose))]">
            {error}
          </div>
        )}

        {/* Footer save */}
        <div className="sticky bottom-3 z-10 flex items-center justify-end gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] px-4 py-3 shadow-[var(--shadow-2)]">
          <span className="mr-auto text-[12px] text-[hsl(var(--ink-3))]">
            {isDirty ? "Modifications non enregistrées" : "Aucune modification"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setName(project.name);
              setDescription(project.description ?? "");
              setColor(project.color ?? colorForProject(project.id));
              setGithubRepoUrl(project.githubRepoUrl ?? "");
              setIdentifierPrefix(project.identifierPrefix ?? "");
              setError(null);
            }}
            disabled={!isDirty || saving}
          >
            Annuler
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Enregistrer
          </Button>
        </div>

        {/* Zone danger */}
        {canDelete && (
          <section className="rounded-[var(--radius-lg)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(348_78%_98%)]">
            <header className="border-b border-[hsl(var(--accent-rose)/0.2)] px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-[16px] font-semibold tracking-tight text-[hsl(var(--accent-rose))]">
                <AlertTriangle className="h-4 w-4" />
                Zone dangereuse
              </h2>
              <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
                Action irréversible : supprime le projet et toutes ses tâches.
              </p>
            </header>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-[13.5px] font-semibold tracking-tight">
                  Supprimer ce projet
                </div>
                <div className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
                  Le projet, ses epics, stories et tâches seront définitivement
                  retirés.
                </div>
              </div>
              <button
                onClick={() => setConfirmOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[hsl(var(--accent-rose))] px-3 text-[12.5px] font-semibold text-white hover:bg-[hsl(348_70%_50%)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Dialog confirmation */}
      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[hsl(230_30%_8%/0.45)] backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-6 shadow-[var(--shadow-3)]">
            <Dialog.Title className="font-display text-[18px] font-semibold tracking-tight">
              Supprimer « {project.name} » ?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-[13px] leading-relaxed text-[hsl(var(--ink-2))]">
              Cette action est <strong>irréversible</strong>. Tous les epics,
              stories et tâches du projet seront perdus définitivement.
            </Dialog.Description>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
              >
                Annuler
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[hsl(var(--accent-rose))] px-3 text-[12.5px] font-semibold text-white hover:bg-[hsl(348_70%_50%)] disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Confirmer la suppression
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
