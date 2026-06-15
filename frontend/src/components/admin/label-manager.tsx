"use client";
import { useEffect, useState } from "react";
import { Loader2, Plus, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { labelsApi, toast } from "@/services";
import type { Label } from "@/services";

export function LabelManager() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    labelsApi
      .listAll()
      .then((res) => setLabels(res.labels))
      .catch(() => setLabels([]))
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    const value = name.trim().toLowerCase();
    if (!value || saving) return;
    setSaving(true);
    try {
      const created = await labelsApi.create(value);
      setLabels((curr) =>
        [...curr.filter((l) => l.id !== created.id), created].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setName("");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Création impossible.",
        "Label refusé",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await labelsApi.remove(id);
      setLabels((curr) => curr.filter((l) => l.id !== id));
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Suppression impossible.",
        "Refusé",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-6 rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
      <header className="flex items-center gap-2 border-b border-[hsl(var(--line))] px-5 py-4">
        <Tag className="h-4 w-4 text-[hsl(var(--brand-ink))]" />
        <div>
          <h2 className="font-display text-[16px] font-semibold tracking-tight">
            Catalogue de labels
          </h2>
          <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
            Seuls ces labels sont utilisables sur les tâches et par l&apos;IA.
          </p>
        </div>
      </header>

      <div className="px-5 py-4">
        <div className="flex items-end gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="ex. auth, ui, paiement…"
            disabled={saving}
            className="h-9 w-56 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] px-2.5 text-[12.5px] lowercase focus:border-[hsl(var(--brand)/0.6)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.3)]"
          />
          <Button variant="brand" size="sm" onClick={add} disabled={saving || !name.trim()}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Ajouter
          </Button>
        </div>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-[12px] text-[hsl(var(--ink-3))]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Chargement…
          </div>
        ) : labels.length === 0 ? (
          <p className="mt-4 text-[12.5px] text-[hsl(var(--ink-3))]">
            Aucun label. Ajoutez-en pour structurer les tâches.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {labels.map((l) => (
              <li
                key={l.id}
                className="group inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] py-1 pl-2.5 pr-1.5 text-[12px]"
              >
                <span className="font-medium">{l.name}</span>
                <button
                  type="button"
                  onClick={() => remove(l.id)}
                  disabled={busyId === l.id}
                  className="grid h-4 w-4 place-items-center rounded-full text-[hsl(var(--ink-4))] hover:bg-[hsl(var(--bg-muted))] hover:text-[hsl(var(--accent-rose))] disabled:opacity-50"
                  aria-label={`Supprimer ${l.name}`}
                >
                  {busyId === l.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-2.5 w-2.5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
