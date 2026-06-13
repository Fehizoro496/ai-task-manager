"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Sparkles, Wand2, X } from "lucide-react";
import { skillsApi, useAuth } from "@/services";
import type { Skill, UserSkill } from "@/services";
import { cn } from "@/lib/utils";

const LEVEL_LABEL = ["", "Novice", "Débutant", "Confirmé", "Avancé", "Expert"];

export function SkillsPanel({ userId }: { userId: string }) {
  const { user: currentUser, isAdmin } = useAuth();
  const canEdit = currentUser?.id === userId || isAdmin;

  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [catalog, setCatalog] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [level, setLevel] = useState(3);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    skillsApi
      .listForUser(userId)
      .then((res) => setSkills(res.skills))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!canEdit) return;
    skillsApi
      .listAll()
      .then((res) => setCatalog(res.skills))
      .catch(() => setCatalog([]));
  }, [canEdit]);

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    const owned = new Set(skills.map((s) => s.name));
    return catalog
      .filter((c) => !owned.has(c.name) && (!q || c.name.includes(q)))
      .slice(0, 6);
  }, [catalog, name, skills]);

  const add = async (skillName?: string) => {
    const value = (skillName ?? name).trim();
    if (!value || saving) return;
    setSaving(true);
    try {
      const res = await skillsApi.addOrUpdate(userId, value, level);
      setSkills(res.skills);
      setName("");
      setLevel(3);
    } catch (e) {
      console.error("Add skill failed", e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (skillId: string) => {
    setBusyId(skillId);
    try {
      const res = await skillsApi.remove(userId, skillId);
      setSkills(res.skills);
    } catch (e) {
      console.error("Remove skill failed", e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
      <header className="flex items-center justify-between border-b border-[hsl(var(--line))] px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[hsl(var(--brand-ink))]" />
          <div>
            <h2 className="font-display text-[16px] font-semibold tracking-tight">
              Compétences
            </h2>
            <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
              Utilisées pour la répartition des tâches.
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-[12px] text-[hsl(var(--ink-3))]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Chargement…
          </div>
        ) : skills.length === 0 ? (
          <p className="text-[12.5px] text-[hsl(var(--ink-3))]">
            Aucune compétence renseignée.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <li
                key={s.skillId}
                className="group inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] py-1 pl-2.5 pr-1.5 text-[12px]"
                title={`${LEVEL_LABEL[s.level] ?? ""}${
                  s.source === "derived" ? " · déduit de l'historique" : ""
                }`}
              >
                <span className="font-medium">{s.name}</span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        i < s.level
                          ? "bg-[hsl(var(--brand))]"
                          : "bg-[hsl(var(--bg-sunken))]",
                      )}
                    />
                  ))}
                </span>
                {s.source === "derived" && (
                  <Wand2
                    className="h-3 w-3 text-[hsl(var(--ink-4))]"
                    aria-label="Déduit de l'historique"
                  />
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => remove(s.skillId)}
                    disabled={busyId === s.skillId}
                    className="grid h-4 w-4 place-items-center rounded-full text-[hsl(var(--ink-4))] hover:bg-[hsl(var(--bg-muted))] hover:text-[hsl(var(--accent-rose))] disabled:opacity-50"
                    aria-label={`Retirer ${s.name}`}
                  >
                    {busyId === s.skillId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-2.5 w-2.5" />
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <div className="mt-4 border-t border-dashed border-[hsl(var(--line-strong))] pt-4">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
                  Compétence
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add();
                    }
                  }}
                  placeholder="ex. react, design…"
                  disabled={saving}
                  className="h-9 w-48 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] px-2.5 text-[12.5px] focus:border-[hsl(var(--brand)/0.6)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.3)]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
                  Niveau · {LEVEL_LABEL[level]}
                </span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  disabled={saving}
                  className="h-9 w-40 accent-[hsl(var(--brand))]"
                />
              </label>
              <button
                type="button"
                onClick={() => add()}
                disabled={saving || !name.trim()}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[hsl(var(--brand))] px-3 text-[12px] font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-[hsl(var(--brand-ink))] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Ajouter
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-[hsl(var(--ink-3))]">
                  Suggestions :
                </span>
                {suggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => add(c.name)}
                    disabled={saving}
                    className="rounded-full border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] px-2 py-0.5 text-[11px] text-[hsl(var(--ink-2))] hover:border-[hsl(var(--brand)/0.5)] hover:bg-[hsl(var(--brand-soft)/0.5)] disabled:opacity-50"
                  >
                    + {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
