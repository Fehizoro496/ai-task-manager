"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  RefreshCw,
  Check,
  Layers,
  ListTree,
  BookCheck,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityPill } from "@/components/ui/pill";
import { WizardStepper } from "@/components/ai/wizard-stepper";
import { aiApi, toast, useProjects } from "@/services";
import type { AiDraft } from "@/services";
import { normalizeApiPriority, projectPrefix } from "@/lib/mappers";
import { cn } from "@/lib/utils";

const EXAMPLE = `Je veux créer une plateforme e-learning avec les fonctionnalités suivantes :
- Authentification des utilisateurs
- Catalogue de cours
- Système de paiement
- Suivi de progression`;

interface PlanTaskShape {
  title: string;
  priority?: string;
}
interface PlanStoryShape {
  title: string;
  tasks?: PlanTaskShape[];
}
interface PlanEpicShape {
  title: string;
  stories?: PlanStoryShape[];
}

function readPlan(draft: AiDraft | null): PlanEpicShape[] {
  if (!draft) return [];
  const payload = draft.payload as unknown;
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  const epics = (obj.epics ?? obj.plan ?? obj) as unknown;
  return Array.isArray(epics) ? (epics as PlanEpicShape[]) : [];
}

export function PlanWizard() {
  const router = useRouter();
  const { projects } = useProjects();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState("Standard");
  const [projectId, setProjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [draft, setDraft] = useState<AiDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openEpic, setOpenEpic] = useState<number | null>(0);

  const epics = useMemo(() => readPlan(draft), [draft]);
  const storiesTotal = epics.reduce((acc, e) => acc + (e.stories?.length ?? 0), 0);
  const tasksTotal = epics.reduce(
    (acc, e) =>
      acc + (e.stories ?? []).reduce((a, s) => a + (s.tasks?.length ?? 0), 0),
    0,
  );

  async function generate() {
    if (brief.trim().length < 10) return;
    setError(null);
    setLoading(true);
    try {
      const created = await aiApi.generatePlan({
        document: brief.trim(),
        projectId: projectId || undefined,
      });
      setDraft(created);
      setStep(2);
    } catch (e) {
      const message = e instanceof Error ? e.message : "La génération a échoué.";
      setError(message);
      toast.error(message, "Génération du plan");
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (!draft) return;
    setApproving(true);
    setError(null);
    try {
      await aiApi.approveDraft(draft.id);
      toast.success("Le plan a été converti en epics, stories et tâches.", "Plan approuvé");
      if (projectId) router.push(`/projects/${projectId}/board`);
      else router.push("/projects");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Approbation impossible.";
      setError(message);
      toast.error(message, "Approbation du plan");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[920px]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--brand-soft))] px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[hsl(var(--brand-ink))]">
            <Sparkles className="h-3 w-3" /> Planification IA
          </span>
          <h1 className="mt-3 font-display text-[28px] font-semibold tracking-tight leading-tight">
            {step === 1 && (
              <>
                Décrivez votre projet —{" "}
                <span className="font-serif italic font-normal text-[hsl(var(--ink-2))]">
                  l&apos;IA s&apos;occupe du reste
                </span>
              </>
            )}
            {step === 2 && "Aperçu du plan généré"}
            {step === 3 && "Confirmation et création"}
          </h1>
        </div>
        <WizardStepper step={step} />
      </header>

      {error && (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-3 py-2 text-[12.5px] text-[hsl(var(--accent-rose))]">
          {error}
        </div>
      )}

      {step === 1 && (
        <section className="mt-6 rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <div className="p-5">
            <p className="text-[13px] text-[hsl(var(--ink-3))]">
              Décrivez votre projet ou collez vos spécifications ici…
            </p>
            <div className="relative mt-3">
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder={EXAMPLE}
                rows={12}
                className="w-full resize-none rounded-[var(--radius-md)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] p-4 text-[13.5px] font-mono leading-relaxed text-ink placeholder:text-[hsl(var(--ink-4))] focus:border-[hsl(var(--brand)/0.6)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.3)]"
              />
              <span className="pointer-events-none absolute bottom-3 right-4 font-mono text-[10.5px] text-[hsl(var(--ink-3))]">
                {brief.length} / 4000
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[12.5px]">
                  <span className="text-[hsl(var(--ink-3))]">Projet :</span>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="h-8 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-2.5 text-[12.5px]"
                  >
                    <option value="">— Aucun (brouillon seul) —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 text-[12.5px]">
                  <span className="text-[hsl(var(--ink-3))]">Ton :</span>
                  <div className="inline-flex items-center gap-0.5 rounded-[var(--radius-sm)] bg-[hsl(var(--bg-sunken)/0.7)] p-0.5">
                    {["Concis", "Standard", "Détaillé"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={cn(
                          "h-7 rounded-[6px] px-2.5 text-[11.5px] font-medium",
                          tone === t
                            ? "bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)] text-ink"
                            : "text-[hsl(var(--ink-3))]",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={generate}
                variant="brand"
                size="lg"
                disabled={loading || brief.trim().length < 10}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Générer avec l&apos;IA
              </Button>
            </div>
          </div>
          <footer className="border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-5 py-3 text-[11.5px] text-[hsl(var(--ink-3))]">
            Astuce : plus votre brief est précis, plus le plan sera fidèle.
          </footer>
        </section>
      )}

      {step === 2 && draft && (
        <section className="mt-6 rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <header className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[hsl(var(--line))]">
            <div>
              <div className="font-display text-[16px] font-semibold tracking-tight">
                Aperçu du plan généré par l&apos;IA
              </div>
              <div className="mt-1 text-[12px] text-[hsl(var(--ink-3))]">
                {epics.length} epics · {storiesTotal} stories · {tasksTotal} tâches
              </div>
            </div>
          </header>

          <div className="p-2">
            {epics.map((epic, ei) => {
              const open = openEpic === ei;
              const epicTasks =
                epic.stories?.reduce((acc, s) => acc + (s.tasks?.length ?? 0), 0) ?? 0;
              return (
                <div key={ei} className="rounded-[var(--radius-md)] m-1">
                  <button
                    onClick={() => setOpenEpic(open ? null : ei)}
                    className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-left hover:bg-[hsl(var(--bg-sunken)/0.5)]"
                  >
                    <Layers className="h-4 w-4 text-[hsl(var(--brand))]" />
                    <span className="font-semibold text-[14px]">
                      Epic {ei + 1} — {epic.title}
                    </span>
                    <span className="ml-2 rounded-md bg-[hsl(var(--bg-sunken))] px-1.5 py-0.5 text-[10.5px] font-semibold text-[hsl(var(--ink-2))]">
                      {epic.stories?.length ?? 0} stories
                    </span>
                    <span className="ml-1 rounded-md bg-[hsl(var(--bg-sunken))] px-1.5 py-0.5 text-[10.5px] font-semibold text-[hsl(var(--ink-2))]">
                      {epicTasks} tâches
                    </span>
                    <ChevronDown
                      className={cn(
                        "ml-auto h-4 w-4 text-[hsl(var(--ink-3))] transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                  {open && (
                    <div className="ml-6 mb-2 border-l border-dashed border-[hsl(var(--line-strong))] pl-4">
                      {(epic.stories ?? []).map((story, si) => (
                        <div key={si} className="mt-2">
                          <div className="flex items-center gap-2">
                            <ListTree className="h-3.5 w-3.5 text-[hsl(var(--accent-apricot))]" />
                            <span className="font-semibold text-[13px] tracking-tight">
                              Story {ei + 1}.{si + 1} — {story.title}
                            </span>
                            <span className="ml-2 text-[11px] text-[hsl(var(--ink-3))]">
                              {story.tasks?.length ?? 0} tâches
                            </span>
                          </div>
                          <ul className="ml-5 mt-1 space-y-1">
                            {(story.tasks ?? []).map((task, ti) => (
                              <li
                                key={ti}
                                className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1 hover:bg-[hsl(var(--bg-sunken)/0.6)]"
                              >
                                <span className="grid h-4 w-4 place-items-center rounded border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))]" />
                                <span className="text-[12.5px] tracking-tight">
                                  Tâche {ti + 1} — {task.title}
                                </span>
                                <PriorityPill
                                  priority={normalizeApiPriority(task.priority)}
                                  className="ml-auto"
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-5 py-3">
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              <RefreshCw className="h-3.5 w-3.5" />
              Régénérer
            </Button>
            <Button variant="sage" size="sm" onClick={() => setStep(3)}>
              Continuer
            </Button>
          </footer>
        </section>
      )}

      {step === 3 && draft && (
        <section className="mt-6 rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <header className="border-b border-[hsl(var(--line))] px-5 pt-4 pb-3">
            <h2 className="font-display text-[16px] font-semibold tracking-tight">
              Résumé du plan
            </h2>
            <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
              Vérifiez puis approuvez le plan pour créer les entités.
            </p>
          </header>

          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <Summary Icon={Layers} label="Epics" value={epics.length} tone="brand" />
            <Summary Icon={BookCheck} label="Stories" value={storiesTotal} tone="apricot" />
            <Summary Icon={ListTree} label="Tâches" value={tasksTotal} tone="sage" />
          </div>

          <div className="px-5 pb-5">
            <div className="rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] p-4">
              <div className="text-[13px] font-semibold tracking-tight">
                Approuver et créer les entités ?
              </div>
              <p className="mt-1 text-[12.5px] text-[hsl(var(--ink-3))]">
                Le plan sera converti en epics, stories et tâches dans le projet associé.
              </p>
              {projectId && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-[hsl(var(--ink-3))]" />
                  <span className="text-[12.5px] text-[hsl(var(--ink-3))]">Projet :</span>
                  <span className="font-mono text-[12.5px]">
                    {projects.find((p) => p.id === projectId)?.name ?? projectId}{" "}
                    ({projectPrefix(projects.find((p) => p.id === projectId))}-)
                  </span>
                </div>
              )}
            </div>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-5 py-3">
            <Button variant="outline" size="sm" onClick={() => setStep(2)} disabled={approving}>
              Retour
            </Button>
            <Button variant="brand" size="sm" onClick={approve} disabled={approving}>
              {approving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Approuver et créer
            </Button>
          </footer>
        </section>
      )}
    </div>
  );
}

function Summary({
  Icon,
  label,
  value,
  tone,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "brand" | "sage" | "apricot";
}) {
  const map = {
    brand: "bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]",
    sage: "bg-[hsl(152_50%_92%)] text-[hsl(var(--accent-sage))]",
    apricot: "bg-[hsl(23_92%_94%)] text-[hsl(22_78%_42%)]",
  } as const;
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-4">
      <span className={cn("grid h-10 w-10 place-items-center rounded-[10px]", map[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="font-display text-[24px] font-semibold tabular leading-none">
          {value}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.14em] font-semibold text-[hsl(var(--ink-3))]">
          {label}
        </div>
      </div>
    </div>
  );
}
