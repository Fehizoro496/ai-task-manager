"use client";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  Moon,
  LifeBuoy,
  Keyboard,
  ChevronDown,
  LogOut,
  Check,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { routerService, useAuth } from "@/services";
import { cn } from "@/lib/utils";

type Status = "available" | "busy" | "dnd";
const STATUSES: { v: Status; label: string; color: string }[] = [
  { v: "available", label: "Disponible", color: "bg-[hsl(var(--accent-sage))]" },
  { v: "busy", label: "Occupé", color: "bg-[hsl(var(--accent-amber))]" },
  { v: "dnd", label: "Ne pas déranger", color: "bg-[hsl(var(--accent-rose))]" },
];

export function UserMenu({
  variant = "avatar",
}: {
  variant?: "avatar" | "card";
}) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<Status>("available");
  const [theme, setTheme] = useState<"clair" | "sombre">("clair");
  const currentStatus = STATUSES.find((s) => s.v === status)!;

  if (!user) return null;

  const roleLabel = user.role === "ADMIN" ? "Administrateur" : "Membre";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        {variant === "card" ? (
          <button className="group flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg))] p-2.5 text-left hover:bg-[hsl(var(--bg-sunken)/0.6)] data-[state=open]:bg-[hsl(var(--bg-sunken))]">
            <div className="relative">
              <Avatar id={user.id} name={user.name} size="md" />
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[hsl(var(--bg-elevated))]",
                  currentStatus.color,
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold leading-tight">
                {user.name}
              </div>
              <div className="truncate text-[11px] text-[hsl(var(--ink-3))]">
                {roleLabel}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ink-3))] transition-transform group-data-[state=open]:rotate-180" />
          </button>
        ) : (
          <button
            className="relative rounded-full transition-shadow data-[state=open]:ring-2 data-[state=open]:ring-[hsl(var(--brand)/0.4)] focus:outline-none"
            aria-label="Compte"
          >
            <Avatar id={user.id} name={user.name} size="md" />
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[hsl(var(--bg-elevated))]",
                currentStatus.color,
              )}
            />
          </button>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align={variant === "card" ? "start" : "end"}
          side={variant === "card" ? "top" : "bottom"}
          sideOffset={8}
          className="z-50 w-[280px] overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[hsl(var(--line))]">
            <Avatar id={user.id} name={user.name} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[14px] font-semibold tracking-tight">
                {user.name}
              </div>
              <div className="truncate text-[11.5px] text-[hsl(var(--ink-3))]">
                {user.email}
              </div>
            </div>
          </div>

          <div className="px-2 pt-2.5">
            <div className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
              Statut
            </div>
            <ul className="flex flex-col gap-0.5">
              {STATUSES.map((s) => (
                <li key={s.v}>
                  <button
                    onClick={() => setStatus(s.v)}
                    className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-[12.5px] font-medium hover:bg-[hsl(var(--bg-sunken)/0.6)]"
                  >
                    <span className={cn("h-2 w-2 rounded-full", s.color)} />
                    <span className="flex-1">{s.label}</span>
                    {status === s.v && (
                      <Check className="h-3.5 w-3.5 text-[hsl(var(--brand-ink))]" strokeWidth={3} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="my-2 border-t border-[hsl(var(--line))]" />
          <ul className="px-2 pb-2 flex flex-col gap-0.5">
            <MenuLink href="/profile" Icon={UserIcon} label="Mon profil" />
            <MenuLink
              href="/settings"
              Icon={SettingsIcon}
              label="Paramètres"
              shortcut="⌘,"
            />
            <MenuLink
              href="/ai/assistant"
              Icon={Sparkles}
              label="Assistant IA"
              accent
            />
          </ul>

          <div className="border-t border-[hsl(var(--line))] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-semibold text-[hsl(var(--ink-2))]">
                Thème
              </span>
              <div className="ml-auto inline-flex items-center gap-0.5 rounded-[var(--radius-sm)] bg-[hsl(var(--bg-sunken)/0.7)] p-0.5">
                {[
                  { v: "clair" as const, Icon: Sun, label: "Clair" },
                  { v: "sombre" as const, Icon: Moon, label: "Sombre" },
                ].map(({ v, Icon, label }) => (
                  <button
                    key={v}
                    onClick={() => setTheme(v)}
                    title={label}
                    className={cn(
                      "grid h-6 w-7 place-items-center rounded-[5px]",
                      theme === v
                        ? "bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)] text-ink"
                        : "text-[hsl(var(--ink-3))]",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ul className="border-t border-[hsl(var(--line))] px-2 py-2 flex flex-col gap-0.5">
            <MenuLink href="#" Icon={Keyboard} label="Raccourcis clavier" shortcut="?" />
            <MenuLink href="#" Icon={LifeBuoy} label="Centre d'aide" />
          </ul>

          <div className="border-t border-[hsl(var(--line))] p-2">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-left text-[12.5px] font-semibold tracking-tight text-[hsl(var(--accent-rose))] hover:bg-[hsl(var(--alert-danger-bg))]"
            >
              <LogOut className="h-4 w-4" />
              <span className="flex-1">Se déconnecter</span>
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function MenuLink({
  href,
  Icon,
  label,
  shortcut,
  accent,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  accent?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => routerService.push(href)}
        className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-[12.5px] font-medium text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--bg-sunken)/0.6)] hover:text-ink"
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            accent ? "text-[hsl(var(--brand-ink))]" : "text-[hsl(var(--ink-3))]",
          )}
        />
        <span className="flex-1">{label}</span>
        {shortcut && (
          <span className="font-mono text-[10px] text-[hsl(var(--ink-4))]">
            {shortcut}
          </span>
        )}
      </button>
    </li>
  );
}
