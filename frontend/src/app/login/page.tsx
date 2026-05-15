"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Shield } from "lucide-react";
import { Github } from "@/components/icons/github";
import { Logo } from "@/components/brand/logo";
import { authApi, useAuth, useAuthStore } from "@/services";

type Phase = "idle" | "redirecting" | "polling" | "error";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setSession } = useAuth();
  const status = useAuthStore((s) => s.status);
  const popupRef = useRef<Window | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleLogin = async () => {
    setError(null);
    setPhase("redirecting");
    try {
      const { url, state } = await authApi.githubInit();
      popupRef.current = window.open(
        url,
        "github-oauth",
        "width=600,height=720,menubar=no,toolbar=no",
      );
      setPhase("polling");

      pollTimer.current = setInterval(async () => {
        try {
          const result = await authApi.githubStatus(state);
          if (result.status === "pending") return;
          stopPolling();
          popupRef.current?.close();

          if (result.status === "success") {
            setSession(result.token, result.user);
            router.replace("/dashboard");
          } else if (result.status === "pending_approval") {
            // Token émis également pour les PENDING : on l'enregistre pour
            // pouvoir ouvrir un socket et recevoir l'event d'approbation.
            if (result.token) setSession(result.token, result.user);
            router.replace("/pending");
          } else if (result.status === "error") {
            setError(result.error);
            setPhase("error");
          } else if (result.status === "expired") {
            setError("La session OAuth a expiré, veuillez réessayer.");
            setPhase("error");
          }
        } catch {
          stopPolling();
          setError("Impossible de joindre le serveur.");
          setPhase("error");
        }
      }, 1500);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Connexion GitHub indisponible.";
      setError(message);
      setPhase("error");
    }
  };

  const busy = phase === "redirecting" || phase === "polling" || status === "loading";

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-paper">
      <div className="absolute inset-0 -z-10 bg-aurora" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.35] bg-grid mask-radial-vignette"
        style={{
          maskImage:
            "radial-gradient(60% 50% at 50% 35%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(60% 50% at 50% 35%, black, transparent 75%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, hsl(239 100% 78% / 0.55), transparent)",
        }}
      />

      <div className="relative w-[400px] max-w-[92vw] animate-[fadeup_0.6s_ease-out_both]">
        <div className="pointer-events-none absolute -inset-10 -z-10 grid place-items-center">
          <div className="h-[420px] w-[420px] rounded-full border border-dashed border-[hsl(var(--line-strong))] opacity-60" />
        </div>

        <div className="grain relative overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)]">
          <div className="px-8 pt-9 pb-8">
            <div className="flex justify-center">
              <Logo size={56} />
            </div>

            <div className="mt-5 text-center">
              <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[hsl(var(--brand-ink))]">
                AI Task Manager
              </div>
              <h1 className="mt-3 text-[26px] leading-[1.1] font-display font-semibold tracking-tight">
                Connectez-vous{" "}
                <span className="font-serif italic font-normal text-[hsl(var(--ink-2))]">
                  avec votre
                </span>{" "}
                compte GitHub
              </h1>
              <p className="mx-auto mt-2.5 max-w-[300px] text-[13.5px] leading-relaxed text-[hsl(var(--ink-3))]">
                Une seule porte d&apos;entrée. Vos projets, votre équipe et la
                planification IA — au même endroit.
              </p>
            </div>

            <button
              onClick={handleLogin}
              disabled={busy}
              className="group mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-md)] bg-[hsl(var(--ink))] text-white font-medium tracking-tight transition-all hover:bg-[hsl(var(--ink)/0.92)] active:translate-y-px shadow-[0_8px_24px_-8px_rgb(0_0_0/0.45),inset_0_1px_0_rgba(255,255,255,0.1)] disabled:cursor-wait disabled:opacity-80"
            >
              {busy ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              ) : (
                <Github className="h-[18px] w-[18px]" />
              )}
              <span>
                {phase === "polling"
                  ? "En attente de la fenêtre GitHub…"
                  : phase === "redirecting"
                    ? "Ouverture de GitHub…"
                    : "Se connecter avec GitHub"}
              </span>
              {!busy && (
                <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              )}
            </button>

            {error && (
              <div className="mt-3 rounded-[var(--radius-sm)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(348_78%_97%)] px-3 py-2 text-[12px] text-[hsl(var(--accent-rose))]">
                {error}
              </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-2 text-[11.5px] text-[hsl(var(--ink-3))]">
              <Shield className="h-3.5 w-3.5" />
              Connexion chiffrée OAuth 2.0
            </div>
          </div>

          <div className="border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.6)] px-8 py-4 text-center text-[12px] text-[hsl(var(--ink-3))]">
            En vous connectant, vous acceptez les{" "}
            <a className="font-medium text-[hsl(var(--brand-ink))] underline-offset-2 hover:underline">
              conditions d&apos;utilisation
            </a>{" "}
            et notre{" "}
            <a className="font-medium text-[hsl(var(--brand-ink))] underline-offset-2 hover:underline">
              politique de confidentialité
            </a>
            .
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px] text-[hsl(var(--ink-3))]">
          <span>v1.0 · Édition équipe</span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-sage))]" />
            Système opérationnel
          </span>
        </div>
      </div>
    </main>
  );
}
