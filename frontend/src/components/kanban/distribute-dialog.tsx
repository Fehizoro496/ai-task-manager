"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Sparkles, Wand2, X, Check } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { distributionApi, toast } from "@/services";
import type { DistributionAssignment } from "@/services";
import { cn } from "@/lib/utils";

interface DistributeDialogProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onApplied: () => void;
}

export function DistributeDialog({
  open,
  projectId,
  onClose,
  onApplied,
}: DistributeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [assignments, setAssignments] = useState<DistributionAssignment[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setExcluded(new Set());
    distributionApi
      .distribute(projectId)
      .then((res) => setAssignments(res.assignments))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Calcul impossible."),
      )
      .finally(() => setLoading(false));
  }, [open, projectId]);

  const toggle = (taskId: string) => {
    setExcluded((curr) => {
      const next = new Set(curr);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const selected = assignments.filter((a) => !excluded.has(a.taskId));

  const apply = async () => {
    if (selected.length === 0) return;
    setApplying(true);
    try {
      const res = await distributionApi.apply(
        projectId,
        selected.map((a) => ({ taskId: a.taskId, userId: a.assignee.id })),
      );
      toast.success(
        `${res.updated} tâche${res.updated > 1 ? "s" : ""} assignée${
          res.updated > 1 ? "s" : ""
        }.`,
        "Répartition appliquée",
      );
      onApplied();
      onClose();
    } catch (e) {
      console.error("Apply distribution failed", e);
      toast.error(
        e instanceof Error ? e.message : "Application impossible.",
        "Échec",
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[hsl(230_30%_8%/0.45)] backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[88vh] w-[680px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_1fr_auto] overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <header className="border-b border-[hsl(var(--line))] px-5 py-4">
            <div className="flex items-center justify-between">
              <Dialog.Title className="flex items-center gap-2 font-display text-[18px] font-semibold tracking-tight">
                <Wand2 className="h-4 w-4 text-[hsl(var(--brand-ink))]" />
                Répartition automatique
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <p className="mt-1 text-[12px] text-[hsl(var(--ink-3))]">
              Affectation optimale du backlog non assigné (algorithme hongrois)
              selon compétences, charge et performance.
            </p>
          </header>

          <div className="overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-[hsl(var(--ink-3))]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calcul de l&apos;affectation optimale…
              </div>
            ) : error ? (
              <div className="rounded-[var(--radius-md)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-4 py-3 text-[13px] text-[hsl(var(--accent-rose))]">
                {error}
              </div>
            ) : assignments.length === 0 ? (
              <div className="grid place-items-center py-12 text-center">
                <Sparkles className="h-6 w-6 text-[hsl(var(--ink-4))]" />
                <p className="mt-2 text-[13px] font-medium">
                  Rien à répartir.
                </p>
                <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
                  Toutes les tâches non terminées sont déjà assignées.
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {assignments.map((a) => {
                  const isExcluded = excluded.has(a.taskId);
                  const pct = Math.round(a.score * 100);
                  return (
                    <li key={a.taskId}>
                      <button
                        type="button"
                        onClick={() => toggle(a.taskId)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors",
                          isExcluded
                            ? "border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] opacity-55"
                            : "border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] hover:border-[hsl(var(--brand)/0.4)]",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border",
                            isExcluded
                              ? "border-[hsl(var(--line-strong))]"
                              : "border-[hsl(var(--brand))] bg-[hsl(var(--brand))]",
                          )}
                        >
                          {!isExcluded && (
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {a.identifier && (
                              <span className="font-mono text-[10px] font-semibold tracking-wider text-[hsl(var(--ink-3))]">
                                {a.identifier}
                              </span>
                            )}
                            <span className="truncate text-[12.5px] font-medium">
                              {a.title}
                            </span>
                          </div>
                          {a.labels.length > 0 && (
                            <div className="mt-0.5 flex flex-wrap gap-1">
                              {a.labels.slice(0, 3).map((l) => (
                                <span
                                  key={l}
                                  className="rounded-full bg-[hsl(var(--bg-sunken))] px-1.5 py-px text-[9.5px] text-[hsl(var(--ink-3))]"
                                >
                                  {l}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <span className="font-mono text-[11px] text-[hsl(var(--ink-3))]">
                          {pct}%
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] py-0.5 pl-0.5 pr-2">
                          <Avatar
                            id={a.assignee.id}
                            name={a.assignee.name}
                            size="xs"
                          />
                          <span className="text-[11.5px] font-medium">
                            {a.assignee.name}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-5 py-3">
            <span className="text-[12px] text-[hsl(var(--ink-3))]">
              {selected.length} / {assignments.length} tâche
              {assignments.length > 1 ? "s" : ""} sélectionnée
              {selected.length > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={applying}
              >
                Annuler
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={apply}
                disabled={applying || loading || selected.length === 0}
              >
                {applying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Appliquer
              </Button>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
