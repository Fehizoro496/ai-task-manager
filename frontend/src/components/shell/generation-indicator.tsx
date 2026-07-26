"use client";
import { usePathname } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { routerService, useAiGenerationStore } from "@/services";
import { cn } from "@/lib/utils";

/**
 * Indicateur global de génération IA.
 *
 * La génération vit dans un store zustand (survit à la navigation in-app) : cet
 * indicateur restitue son état sur TOUTES les pages, mais uniquement quand on a
 * quitté la page de génération (sinon le wizard affiche déjà l'état). Cliquable
 * pour revenir à l'aperçu.
 */
export function GenerationIndicator() {
  const pathname = usePathname();
  const status = useAiGenerationStore((s) => s.status);

  // Sur la page de génération, le wizard porte déjà tout le feedback.
  const onGenerationPage = pathname?.startsWith("/ai/new") ?? false;
  const visible = !onGenerationPage && (status === "generating" || status === "done");
  if (!visible) return null;

  const generating = status === "generating";

  return (
    <div className="mx-3 mt-3">
      <button
        type="button"
        onClick={() => routerService.toAiNew()}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border px-3 py-2 text-left text-[12.5px] font-medium tracking-tight transition-colors",
          generating
            ? "border-[hsl(var(--brand)/0.3)] bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]"
            : "border-[hsl(var(--accent-sage)/0.35)] bg-[hsl(152_50%_92%)] text-[hsl(var(--accent-sage))]",
        )}
      >
        {generating ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 shrink-0" />
        )}
        <span className="min-w-0 flex-1 truncate">
          {generating ? "Génération IA en cours…" : "Plan IA prêt"}
        </span>
        {generating && (
          <span className="flex shrink-0 gap-0.5" aria-hidden>
            <Dot className="[animation-delay:0ms]" />
            <Dot className="[animation-delay:150ms]" />
            <Dot className="[animation-delay:300ms]" />
          </span>
        )}
      </button>
    </div>
  );
}

function Dot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "h-1 w-1 rounded-full bg-current opacity-70 animate-bounce",
        className,
      )}
    />
  );
}
