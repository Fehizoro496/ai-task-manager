"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Check,
  Layers,
  ListTree,
  BookCheck,
  FolderKanban,
  Send,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityPill } from "@/components/ui/pill";
import { Select } from "@/components/ui/select";
import { WizardStepper } from "@/components/ai/wizard-stepper";
import { aiApi, toast, useAiGenerationStore, useAuth, useProjects } from "@/services";
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
  description?: string;
  priority?: string;
  labels?: string[];
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
  // L'API renvoie le plan sous `generated_plan` / `plan` (forme { epics: [...] }).
  const payload = (draft.generated_plan ?? draft.plan) as unknown;
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  const epics = (obj.epics ?? obj) as unknown;
  return Array.isArray(epics) ? (epics as PlanEpicShape[]) : [];
}

export function PlanWizard() {
  const router = useRouter();
  const { projects } = useProjects();
  const { isAdmin, status: authStatus } = useAuth();

  // Planification réservée à l'admin : un utilisateur simple est redirigé.
  useEffect(() => {
    if (authStatus === "authenticated" && !isAdmin) router.replace("/dashboard");
  }, [authStatus, isAdmin, router]);
  // Génération pilotée par un store global : survit à la navigation in-app,
  // notifie à la fin, et restitue le brouillon au retour sur la page.
  const {
    status,
    draft,
    projectId: genProjectId,
    error: genError,
    start,
    setDraft,
    reset: resetGeneration,
  } = useAiGenerationStore();
  const loading = status === "generating";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [brief, setBrief] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refineInput, setRefineInput] = useState("");
  const [refining, setRefining] = useState(false);

  // Si la génération est terminée (y compris pendant qu'on était sur une
  // autre page), on affiche l'aperçu au montage / à la transition.
  useEffect(() => {
    if (status === "done" && draft) setStep(2);
  }, [status, draft]);

  const epics = useMemo(() => readPlan(draft), [draft]);
  const storiesTotal = epics.reduce((acc, e) => acc + (e.stories?.length ?? 0), 0);
  const tasksTotal = epics.reduce(
    (acc, e) =>
      acc + (e.stories ?? []).reduce((a, s) => a + (s.tasks?.length ?? 0), 0),
    0,
  );

  async function generate() {
    if (brief.trim().length < 10) return;
    if (!projectId) {
      setError("Sélectionnez d'abord un projet de destination.");
      return;
    }
    setError(null);
    // La génération vit dans le store : on peut quitter la page sans la perdre.
    // Le passage à l'étape 2 se fait via l'effet quand le store est "done".
    await start({ projectId, document: brief.trim() });
  }

  async function refine() {
    const instruction = refineInput.trim();
    if (!draft || instruction.length < 3 || refining) return;
    setRefining(true);
    setError(null);
    try {
      const updated = await aiApi.refineDraft(draft.id, instruction);
      setDraft(updated);
      setRefineInput("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Le raffinement a échoué.";
      setError(message);
      toast.error(message, "Affinage du plan");
    } finally {
      setRefining(false);
    }
  }

  async function approve() {
    if (!draft) return;
    setApproving(true);
    setError(null);
    try {
      await aiApi.approveDraft(draft.id);
      toast.success("Le plan a été converti en epics, stories et tâches.", "Plan approuvé");
      const targetProject = genProjectId ?? projectId;
      resetGeneration();
      if (targetProject) router.push(`/projects/${targetProject}/board`);
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
                <span className="font-normal text-[hsl(var(--ink-2))]">
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

      {(error || genError) && (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-3 py-2 text-[12.5px] text-[hsl(var(--accent-rose))]">
          {error ?? genError}
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
                  <div className="w-[220px]">
                    <Select
                      value={projectId}
                      onChange={setProjectId}
                      placeholder="— Sélectionner un projet —"
                      options={projects.map((p) => ({
                        value: p.id,
                        label: p.name,
                        swatch: p.color ?? undefined,
                      }))}
                      className="h-8 text-[12.5px]"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={generate}
                variant="brand"
                size="lg"
                disabled={loading || brief.trim().length < 10 || !projectId}
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
                {tasksTotal} tâche{tasksTotal > 1 ? "s" : ""}
              </div>
            </div>
          </header>

          <ul className="space-y-1 p-2">
            {epics
              .flatMap((e) => e.stories ?? [])
              .flatMap((s) => s.tasks ?? [])
              .map((task, ti) => (
                <li
                  key={ti}
                  className="flex items-start gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 hover:bg-[hsl(var(--bg-sunken)/0.5)]"
                >
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <span className="text-[13px] font-medium leading-snug tracking-tight">
                        {task.title}
                      </span>
                      <PriorityPill
                        priority={normalizeApiPriority(task.priority)}
                        className="ml-auto shrink-0"
                      />
                    </div>
                    {task.description && (
                      <p className="mt-0.5 text-[12px] leading-relaxed text-[hsl(var(--ink-3))]">
                        {task.description}
                      </p>
                    )}
                    {task.labels && task.labels.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {task.labels.map((l) => (
                          <span
                            key={l}
                            className="rounded-full bg-[hsl(var(--bg-sunken))] px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--ink-3))]"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
          </ul>

          {/* Affiner par la discussion : raffinement itératif sans tout régénérer */}
          <div className="border-t border-[hsl(var(--line))] px-5 py-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
              <MessageSquare className="h-3.5 w-3.5" />
              Affiner avec l&apos;IA
            </div>

            {draft.messages && draft.messages.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {draft.messages.map((m) =>
                  m.role === "user" ? (
                    <li key={m.id} className="flex justify-end">
                      <span className="max-w-[80%] rounded-[var(--radius-md)] rounded-br-sm bg-[hsl(var(--brand))] px-3 py-1.5 text-[12.5px] text-white">
                        {m.content}
                      </span>
                    </li>
                  ) : (
                    <li key={m.id} className="flex items-center gap-1.5 text-[11.5px] text-[hsl(var(--ink-3))]">
                      <Check className="h-3 w-3 text-[hsl(var(--accent-sage))]" />
                      {m.content}
                    </li>
                  ),
                )}
              </ul>
            )}

            <div className="mt-3 rounded-[var(--radius-md)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] focus-within:border-[hsl(var(--brand)/0.5)] focus-within:ring-2 focus-within:ring-[hsl(var(--brand)/0.3)]">
              <textarea
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    refine();
                  }
                }}
                placeholder="Ex. : ajoute un epic sécurité · regroupe les tâches de paiement · simplifie le suivi de progression…"
                rows={2}
                disabled={refining}
                className="block w-full resize-none bg-transparent px-3 py-2.5 text-[13px] placeholder:text-[hsl(var(--ink-4))] focus:outline-none disabled:opacity-60"
              />
              <div className="flex items-center justify-between gap-2 border-t border-[hsl(var(--line))] px-3 py-2">
                <span className="text-[10.5px] text-[hsl(var(--ink-4))]">
                  <kbd className="font-mono">↵</kbd> envoyer · le plan est révisé sans tout régénérer
                </span>
                <Button
                  variant="brand"
                  size="sm"
                  onClick={refine}
                  disabled={refining || refineInput.trim().length < 3}
                >
                  {refining ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Affiner
                </Button>
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-5 py-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetGeneration();
                setStep(1);
              }}
              disabled={refining}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Régénérer
            </Button>
            <Button variant="sage" size="sm" onClick={() => setStep(3)} disabled={refining}>
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
