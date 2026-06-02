"use client";
import { useRouter } from "next/navigation";
import { Mail, Shield, Calendar as CalIcon, Building2 } from "lucide-react";
import { Github } from "@/components/icons/github";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/services";
import { shortDate } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleLabel = user.role === "ADMIN" ? "Administrateur" : "Membre";
  const rows = [
    { Icon: Shield, label: "Rôle", value: roleLabel },
    user.createdAt
      ? { Icon: CalIcon, label: "Membre depuis", value: shortDate(user.createdAt) }
      : null,
    { Icon: Github, label: "Connexion", value: "GitHub" },
    { Icon: Mail, label: "Email", value: user.email },
    { Icon: Building2, label: "Statut", value: user.status },
  ].filter(Boolean) as { Icon: React.ComponentType<{ className?: string }>; label: string; value: string }[];

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <>
      <Topbar
        breadcrumb={<Breadcrumb items={[{ label: "Compte", href: "#" }, { label: "Mon profil" }]} />}
      />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-[920px]">
          <h1 className="font-display text-[28px] font-semibold tracking-tight">
            Mon profil
          </h1>
          <p className="mt-1 text-[13.5px] text-[hsl(var(--ink-3))]">
            Vos informations personnelles, votre rôle et votre connexion.
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
            <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
              <div className="relative h-24 bg-aurora">
                <div className="absolute inset-0 bg-grid opacity-30" />
              </div>
              <div className="-mt-10 px-5 pb-5">
                <Avatar
                  id={user.id}
                  name={user.name}
                  size="2xl"
                  className="ring-4 ring-[hsl(var(--bg-elevated))] shadow-[var(--shadow-2)]"
                />
                <div className="mt-3 font-display text-[18px] font-semibold tracking-tight">
                  {user.name}
                </div>
                <div className="mt-0.5 text-[12.5px] text-[hsl(var(--ink-3))]">
                  {user.email}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="brand">
                    <Shield className="h-2.5 w-2.5" />
                    {roleLabel}
                  </Badge>
                  <Badge tone="sage">
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-sage))]" />
                    {user.status === "APPROVED" ? "Actif" : user.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--line))]">
                <h2 className="font-display text-[16px] font-semibold tracking-tight">
                  Informations
                </h2>
                <span className="text-[11px] text-[hsl(var(--ink-3))]">
                  Synchronisé depuis GitHub
                </span>
              </div>

              <ul>
                {rows.map(({ Icon, label, value }, i) => (
                  <li
                    key={label}
                    className={`flex items-center gap-3 px-5 py-3.5 ${i < rows.length - 1 ? "border-b border-[hsl(var(--line))]" : ""}`}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-2))]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[13px] text-[hsl(var(--ink-3))]">{label}</span>
                    <span className="ml-auto text-[13.5px] font-medium">{value}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-end gap-2 border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.5)] px-5 py-3">
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Se déconnecter
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
