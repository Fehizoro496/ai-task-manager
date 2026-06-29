"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Shield, Sparkles, Users, Radio } from "lucide-react";
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
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      {/* ── Panneau de marque (éditorial, sombre) ─────────────────────── */}
      <aside
        className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col xl:p-14"
        style={{
          background:
            "radial-gradient(80% 60% at 0% 0%, hsl(239 84% 67% / 0.30), transparent 60%)," +
            "radial-gradient(70% 60% at 100% 100%, hsl(23 92% 60% / 0.20), transparent 55%)," +
            "linear-gradient(160deg, hsl(238 46% 11%), hsl(240 50% 6%))",
        }}
      >
        {/* texture grille + grain + halo */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px)," +
              "linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "38px 38px",
            maskImage: "radial-gradient(80% 70% at 30% 20%, black, transparent 80%)",
            WebkitMaskImage: "radial-gradient(80% 70% at 30% 20%, black, transparent 80%)",
          }}
        />
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-32 top-1/3 h-[460px] w-[460px] rounded-full border border-dashed border-white/10 animate-[spin_36s_linear_infinite]" />
        <div className="pointer-events-none absolute -right-20 top-1/3 h-[300px] w-[300px] translate-y-12 rounded-full border border-white/[0.06]" />

        {/* En-tête marque */}
        <div className="relative flex items-center gap-2.5 animate-[fadeup_0.5s_ease-out_both]">
          <Logo size={34} />
          <span className="text-[15px] font-semibold tracking-tight">
            AI Task <span className="text-white/55">Manager</span>
          </span>
        </div>

        {/* Accroche */}
        <div className="relative mt-auto max-w-[460px]">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/70 animate-[fadeup_0.5s_ease-out_0.05s_both]">
            <Sparkles className="h-3 w-3" />
            Planification augmentée
          </div>
          <h2 className="mt-5 font-display text-[40px] font-semibold leading-[1.05] tracking-tight animate-[fadeup_0.6s_ease-out_0.1s_both] xl:text-[46px]">
            Du brief
            <br />à la roadmap,
            <br />
            <span className="text-white/55">en quelques minutes.</span>
          </h2>
          <p className="mt-4 max-w-[400px] text-[14px] leading-relaxed text-white/65 animate-[fadeup_0.6s_ease-out_0.18s_both]">
            Décrivez un projet, l&apos;IA structure les epics, stories et tâches —
            puis les répartit aux bonnes personnes. Le tout en temps réel.
          </p>
        </div>

        {/* Spec sheet — features */}
        <ul className="relative mt-10 space-y-px animate-[fadeup_0.6s_ease-out_0.26s_both]">
          {[
            { Icon: Sparkles, title: "Planification IA", sub: "Epics · stories · tâches générés" },
            { Icon: Users, title: "Répartition intelligente", sub: "Algorithme hongrois par compétences" },
            { Icon: Radio, title: "Temps réel", sub: "Kanban, messages & notifications" },
          ].map(({ Icon, title, sub }) => (
            <li
              key={title}
              className="flex items-center gap-3 border-t border-white/10 py-3 first:border-t-0"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-white/[0.06] text-white/80 ring-1 ring-white/10">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold tracking-tight">{title}</div>
                <div className="text-[11.5px] text-white/45">{sub}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="relative mt-10 flex items-center justify-between text-[11px] text-white/40 animate-[fadeup_0.6s_ease-out_0.34s_both]">
          <span>v1.0 · Édition équipe</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-sage))] shadow-[0_0_8px_hsl(var(--accent-sage))]" />
            Système opérationnel
          </span>
        </div>
      </aside>

      {/* ── Panneau de connexion ───────────────────────────────────────── */}
      <section className="relative grid place-items-center overflow-hidden bg-paper px-6 py-12">
        <div className="absolute inset-0 -z-10 bg-aurora opacity-70 lg:hidden" />

        <div className="w-full max-w-[380px] animate-[fadeup_0.6s_ease-out_both]">
          {/* Marque visible sur mobile (le panneau de gauche est masqué) */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo size={32} />
            <span className="font-display text-[14px] font-semibold tracking-tight">
              AI Task Manager
            </span>
          </div>

          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--brand-ink))]">
            Connexion
          </div>
          <h1 className="mt-3 font-display text-[28px] font-semibold leading-[1.08] tracking-tight">
            Bon retour parmi{" "}
            <span className="text-[hsl(var(--ink-2))]">vos projets.</span>
          </h1>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-[hsl(var(--ink-3))]">
            Une seule porte d&apos;entrée — votre compte GitHub.
          </p>

          <button
            onClick={handleLogin}
            disabled={busy}
            className="group mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-md)] bg-[hsl(var(--ink))] font-medium tracking-tight text-[hsl(var(--bg-elevated))] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.5),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all hover:-translate-y-px active:translate-y-px disabled:cursor-wait disabled:opacity-80"
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
            <div className="mt-3 rounded-[var(--radius-sm)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-3 py-2 text-[12px] text-[hsl(var(--accent-rose))]">
              {error}
            </div>
          )}

          <div className="mt-5 flex items-center gap-2 text-[11.5px] text-[hsl(var(--ink-3))]">
            <Shield className="h-3.5 w-3.5 text-[hsl(var(--accent-sage))]" />
            Connexion chiffrée — OAuth 2.0, aucun mot de passe stocké.
          </div>

          <div className="mt-8 border-t border-[hsl(var(--line))] pt-5 text-[12px] leading-relaxed text-[hsl(var(--ink-3))]">
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
      </section>
    </main>
  );
}
