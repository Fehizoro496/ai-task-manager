"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Bell,
  Palette,
  Plug,
  Shield,
  Users,
  CreditCard,
  Sparkles,
  Check,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Loader2,
  Save,
} from "lucide-react";
import { Github } from "@/components/icons/github";
import { Slack, Figma } from "@/components/icons/brand-icons";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import {
  adminApi,
  authApi,
  toast,
  useAuth,
  useAuthStore,
} from "@/services";
import type {
  AppearancePrefs,
  NotificationsPrefs,
  User,
} from "@/services";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "compte",        label: "Compte",        Icon: UserIcon,   group: "Vous"    },
  { id: "apparence",     label: "Apparence",     Icon: Palette,    group: "Vous"    },
  { id: "notifications", label: "Notifications", Icon: Bell,       group: "Vous"    },
  { id: "integrations",  label: "Intégrations",  Icon: Plug,       group: "Équipe"  },
  { id: "membres",       label: "Membres",       Icon: Users,      group: "Équipe"  },
  { id: "securite",      label: "Sécurité",      Icon: Shield,     group: "Équipe"  },
  { id: "facturation",   label: "Facturation",   Icon: CreditCard, group: "Équipe"  },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function SettingsShell() {
  const [active, setActive] = useState<SectionId>("compte");

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-[80px] lg:self-start">
        <nav>
          {(["Vous", "Équipe"] as const).map((group) => (
            <div key={group} className="mb-4">
              <div className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
                {group}
              </div>
              <ul className="flex flex-col gap-0.5">
                {SECTIONS.filter((s) => s.group === group).map((s) => {
                  const isActive = active === s.id;
                  const Icon = s.Icon;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setActive(s.id)}
                        className={cn(
                          "group flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-[13.5px] font-medium tracking-tight transition-colors",
                          isActive
                            ? "bg-[hsl(var(--bg-elevated))] text-ink shadow-[var(--shadow-1)] border border-[hsl(var(--line))]"
                            : "text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--bg-sunken)/0.6)]",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isActive
                              ? "text-[hsl(var(--brand-ink))]"
                              : "text-[hsl(var(--ink-3))]",
                          )}
                        />
                        {s.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        {active === "compte" && <AccountSection />}
        {active === "apparence" && <AppearanceSection />}
        {active === "notifications" && <NotificationsSection />}
        {active === "integrations" && <IntegrationsSection />}
        {active === "membres" && <MembersSection />}
        {active === "securite" && <SecuritySection />}
        {active === "facturation" && <ComingSoonSection title="Facturation" message="Forfaits, factures et moyens de paiement. À venir." />}
      </div>
    </div>
  );
}

/* ---------- Reusable bits ---------- */

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
      <header className="border-b border-[hsl(var(--line))] px-6 py-4">
        <h2 className="font-display text-[16px] font-semibold tracking-tight">
          {title}
        </h2>
        {hint && (
          <p className="mt-0.5 text-[12.5px] text-[hsl(var(--ink-3))]">{hint}</p>
        )}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function ComingSoonSection({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Panel title={title}>
      <div className="grid place-items-center py-8 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-3))]">
          <Sparkles className="h-4 w-4" />
        </span>
        <p className="mt-3 max-w-[360px] text-[13px] text-[hsl(var(--ink-3))]">
          {message}
        </p>
      </div>
    </Panel>
  );
}

/* ---------- Compte ---------- */

function AccountSection() {
  const { user, logout } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user?.id, user?.name, user]);

  if (!user) return null;

  const roleLabel = user.role === "ADMIN" ? "Administrateur" : "Membre";
  const isDirty = name.trim() !== user.name && name.trim().length > 0;

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      const updated = await authApi.updateMe({ name: name.trim() });
      setUser(updated);
      toast.success("Profil mis à jour.", "Enregistré");
    } catch (e) {
      console.error("Update profile failed", e);
      toast.error(
        e instanceof Error ? e.message : "Sauvegarde impossible.",
        "Profil",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel
        title="Profil"
        hint="Informations visibles par les autres membres du workspace."
      >
        <div className="flex items-center gap-5 pb-5 border-b border-[hsl(var(--line))]">
          <Avatar
            id={user.id}
            name={user.name}
            size="2xl"
            className="ring-4 ring-[hsl(var(--bg-elevated))] shadow-[var(--shadow-2)]"
          />
          <div>
            <div className="font-display text-[18px] font-semibold tracking-tight">
              {user.name}
            </div>
            <div className="text-[12.5px] text-[hsl(var(--ink-3))]">
              {user.email}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="brand">{roleLabel}</Badge>
              <Badge tone={user.status === "APPROVED" ? "sage" : "neutral"}>
                {user.status}
              </Badge>
              <Badge tone="neutral">
                <Github className="h-2.5 w-2.5" /> GitHub
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 pt-5 sm:grid-cols-2">
          <Field label="Nom complet">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </Field>
          <Field label="Email" hint="Synchronisé depuis GitHub.">
            <Input
              value={user.email}
              readOnly
              className="bg-[hsl(var(--bg-sunken))]"
            />
          </Field>
          <Field label="Rôle">
            <Input
              value={roleLabel}
              readOnly
              className="bg-[hsl(var(--bg-sunken))]"
            />
          </Field>
          <Field label="Identifiant">
            <Input
              value={user.id}
              readOnly
              className="bg-[hsl(var(--bg-sunken))] font-mono text-[11.5px]"
            />
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setName(user.name)}
            disabled={!isDirty || saving}
          >
            Annuler
          </Button>
          <Button variant="brand" size="sm" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Enregistrer
          </Button>
        </div>
      </Panel>

      <Panel title="Session">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold tracking-tight">
              Se déconnecter de cet onglet
            </div>
            <div className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
              La session est stockée par onglet (sessionStorage) — fermer
              l&apos;onglet déconnecte aussi.
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </Button>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Hook commun aux préférences backend ---------- */

const DEFAULT_APPEARANCE: AppearancePrefs = {
  theme: "clair",
  accent: "#6366F1",
  density: "standard",
};

const DEFAULT_NOTIFICATIONS: NotificationsPrefs = {
  dailyDigest: true,
  push: false,
  weekendQuiet: true,
  sounds: false,
};

function usePrefsSync() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [saving, setSaving] = useState(false);

  const updateAppearance = useCallback(
    async (patch: Partial<AppearancePrefs>) => {
      if (!user) return;
      const optimistic = {
        appearance: {
          ...(user.preferences?.appearance ?? DEFAULT_APPEARANCE),
          ...patch,
        } as AppearancePrefs,
        notifications:
          user.preferences?.notifications ?? DEFAULT_NOTIFICATIONS,
      };
      setUser({ ...user, preferences: optimistic });
      setSaving(true);
      try {
        const updated = await authApi.updateMe({
          preferences: { appearance: patch },
        });
        setUser(updated);
      } catch (e) {
        // rollback
        setUser(user);
        toast.error(
          e instanceof Error ? e.message : "Sauvegarde impossible.",
          "Apparence",
        );
      } finally {
        setSaving(false);
      }
    },
    [user, setUser],
  );

  const updateNotifications = useCallback(
    async (patch: Partial<NotificationsPrefs>) => {
      if (!user) return;
      const optimistic = {
        appearance: user.preferences?.appearance ?? DEFAULT_APPEARANCE,
        notifications: {
          ...(user.preferences?.notifications ?? DEFAULT_NOTIFICATIONS),
          ...patch,
        } as NotificationsPrefs,
      };
      setUser({ ...user, preferences: optimistic });
      setSaving(true);
      try {
        const updated = await authApi.updateMe({
          preferences: { notifications: patch },
        });
        setUser(updated);
      } catch (e) {
        setUser(user);
        toast.error(
          e instanceof Error ? e.message : "Sauvegarde impossible.",
          "Notifications",
        );
      } finally {
        setSaving(false);
      }
    },
    [user, setUser],
  );

  return { user, saving, updateAppearance, updateNotifications };
}

/* ---------- Apparence ---------- */

function AppearanceSection() {
  const { user, saving, updateAppearance } = usePrefsSync();
  const prefs = user?.preferences?.appearance ?? DEFAULT_APPEARANCE;

  const accents = [
    { name: "Indigo", color: "#6366F1" },
    { name: "Teal", color: "#14B8A6" },
    { name: "Rose", color: "#EC4899" },
    { name: "Amber", color: "#F59E0B" },
    { name: "Émeraude", color: "#10B981" },
    { name: "Pourpre", color: "#A855F7" },
  ];

  return (
    <div className="space-y-5">
      <Panel title="Thème" hint="Choisissez l'allure de l'interface.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { v: "clair", l: "Clair", Icon: Sun },
            { v: "sombre", l: "Sombre", Icon: Moon },
            { v: "systeme", l: "Système", Icon: Monitor },
          ].map(({ v, l, Icon }) => (
            <button
              key={v}
              disabled={saving}
              onClick={() => updateAppearance({ theme: v as AppearancePrefs["theme"] })}
              className={cn(
                "relative overflow-hidden rounded-[var(--radius-md)] border p-3 text-left transition-all",
                prefs.theme === v
                  ? "border-[hsl(var(--brand))] shadow-[0_0_0_3px_hsl(var(--brand)/0.18)]"
                  : "border-[hsl(var(--line-strong))] hover:border-[hsl(var(--ink-4))]",
              )}
            >
              <div
                className={cn(
                  "h-16 rounded-[var(--radius-sm)] border",
                  v === "clair" && "bg-[hsl(44_38%_97%)] border-[hsl(var(--line))]",
                  v === "sombre" && "bg-[hsl(230_22%_12%)] border-[hsl(230_18%_25%)]",
                  v === "systeme" && "bg-gradient-to-r from-[hsl(44_38%_97%)] to-[hsl(230_22%_12%)]",
                )}
              />
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-[hsl(var(--ink-3))]" />
                  <span className="text-[12.5px] font-medium">{l}</span>
                </div>
                {prefs.theme === v && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-[hsl(var(--brand))] text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-[hsl(var(--ink-3))]">
          Synchronisé sur votre compte — appliqué instantanément sur tous vos
          appareils.
        </p>
      </Panel>

      <Panel title="Accent" hint="La teinte de marque utilisée dans toute l'app.">
        <div className="flex flex-wrap items-center gap-2.5">
          {accents.map((a) => (
            <button
              key={a.color}
              disabled={saving}
              onClick={() => updateAppearance({ accent: a.color })}
              title={a.name}
              className="grid h-10 w-10 place-items-center rounded-full transition-transform hover:scale-105 disabled:opacity-50"
              style={{
                background: a.color,
                boxShadow:
                  prefs.accent === a.color
                    ? `0 0 0 3px hsl(var(--bg-elevated)), 0 0 0 5px ${a.color}`
                    : "inset 0 0 0 1px rgba(0,0,0,0.08)",
              }}
              aria-label={a.name}
            >
              {prefs.accent === a.color && (
                <Check className="h-4 w-4 text-white" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Densité" hint="Compact pour les power users, confort pour les longues sessions.">
        <div className="inline-flex rounded-[var(--radius-sm)] bg-[hsl(var(--bg-sunken)/0.7)] p-0.5">
          {(["compact", "standard", "confort"] as const).map((d) => (
            <button
              key={d}
              disabled={saving}
              onClick={() => updateAppearance({ density: d })}
              className={cn(
                "h-9 rounded-[6px] px-4 text-[12.5px] font-medium capitalize",
                prefs.density === d
                  ? "bg-[hsl(var(--bg-elevated))] text-ink shadow-[var(--shadow-1)]"
                  : "text-[hsl(var(--ink-3))]",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Notifications ---------- */

function NotificationsSection() {
  const { user, saving, updateNotifications } = usePrefsSync();
  const prefs = user?.preferences?.notifications ?? DEFAULT_NOTIFICATIONS;

  const rows: { key: keyof NotificationsPrefs; title: string; hint: string }[] = [
    {
      key: "dailyDigest",
      title: "Résumé quotidien à 9h00",
      hint: "Brief des tâches du jour et des échéances.",
    },
    {
      key: "push",
      title: "Notifications push navigateur",
      hint: "Alerte instantanée même quand l'onglet est fermé.",
    },
    {
      key: "weekendQuiet",
      title: "Mode silencieux le week-end",
      hint: "Du vendredi 18h au lundi 8h, on respire.",
    },
    {
      key: "sounds",
      title: "Sons d'interface",
      hint: "Ping discret sur les mentions seulement.",
    },
  ];

  return (
    <Panel
      title="Préférences"
      hint="Synchronisées sur votre compte — actives sur tous vos appareils."
    >
      {rows.map((row, i) => (
        <div
          key={row.key}
          className={cn(
            "flex items-center gap-4 py-3",
            i < rows.length - 1 && "border-b border-[hsl(var(--line))]",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-medium tracking-tight">
              {row.title}
            </div>
            <div className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
              {row.hint}
            </div>
          </div>
          <button
            disabled={saving}
            onClick={() => updateNotifications({ [row.key]: !prefs[row.key] })}
            aria-pressed={prefs[row.key]}
            className={cn(
              "relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors disabled:opacity-60",
              prefs[row.key]
                ? "bg-[hsl(var(--brand))]"
                : "bg-[hsl(var(--bg-sunken))] ring-1 ring-inset ring-[hsl(var(--line-strong))]",
            )}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform",
                prefs[row.key] ? "translate-x-[16px]" : "translate-x-0",
              )}
            />
          </button>
        </div>
      ))}
    </Panel>
  );
}

/* ---------- Intégrations ---------- */

function IntegrationsSection() {
  const { user } = useAuth();
  // Tous les users passent par GitHub OAuth → toujours connecté
  const githubConnected = !!user;

  const items = [
    {
      name: "GitHub",
      desc: "Connexion OAuth, création automatique de branches sur les tâches.",
      Icon: Github,
      tone: "bg-[hsl(230_18%_12%)] text-white",
      connected: githubConnected,
      meta: githubConnected
        ? `Authentifié en tant que ${user?.email}`
        : "Non lié",
      action: githubConnected ? "Reconnecté via /login" : "Se connecter",
    },
    {
      name: "Slack",
      desc: "Recevez les notifications dans un canal d'équipe.",
      Icon: Slack,
      tone: "bg-[hsl(280_60%_94%)] text-[hsl(280_60%_38%)]",
      connected: false,
      meta: "Intégration à venir",
      action: "Bientôt",
    },
    {
      name: "Figma",
      desc: "Lien direct vers les frames depuis les tâches.",
      Icon: Figma,
      tone: "bg-[hsl(348_78%_94%)] text-[hsl(var(--accent-rose))]",
      connected: false,
      meta: "Intégration à venir",
      action: "Bientôt",
    },
    {
      name: "OpenAI",
      desc: "Modèle utilisé pour la planification IA des epics/stories/tâches.",
      Icon: Sparkles,
      tone: "bg-gradient-to-br from-[hsl(var(--brand))] to-[#A78BFA] text-white",
      connected: true,
      meta: "Configurée côté serveur (variable d'env OPENAI_API_KEY)",
      action: "Configuré",
    },
  ];

  return (
    <Panel
      title="Intégrations"
      hint="Connectez les outils que votre équipe utilise déjà."
    >
      <ul className="divide-y divide-[hsl(var(--line))]">
        {items.map((it) => (
          <li key={it.name} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <span className={cn("grid h-11 w-11 place-items-center rounded-[10px]", it.tone)}>
              <it.Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-[14.5px] font-semibold tracking-tight">
                  {it.name}
                </span>
                {it.connected ? (
                  <Badge tone="sage">
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-sage))]" />
                    Connecté
                  </Badge>
                ) : (
                  <Badge tone="neutral">Non connecté</Badge>
                )}
              </div>
              <div className="mt-0.5 text-[12.5px] text-[hsl(var(--ink-3))]">
                {it.desc}
              </div>
              <div className="mt-1 text-[11px] text-[hsl(var(--ink-4))]">
                {it.meta}
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              {it.action}
            </Button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ---------- Membres ---------- */

function MembersSection() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { users } = await adminApi.listUsers();
      setMembers(users);
    } catch (e) {
      console.error("List users failed", e);
      toast.error(
        e instanceof Error ? e.message : "Chargement impossible.",
        "Membres",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) refresh();
    else setLoading(false);
  }, [isAdmin, refresh]);

  if (!isAdmin) {
    return (
      <Panel
        title="Membres"
        hint="Seuls les administrateurs voient cette section."
      >
        <p className="py-6 text-center text-[13px] text-[hsl(var(--ink-3))]">
          Vous n&apos;avez pas les droits pour gérer les membres.
        </p>
      </Panel>
    );
  }

  const handleApprove = async (id: string) => {
    setPendingId(id);
    try {
      await adminApi.approveUser(id);
      toast.success("Utilisateur approuvé.", "Membres");
      await refresh();
    } catch (e) {
      console.error("Approve user failed", e);
      toast.error(
        e instanceof Error ? e.message : "Approbation impossible.",
        "Membres",
      );
    } finally {
      setPendingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setPendingId(id);
    try {
      await adminApi.rejectUser(id);
      toast.info("Utilisateur rejeté.", "Membres");
      await refresh();
    } catch (e) {
      console.error("Reject user failed", e);
      toast.error(
        e instanceof Error ? e.message : "Rejet impossible.",
        "Membres",
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Panel
      title="Membres de l'organisation"
      hint={
        loading
          ? "Chargement…"
          : `${members.length} compte${members.length > 1 ? "s" : ""}`
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-[hsl(var(--ink-3))]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement…
        </div>
      ) : members.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[hsl(var(--ink-3))]">
          Aucun membre.
        </p>
      ) : (
        <ul className="divide-y divide-[hsl(var(--line))]">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Link
                href={`/users/${m.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90"
              >
                <Avatar id={m.id} name={m.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold tracking-tight hover:underline">
                    {m.name}
                  </div>
                  <div className="text-[11.5px] text-[hsl(var(--ink-3))]">
                    {m.email}
                  </div>
                </div>
              </Link>
              <Badge tone={m.role === "ADMIN" ? "brand" : "neutral"}>
                {m.role === "ADMIN" ? "Admin" : "Membre"}
              </Badge>
              <Badge
                tone={
                  m.status === "APPROVED"
                    ? "sage"
                    : m.status === "PENDING"
                      ? "apricot"
                      : "rose"
                }
              >
                {m.status}
              </Badge>
              {m.status === "PENDING" && (
                <>
                  <Button
                    variant="sage"
                    size="sm"
                    onClick={() => handleApprove(m.id)}
                    disabled={pendingId === m.id}
                  >
                    Approuver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(m.id)}
                    disabled={pendingId === m.id}
                  >
                    Rejeter
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ---------- Sécurité (minimal) ---------- */

function SecuritySection() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-5">
      <Panel
        title="Authentification"
        hint="Comment vous vous connectez à AI Task Manager."
      >
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] p-4">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[hsl(230_18%_12%)] text-white">
            <Github className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold tracking-tight">
                Connexion GitHub
              </span>
              <Badge tone="sage">Active</Badge>
            </div>
            <div className="mt-0.5 text-[11.5px] text-[hsl(var(--ink-3))]">
              Compte lié : {user.email}
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            Méthode unique
          </Button>
        </div>
      </Panel>

      <Panel title="Session courante">
        <div className="flex items-center gap-4">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-2))]">
            <Monitor className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold tracking-tight">
              Cet onglet
            </div>
            <div className="mt-0.5 text-[11.5px] text-[hsl(var(--ink-3))]">
              Token JWT stocké en sessionStorage. Fermer l&apos;onglet termine
              la session.
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </Button>
        </div>
      </Panel>
    </div>
  );
}
