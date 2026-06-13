"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Hourglass, ShieldCheck, KeyRound, Mail, Clock, UserCog } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { routerService, useAuth } from "@/services";

const steps = [
  { label: "Compte créé", sub: "GitHub", icon: Check, state: "done" as const },
  {
    label: "En attente d'approbation",
    sub: "en cours",
    icon: Hourglass,
    state: "current" as const,
  },
  { label: "Approuvé", sub: "à venir", icon: ShieldCheck, state: "future" as const },
  { label: "Accès accordé", sub: "—", icon: KeyRound, state: "future" as const },
];

export default function PendingPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Redirection auto dès que l'admin nous approuve (event socket reçu par
  // AuthProvider qui met à jour user.status).
  useEffect(() => {
    if (user?.status === "APPROVED") {
      router.replace("/dashboard");
    } else if (user?.status === "REJECTED") {
      logout();
      router.replace("/login");
    }
  }, [user?.status, router, logout]);

  return (
    <main className="relative min-h-dvh bg-paper">
      <div className="absolute inset-0 -z-10 bg-aurora opacity-70" />
      <div className="mx-auto flex max-w-[860px] flex-col px-6 pt-10 pb-20">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => routerService.toLogin()}
            className="inline-flex items-center gap-2.5"
          >
            <Logo size={32} />
            <span className="font-display text-[14px] font-semibold tracking-tight">
              AI Task Manager
            </span>
          </button>
          <button
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="text-[12.5px] text-[hsl(var(--ink-3))] hover:text-ink"
          >
            Se déconnecter
          </button>
        </div>

        <section className="mt-12 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--accent-apricot)/0.3)] bg-[hsl(var(--alert-warning-bg))] px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase text-[hsl(22_78%_42%)]">
            <Hourglass className="h-3 w-3" />
            En attente
          </span>
          <h1 className="mt-4 font-display text-[34px] font-semibold leading-[1.08] tracking-tight">
            Compte{" "}
            <span className="font-normal text-[hsl(var(--ink-2))]">
              en attente
            </span>{" "}
            d&apos;approbation
          </h1>
          <p className="mx-auto mt-3 max-w-[480px] text-[14.5px] leading-relaxed text-[hsl(var(--ink-3))]">
            {user ? (
              <>
                Bonjour <span className="font-semibold text-ink">{user.name}</span>,
                votre compte a été créé et sera examiné par un administrateur.
              </>
            ) : (
              <>
                Votre compte a été créé et sera examiné par un administrateur.
              </>
            )}
          </p>
        </section>

        <section className="mt-12">
          <div className="relative">
            <div className="absolute left-[10%] right-[10%] top-[34px] h-px bg-[hsl(var(--line-strong))]" />
            <div
              className="absolute left-[10%] top-[34px] h-px bg-gradient-to-r from-[hsl(var(--accent-sage))] via-[hsl(var(--accent-apricot))] to-transparent"
              style={{ width: "30%" }}
            />
            <ol className="relative grid grid-cols-4 gap-2">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const isDone = s.state === "done";
                const isCurrent = s.state === "current";
                return (
                  <li key={s.label} className="flex flex-col items-center text-center">
                    <span
                      className={`relative grid h-[68px] w-[68px] place-items-center rounded-full border-2 transition-all ${
                        isDone
                          ? "border-[hsl(var(--accent-sage))] bg-[hsl(var(--accent-sage))] text-white shadow-[0_8px_18px_-6px_hsl(var(--accent-sage)/0.5)]"
                          : isCurrent
                            ? "border-[hsl(var(--accent-apricot))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--accent-apricot))] shadow-[0_8px_22px_-4px_hsl(var(--accent-apricot)/0.55)] animate-[float_4s_ease-in-out_infinite]"
                            : "border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--ink-4))]"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      {isCurrent && (
                        <span className="absolute inset-0 -m-2 rounded-full border border-dashed border-[hsl(var(--accent-apricot)/0.5)] animate-[spin_18s_linear_infinite]" />
                      )}
                      <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[hsl(var(--bg-elevated))] text-[10px] font-bold text-[hsl(var(--ink-3))] ring-1 ring-[hsl(var(--line-strong))]">
                        {i + 1}
                      </span>
                    </span>
                    <span className={`mt-3 text-[12.5px] font-semibold tracking-tight ${isCurrent ? "text-ink" : "text-[hsl(var(--ink-2))]"}`}>
                      {s.label}
                    </span>
                    <span className="mt-0.5 text-[11px] text-[hsl(var(--ink-3))]">
                      {s.sub}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="card-paper p-6">
            <h2 className="font-display text-[18px] font-semibold tracking-tight">
              Que se passe-t-il ensuite ?
            </h2>
            <ul className="mt-4 space-y-3.5">
              {[
                { Icon: UserCog, title: "Un administrateur va examiner votre demande", hint: "Vérification de l'organisation et du rôle assigné" },
                { Icon: Mail, title: "Vous recevrez un email à votre approbation", hint: "Vérifiez aussi vos spams si vous ne le recevez pas" },
                { Icon: Clock, title: "Cela prend généralement quelques heures", hint: "En moyenne 2 à 4 heures pendant les jours ouvrés" },
              ].map(({ Icon, title, hint }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-[8px] bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold tracking-tight">{title}</div>
                    <div className="text-[12.5px] text-[hsl(var(--ink-3))]">{hint}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] grain">
            <div className="absolute inset-0 bg-aurora opacity-80" />
            <div className="relative h-full p-6 flex flex-col">
              <div className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[hsl(var(--brand-ink))]">
                Statut
              </div>
              <div className="mt-1.5 text-[28px] leading-tight tracking-tight">
                Patience,
                <br />
                <span className="font-display not-italic font-semibold">
                  approbation imminente.
                </span>
              </div>
              <div className="relative mt-auto pt-6 grid place-items-center">
                <div className="relative h-32 w-32">
                  <div className="absolute inset-0 rounded-full bg-[hsl(var(--accent-apricot)/0.15)] animate-[float_5s_ease-in-out_infinite]" />
                  <div className="absolute inset-3 rounded-full bg-[hsl(var(--accent-apricot)/0.25)] animate-[float_4s_ease-in-out_infinite_0.4s]" />
                  <div className="absolute inset-6 grid place-items-center rounded-full bg-gradient-to-br from-[hsl(var(--accent-apricot))] to-[hsl(23_92%_45%)] text-white shadow-[var(--shadow-2)]">
                    <Hourglass className="h-7 w-7" />
                  </div>
                </div>
              </div>
              {user && (
                <div className="mt-6 flex items-center justify-between text-[11px] text-[hsl(var(--ink-3))]">
                  <span className="truncate">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
