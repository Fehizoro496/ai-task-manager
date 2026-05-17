"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Loader2 } from "lucide-react";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast, useAuth, useProjects } from "@/services";

export function NewProjectButton() {
  const { isAdmin } = useAuth();
  const { create } = useProjects();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) return null;

  const reset = () => {
    setName("");
    setDescription("");
    setError(null);
    setSaving(false);
  };

  const submit = async () => {
    if (!name.trim()) {
      setError("Le nom du projet est requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const project = await create({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success(`« ${project.name} » a été créé.`, "Projet créé");
      setOpen(false);
      reset();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Création impossible.";
      setError(message);
      toast.error(message, "Création du projet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <Dialog.Trigger asChild>
        <Button variant="brand" size="md">
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[hsl(230_30%_8%/0.45)] backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[500px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between px-6 pt-5">
            <Dialog.Title className="font-display text-[20px] font-semibold tracking-tight">
              Nouveau projet
            </Dialog.Title>
            <Dialog.Close className="grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))]">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="px-6 pb-3 text-[12.5px] text-[hsl(var(--ink-3))]">
            Donnez un nom et une description. Le dépôt GitHub sera créé automatiquement.
          </Dialog.Description>

          <div className="space-y-4 px-6 py-4">
            <Field label="Nom du projet">
              <Input
                placeholder="Ex. Plateforme E-learning"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </Field>

            <Field label="Description">
              <Textarea
                placeholder="Décrivez votre projet…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
              />
            </Field>

            {error && (
              <div className="rounded-[var(--radius-sm)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(348_78%_97%)] px-3 py-2 text-[12px] text-[hsl(var(--accent-rose))]">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-6 py-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button variant="brand" size="sm" onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? "Création…" : "Créer le projet"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
