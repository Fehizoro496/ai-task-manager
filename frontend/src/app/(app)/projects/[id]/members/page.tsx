"use client";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Mail, Loader2, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { UserCombobox } from "@/components/ui/user-combobox";
import { adminApi, toast, useAuth } from "@/services";
import type { ProjectMember, User } from "@/services";

export default function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, usersRes] = await Promise.all([
        adminApi.listProjectMembers(projectId),
        adminApi.listUsers("APPROVED"),
      ]);
      setMembers(membersRes.members);
      setApprovedUsers(usersRes.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isAdmin) refetch();
    else setLoading(false);
  }, [isAdmin, refetch]);

  // Liste des users approuvés qui ne sont pas encore membres du projet
  const availableUsers = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.userId));
    return approvedUsers.filter((u) => !memberIds.has(u.id));
  }, [members, approvedUsers]);

  // Reset la sélection si l'utilisateur choisi vient d'être ajouté
  useEffect(() => {
    if (selectedUserId && !availableUsers.some((u) => u.id === selectedUserId)) {
      setSelectedUserId("");
    }
  }, [availableUsers, selectedUserId]);

  if (!isAdmin) {
    return (
      <main className="px-8 py-7">
        <div className="rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-6 text-[13px] text-[hsl(var(--ink-3))]">
          Seuls les administrateurs peuvent gérer les membres.
        </div>
      </main>
    );
  }

  const handleAdd = async () => {
    if (!selectedUserId) return;
    const target = approvedUsers.find((u) => u.id === selectedUserId);
    setAdding(true);
    setError(null);
    try {
      await adminApi.addProjectMember(projectId, selectedUserId);
      toast.success(
        target ? `${target.name} a été ajouté.` : "Membre ajouté.",
        "Membre ajouté",
      );
      setSelectedUserId("");
      await refetch();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ajout impossible.";
      setError(message);
      toast.error(message, "Ajout impossible");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Retirer ce membre du projet ?")) return;
    try {
      await adminApi.removeProjectMember(projectId, userId);
      toast.success("Membre retiré du projet.", "Membre retiré");
      await refetch();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Suppression impossible.";
      setError(message);
      toast.error(message, "Suppression impossible");
    }
  };

  return (
    <main className="px-8 py-7">
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
        <header className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--line))]">
          <div>
            <h2 className="font-display text-[16px] font-semibold tracking-tight">
              Membres du projet
            </h2>
            <p className="mt-0.5 text-[12px] text-[hsl(var(--ink-3))]">
              {members.length} personne{members.length > 1 ? "s" : ""}.
            </p>
          </div>
        </header>

        <div className="border-b border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-5 py-4">
          <Field label="Ajouter un membre">
            <div className="flex items-center gap-2">
              <UserCombobox
                users={availableUsers}
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Rechercher par nom ou email…"
                emptyLabel="Aucun utilisateur disponible"
                disabled={adding}
              />
              <Button
                variant="brand"
                size="sm"
                onClick={handleAdd}
                disabled={adding || !selectedUserId}
              >
                {adding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Ajouter
              </Button>
            </div>
          </Field>
          {error && (
            <div className="mt-2 text-[12px] text-[hsl(var(--accent-rose))]">
              {error}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[hsl(var(--ink-3))]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : members.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[hsl(var(--ink-3))]">
            Aucun membre pour ce projet.
          </div>
        ) : (
          <ul>
            {members.map((m, i) => {
              const user = m.user;
              const display = user?.name ?? m.userId;
              const email = user?.email;
              return (
                <li
                  key={m.id}
                  className={`flex items-center gap-4 px-5 py-3.5 ${i < members.length - 1 ? "border-b border-[hsl(var(--line))]" : ""} hover:bg-[hsl(var(--bg-sunken)/0.4)]`}
                >
                  <Link
                    href={`/users/${m.userId}`}
                    className="flex min-w-0 items-center gap-4 hover:opacity-90"
                  >
                    <Avatar id={m.userId} name={display} size="md" />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold tracking-tight hover:underline">
                        {display}
                      </div>
                      {email && (
                        <div className="text-[12px] text-[hsl(var(--ink-3))]">
                          {email}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="ml-auto flex items-center gap-3">
                    <Badge tone={user?.role === "ADMIN" ? "brand" : "neutral"}>
                      {user?.role === "ADMIN" ? "Admin" : "Membre"}
                    </Badge>
                    {email && (
                      <a
                        href={`mailto:${email}`}
                        className="grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleRemove(m.userId)}
                      className="grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--accent-rose))] hover:bg-[hsl(var(--alert-danger-bg))]"
                      title="Retirer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
