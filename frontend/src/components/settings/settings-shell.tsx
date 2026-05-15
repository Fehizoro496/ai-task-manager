"use client";
import { useState } from "react";
import {
  User, Bell, Palette, Plug, Shield, Users, CreditCard, Trash2,
  Sparkles, Check, Pencil, ExternalLink,
  Sun, Moon, Monitor,
} from "lucide-react";
import { Github } from "@/components/icons/github";
import { Slack, Figma } from "@/components/icons/brand-icons";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { users } from "@/lib/mock-data";
import { useAuth } from "@/services";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "compte",        label: "Compte",        Icon: User,       group: "Vous"    },
  { id: "notifications", label: "Notifications", Icon: Bell,       group: "Vous"    },
  { id: "apparence",     label: "Apparence",     Icon: Palette,    group: "Vous"    },
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
      {/* Inner sidebar */}
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

      {/* Content */}
      <div className="min-w-0">
        {active === "compte" && <AccountSection />}
        {active === "notifications" && <NotificationsSection />}
        {active === "apparence" && <AppearanceSection />}
        {active === "integrations" && <IntegrationsSection />}
        {active === "membres" && <MembersSection />}
        {active === "securite" && <SecuritySection />}
        {active === "facturation" && <BillingSection />}
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

function SwitchRow({
  title,
  hint,
  defaultOn,
}: {
  title: string;
  hint?: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[hsl(var(--line))] last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium tracking-tight">{title}</div>
        {hint && (
          <div className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">{hint}</div>
        )}
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={cn(
          "relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors",
          on
            ? "bg-[hsl(var(--brand))]"
            : "bg-[hsl(var(--bg-sunken))] ring-1 ring-inset ring-[hsl(var(--line-strong))]",
        )}
        aria-pressed={on}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform",
            on ? "translate-x-[16px]" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

/* ---------- Sections ---------- */

function AccountSection() {
  const { user } = useAuth();
  const currentUser = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === "ADMIN" ? "Administrateur" : "Membre",
      }
    : { id: "guest", name: "Invité", email: "—", role: "Membre" };
  return (
    <div className="space-y-5">
      <Panel
        title="Profil"
        hint="Ces informations sont visibles par les autres membres."
      >
        <div className="flex items-center gap-5 pb-5 border-b border-[hsl(var(--line))]">
          <div className="relative">
            <Avatar
              id={currentUser.id}
              name={currentUser.name}
              size="2xl"
              className="ring-4 ring-[hsl(var(--bg-elevated))] shadow-[var(--shadow-2)]"
            />
            <button className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--ink-2))] shadow-[var(--shadow-1)] hover:bg-[hsl(var(--bg-muted))]">
              <Pencil className="h-3 w-3" />
            </button>
          </div>
          <div>
            <div className="font-display text-[18px] font-semibold tracking-tight">
              {currentUser.name}
            </div>
            <div className="text-[12.5px] text-[hsl(var(--ink-3))]">
              {currentUser.email}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="brand">{currentUser.role}</Badge>
              <Badge tone="sage">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-sage))]" />
                Actif
              </Badge>
              <Badge tone="neutral">
                <Github className="h-2.5 w-2.5" /> GitHub
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 pt-5 sm:grid-cols-2">
          <Field label="Nom complet">
            <Input defaultValue={currentUser.name} />
          </Field>
          <Field label="Email">
            <Input defaultValue={currentUser.email} type="email" />
          </Field>
          <Field label="Rôle">
            <Input defaultValue={currentUser.role} readOnly className="bg-[hsl(var(--bg-sunken))]" />
          </Field>
          <Field label="Fuseau horaire">
            <select className="h-10 w-full rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-3 text-sm">
              <option>Europe / Paris (UTC+2)</option>
              <option>Europe / London (UTC+1)</option>
              <option>America / New York (UTC-4)</option>
            </select>
          </Field>
          <Field label="Bio" className="sm:col-span-2">
            <Textarea
              rows={3}
              defaultValue="Co-fondateur produit chez Atelier Studio. J'orchestre les rituels et garde les sprints joyeux."
            />
          </Field>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm">Annuler</Button>
          <Button variant="brand" size="sm">
            <Check className="h-3.5 w-3.5" />
            Enregistrer
          </Button>
        </div>
      </Panel>

      <Panel
        title="Zone dangereuse"
        hint="Actions irréversibles. À utiliser avec précaution."
      >
        <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(348_78%_97%)] p-4">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(348_78%_94%)] text-[hsl(var(--accent-rose))]">
            <Trash2 className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold tracking-tight">
              Supprimer mon compte
            </div>
            <div className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
              Toutes vos données seront anonymisées sous 30 jours.
            </div>
          </div>
          <Button
            size="sm"
            className="bg-[hsl(var(--accent-rose))] text-white hover:bg-[hsl(348_70%_46%)] shadow-[var(--shadow-1)]"
          >
            Supprimer
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function NotificationsSection() {
  return (
    <div className="space-y-5">
      <Panel
        title="Canaux"
        hint="Choisissez où vous voulez recevoir chaque type d'alerte."
      >
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line))]">
          <table className="w-full text-[12.5px]">
            <thead className="bg-[hsl(var(--bg-sunken)/0.5)] text-[hsl(var(--ink-3))]">
              <tr>
                <th className="px-4 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.14em]">
                  Évènement
                </th>
                <th className="px-3 py-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.14em]">
                  In-app
                </th>
                <th className="px-3 py-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.14em]">
                  Email
                </th>
                <th className="px-3 py-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.14em]">
                  Slack
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Mentions et @vous", [true, true, true]],
                ["Tâche assignée", [true, true, false]],
                ["Échéance proche (24h)", [true, true, false]],
                ["Commentaire sur une tâche que vous suivez", [true, false, false]],
                ["Demande de revue", [true, true, true]],
                ["Plan IA terminé", [true, false, false]],
              ].map(([label, vals], i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-t border-[hsl(var(--line))]",
                    i % 2 === 0 ? "bg-[hsl(var(--bg-elevated))]" : "bg-[hsl(var(--bg-sunken)/0.3)]",
                  )}
                >
                  <td className="px-4 py-2.5 font-medium">{label as string}</td>
                  {(vals as boolean[]).map((v, j) => (
                    <td key={j} className="px-3 py-2.5 text-center">
                      <Checkbox defaultChecked={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Préférences" hint="Personnalisez vos rappels quotidiens.">
        <SwitchRow
          title="Résumé quotidien à 9h00"
          hint="Recevez un brief des tâches du jour et des échéances."
          defaultOn
        />
        <SwitchRow
          title="Notifications push navigateur"
          hint="Alerte instantanée même quand l'onglet est fermé."
        />
        <SwitchRow
          title="Mode silencieux le week-end"
          hint="Du vendredi 18h au lundi 8h, on respire."
          defaultOn
        />
        <SwitchRow
          title="Sons d'interface"
          hint="Subtil — ping pour les mentions seulement."
        />
      </Panel>
    </div>
  );
}

function Checkbox({ defaultChecked }: { defaultChecked?: boolean }) {
  const [c, setC] = useState(!!defaultChecked);
  return (
    <button
      onClick={() => setC((v) => !v)}
      className={cn(
        "grid h-4 w-4 mx-auto place-items-center rounded border transition-colors",
        c
          ? "bg-[hsl(var(--brand))] border-[hsl(var(--brand))] text-white"
          : "bg-[hsl(var(--bg-elevated))] border-[hsl(var(--line-strong))]",
      )}
      aria-checked={c}
    >
      {c && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
}

function AppearanceSection() {
  const [theme, setTheme] = useState<"clair" | "sombre" | "systeme">("clair");
  const accents = [
    { name: "Violet",  color: "#6366F1" },
    { name: "Teal",    color: "#14B8A6" },
    { name: "Rose",    color: "#EC4899" },
    { name: "Amber",   color: "#F59E0B" },
    { name: "Émeraude",color: "#10B981" },
    { name: "Indigo",  color: "#4338CA" },
  ];
  const [accent, setAccent] = useState(accents[0].color);

  return (
    <div className="space-y-5">
      <Panel title="Thème" hint="Choisissez l'allure de l'interface.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { v: "clair",   l: "Clair",   Icon: Sun     },
            { v: "sombre",  l: "Sombre",  Icon: Moon    },
            { v: "systeme", l: "Système", Icon: Monitor },
          ].map(({ v, l, Icon }) => (
            <button
              key={v}
              onClick={() => setTheme(v as typeof theme)}
              className={cn(
                "relative overflow-hidden rounded-[var(--radius-md)] border p-3 text-left transition-all",
                theme === v
                  ? "border-[hsl(var(--brand))] shadow-[0_0_0_3px_hsl(var(--brand)/0.18)]"
                  : "border-[hsl(var(--line-strong))] hover:border-[hsl(var(--line-strong))]",
              )}
            >
              <div className={cn(
                "h-16 rounded-[var(--radius-sm)] border",
                v === "clair" && "bg-[hsl(44_38%_97%)] border-[hsl(var(--line))]",
                v === "sombre" && "bg-[hsl(230_22%_12%)] border-[hsl(230_18%_25%)]",
                v === "systeme" && "bg-gradient-to-r from-[hsl(44_38%_97%)] to-[hsl(230_22%_12%)]",
              )} />
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-[hsl(var(--ink-3))]" />
                  <span className="text-[12.5px] font-medium">{l}</span>
                </div>
                {theme === v && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-[hsl(var(--brand))] text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Accent" hint="La teinte de marque utilisée dans toute l'app.">
        <div className="flex flex-wrap items-center gap-2.5">
          {accents.map((a) => (
            <button
              key={a.color}
              onClick={() => setAccent(a.color)}
              className="grid h-10 w-10 place-items-center rounded-full transition-transform hover:scale-105"
              style={{
                background: a.color,
                boxShadow:
                  accent === a.color
                    ? `0 0 0 3px hsl(var(--bg-elevated)), 0 0 0 5px ${a.color}`
                    : "inset 0 0 0 1px rgba(0,0,0,0.08)",
              }}
              aria-label={a.name}
            >
              {accent === a.color && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Densité" hint="Compact pour les power users, confort pour les longues sessions.">
        <div className="inline-flex rounded-[var(--radius-sm)] bg-[hsl(var(--bg-sunken)/0.7)] p-0.5">
          {["Compact", "Standard", "Confort"].map((v, i) => (
            <button
              key={v}
              className={cn(
                "h-9 rounded-[6px] px-4 text-[12.5px] font-medium",
                i === 1
                  ? "bg-[hsl(var(--bg-elevated))] text-ink shadow-[var(--shadow-1)]"
                  : "text-[hsl(var(--ink-3))]",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function IntegrationsSection() {
  const items = [
    {
      name: "GitHub",
      desc: "Lier vos dépôts, ouvrir des PR, suivre les branches.",
      Icon: Github,
      tone: "bg-[hsl(230_18%_12%)] text-white",
      connected: true,
      meta: "alex/ai-task-manager · +2 autres",
    },
    {
      name: "Slack",
      desc: "Recevez les notifications dans #produit.",
      Icon: Slack,
      tone: "bg-[hsl(280_60%_94%)] text-[hsl(280_60%_38%)]",
      connected: true,
      meta: "Espace : Atelier Studio · #produit",
    },
    {
      name: "Figma",
      desc: "Lien direct vers les frames depuis les tâches.",
      Icon: Figma,
      tone: "bg-[hsl(348_78%_94%)] text-[hsl(var(--accent-rose))]",
      connected: false,
      meta: "Pas connecté",
    },
    {
      name: "API Anthropic",
      desc: "Modèle utilisé pour la planification IA.",
      Icon: Sparkles,
      tone: "bg-gradient-to-br from-[hsl(var(--brand))] to-[#A78BFA] text-white",
      connected: true,
      meta: "claude-opus-4-7 · clé du compte",
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
            {it.connected ? (
              <Button variant="outline" size="sm">
                Configurer
              </Button>
            ) : (
              <Button variant="brand" size="sm">
                Connecter
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function MembersSection() {
  return (
    <Panel
      title="Membres de l'organisation"
      hint={`${users.length} personnes · Atelier Studio`}
    >
      <ul className="divide-y divide-[hsl(var(--line))]">
        {users.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <Avatar id={m.id} name={m.name} size="md" />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold tracking-tight">
                {m.name}
              </div>
              <div className="text-[11.5px] text-[hsl(var(--ink-3))]">
                {m.email}
              </div>
            </div>
            <Badge tone={m.role === "Administrateur" ? "brand" : "neutral"}>
              {m.role}
            </Badge>
            <select className="h-8 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-2 text-[12px]">
              <option>Modifier le rôle</option>
              <option>Promouvoir admin</option>
              <option>Rétrograder</option>
              <option>Suspendre</option>
            </select>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-end">
        <Button variant="brand" size="sm">
          <Users className="h-3.5 w-3.5" />
          Inviter
        </Button>
      </div>
    </Panel>
  );
}

function SecuritySection() {
  return (
    <div className="space-y-5">
      <Panel title="Authentification" hint="Comment vous vous connectez à AI Task Manager.">
        <div className="space-y-3">
          <Row
            Icon={Github}
            title="Connexion GitHub"
            subtitle="Liée à alex@example.com"
            badge="Principal"
            cta="Délier"
          />
          <Row
            Icon={Shield}
            title="Double authentification (2FA)"
            subtitle="Application TOTP recommandée"
            badge="Inactif"
            badgeTone="rose"
            cta="Activer"
            ctaTone="brand"
          />
        </div>
      </Panel>

      <Panel title="Sessions actives" hint="Déconnectez les appareils que vous ne reconnaissez pas.">
        <ul className="divide-y divide-[hsl(var(--line))]">
          {[
            { device: "MacBook Pro · Chrome 124", loc: "Paris, FR", time: "Il y a 4 min", current: true },
            { device: "iPhone · Safari", loc: "Paris, FR", time: "Il y a 3 h" },
            { device: "Windows · Edge", loc: "Lyon, FR", time: "Il y a 2 j" },
          ].map((s) => (
            <li key={s.device} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-2))]">
                <Monitor className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
                  {s.device}
                  {s.current && <Badge tone="sage">Cette session</Badge>}
                </div>
                <div className="text-[11.5px] text-[hsl(var(--ink-3))]">
                  {s.loc} · {s.time}
                </div>
              </div>
              {!s.current && (
                <Button variant="outline" size="sm">
                  Déconnecter
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function BillingSection() {
  return (
    <div className="space-y-5">
      <Panel title="Forfait actuel">
        <div className="relative grain overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--brand)/0.2)] bg-[hsl(var(--bg-elevated))] p-5">
          <div className="absolute inset-0 -z-0 bg-aurora opacity-80" />
          <div className="relative grid items-start gap-3 md:grid-cols-[1fr_auto]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.16em] uppercase text-[hsl(var(--brand-ink))]">
                <Sparkles className="h-3 w-3" /> Plan Équipe
              </span>
              <div className="mt-3 font-display text-[26px] font-semibold tracking-tight">
                28 € <span className="text-[14px] font-normal text-[hsl(var(--ink-3))]">par membre / mois</span>
              </div>
              <ul className="mt-3 grid gap-1.5 text-[12.5px] text-[hsl(var(--ink-2))] sm:grid-cols-2">
                {[
                  "Projets illimités",
                  "Planification IA",
                  "Intégrations GitHub & Slack",
                  "Support prioritaire",
                ].map((b) => (
                  <li key={b} className="flex items-center gap-1.5">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-[hsl(var(--accent-sage))] text-white">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <Button variant="outline" size="sm">
              Changer de plan
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Mini label="Membres" value="4 / illimité" />
          <Mini label="Cycle" value="Mensuel" />
          <Mini label="Prochaine facture" value="3 juin · 112 €" />
        </div>
      </Panel>

      <Panel title="Moyen de paiement" hint="Cartes acceptées : Visa, Mastercard, Amex.">
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] p-4">
          <span className="grid h-9 w-12 place-items-center rounded-[6px] bg-gradient-to-br from-[#1A1F71] to-[#0F66B0] text-white font-mono text-[10px] font-bold">
            VISA
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold tracking-tight">
              •••• •••• •••• 4242
            </div>
            <div className="text-[11.5px] text-[hsl(var(--ink-3))]">
              Expire 09 / 27 · Alex Martin
            </div>
          </div>
          <Button variant="outline" size="sm">
            Modifier
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-4 py-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
        {label}
      </div>
      <div className="mt-1 text-[14px] font-semibold tracking-tight tabular">
        {value}
      </div>
    </div>
  );
}

function Row({
  Icon, title, subtitle, badge, badgeTone, cta, ctaTone,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  badge?: string;
  badgeTone?: "sage" | "rose" | "neutral" | "brand";
  cta: string;
  ctaTone?: "brand" | "outline";
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] p-4">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--ink-2))] ring-1 ring-[hsl(var(--line-strong))]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold tracking-tight">
            {title}
          </span>
          {badge && <Badge tone={badgeTone ?? "neutral"}>{badge}</Badge>}
        </div>
        <div className="mt-0.5 text-[11.5px] text-[hsl(var(--ink-3))]">
          {subtitle}
        </div>
      </div>
      <Button variant={ctaTone === "brand" ? "brand" : "outline"} size="sm">
        {cta}
      </Button>
    </div>
  );
}
