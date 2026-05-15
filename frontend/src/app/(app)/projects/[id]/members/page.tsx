"use client";
import { use, useCallback, useEffect, useState } from "react";
import { Plus, Mail, Loader2, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { adminApi, useAuth } from "@/services";
import type { ProjectMember } from "@/services";

export default function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listProjectMembers(projectId);
      setMembers(res.members);
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
    if (!newUserId.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await adminApi.addProjectMember(projectId, newUserId.trim());
      setNewUserId("");
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ajout impossible.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Retirer ce membre du projet ?")) return;
    try {
      await adminApi.removeProjectMember(projectId, userId);
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
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
          <Field label="Ajouter un membre par ID utilisateur">
            <div className="flex items-center gap-2">
              <Input
                placeholder="UUID de l'utilisateur"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                disabled={adding}
              />
              <Button variant="brand" size="sm" onClick={handleAdd} disabled={adding}>
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Ajouter
              </Button>
            </div>
          </Field>
          {error && (
            <div className="mt-2 text-[12px] text-[hsl(var(--accent-rose))]">{error}</div>
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
                  <Avatar id={m.userId} name={display} size="md" />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold tracking-tight">
                      {display}
                    </div>
                    {email && (
                      <div className="text-[12px] text-[hsl(var(--ink-3))]">{email}</div>
                    )}
                  </div>
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
                      className="grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--accent-rose))] hover:bg-[hsl(348_78%_97%)]"
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
