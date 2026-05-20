"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminApi, toast, usePendingUsersStore, useAuth } from "@/services";
import type { User, UserStatus } from "@/services";
import { cn } from "@/lib/utils";

const TABS: { v: UserStatus; label: string }[] = [
  { v: "PENDING", label: "En attente" },
  { v: "APPROVED", label: "Approuvés" },
  { v: "REJECTED", label: "Rejetés" },
];

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, status } = useAuth();
  const refreshPending = usePendingUsersStore((s) => s.refresh);
  const [tab, setTab] = useState<UserStatus>("PENDING");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [status, isAdmin, router]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers(tab);
      setUsers(res.users);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (isAdmin) refetch();
  }, [isAdmin, refetch]);

  if (!isAdmin) return null;

  const handleApprove = async (id: string) => {
    setPendingId(id);
    const target = users.find((u) => u.id === id);
    try {
      await adminApi.approveUser(id);
      toast.success(
        target ? `${target.name} a accès à l'application.` : "Utilisateur approuvé.",
        "Compte approuvé",
      );
      await Promise.all([refetch(), refreshPending()]);
    } catch (err) {
      console.error("Approve failed", err);
      toast.error(
        err instanceof Error ? err.message : "Approbation impossible.",
        "Approbation refusée",
      );
    } finally {
      setPendingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setPendingId(id);
    const target = users.find((u) => u.id === id);
    try {
      await adminApi.rejectUser(id);
      toast.info(
        target ? `${target.name} a été rejeté.` : "Utilisateur rejeté.",
        "Compte rejeté",
      );
      await Promise.all([refetch(), refreshPending()]);
    } catch (err) {
      console.error("Reject failed", err);
      toast.error(
        err instanceof Error ? err.message : "Rejet impossible.",
        "Rejet refusé",
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Administration" }]} />} />
      <main className="flex-1 px-8 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--brand-soft))] px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[hsl(var(--brand-ink))]">
              <ShieldCheck className="h-3 w-3" /> Administration
            </span>
            <h1 className="mt-3 font-display text-[26px] font-semibold tracking-tight">
              Gestion des utilisateurs
            </h1>
            <p className="mt-1 text-[13px] text-[hsl(var(--ink-3))]">
              Approuvez ou rejetez les demandes de compte.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
          <div className="flex items-center gap-2 border-b border-[hsl(var(--line))] px-4 py-3">
            <div className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[hsl(var(--bg-sunken)/0.7)] p-0.5">
              {TABS.map((t) => (
                <button
                  key={t.v}
                  onClick={() => setTab(t.v)}
                  className={cn(
                    "h-7 rounded-[6px] px-3 text-[12px] font-medium",
                    tab === t.v
                      ? "bg-[hsl(var(--bg-elevated))] text-ink shadow-[var(--shadow-1)]"
                      : "text-[hsl(var(--ink-3))]",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[hsl(var(--ink-3))]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : users.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-3))]">
                <UsersIcon className="h-5 w-5" />
              </span>
              <div className="mt-3 text-[13px] font-medium">Aucun utilisateur</div>
              <div className="mt-1 text-[11.5px] text-[hsl(var(--ink-3))]">
                Aucune demande dans cette catégorie.
              </div>
            </div>
          ) : (
            <ul>
              {users.map((u, i) => (
                <li
                  key={u.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 hover:bg-[hsl(var(--bg-sunken)/0.4)]",
                    i < users.length - 1 && "border-b border-[hsl(var(--line))]",
                  )}
                >
                  <Link
                    href={`/users/${u.id}`}
                    className="flex min-w-0 items-center gap-4 hover:opacity-90"
                  >
                    <Avatar id={u.id} name={u.name} size="md" />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold tracking-tight hover:underline">
                        {u.name}
                      </div>
                      <div className="text-[12px] text-[hsl(var(--ink-3))]">
                        {u.email}
                      </div>
                    </div>
                  </Link>
                  <div className="ml-auto flex items-center gap-3">
                    <Badge
                      tone={
                        u.status === "APPROVED"
                          ? "sage"
                          : u.status === "PENDING"
                            ? "apricot"
                            : "rose"
                      }
                    >
                      {u.status}
                    </Badge>
                    {u.status === "PENDING" && (
                      <>
                        <Button
                          variant="sage"
                          size="sm"
                          onClick={() => handleApprove(u.id)}
                          disabled={pendingId === u.id}
                        >
                          {pendingId === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Approuver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(u.id)}
                          disabled={pendingId === u.id}
                        >
                          <X className="h-3.5 w-3.5" />
                          Rejeter
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
