"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Command,
  FolderKanban,
  ListChecks,
  User as UserIcon,
  X,
  Loader2,
} from "lucide-react";
import { projectsApi, useProjects, usersApi } from "@/services";
import type { Project, Task, User } from "@/services";
import { Avatar } from "@/components/ui/avatar";
import { projectPrefix } from "@/lib/mappers";
import { cn } from "@/lib/utils";

interface IndexedTask extends Task {
  _projectId: string;
  _projectName: string;
}

interface ResultProject {
  kind: "project";
  id: string;
  label: string;
  hint: string;
  href: string;
}
interface ResultTask {
  kind: "task";
  id: string;
  label: string;
  hint: string;
  href: string;
  identifier: string;
}
interface ResultUser {
  kind: "user";
  id: string;
  label: string;
  hint: string;
  href: string;
}
type Result = ResultProject | ResultTask | ResultUser;

export function GlobalSearch() {
  const router = useRouter();
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [tasks, setTasks] = useState<IndexedTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Index tâches + users : chargé une seule fois au premier focus
  const loadIndex = useCallback(async () => {
    if (indexLoaded) return;
    setLoading(true);
    try {
      const [tasksByProject, usersRes] = await Promise.all([
        Promise.all(
          projects.map((p) =>
            projectsApi
              .listTasks(p.id)
              .then((r) =>
                r.tasks.map<IndexedTask>((t) => ({
                  ...t,
                  _projectId: p.id,
                  _projectName: p.name,
                })),
              )
              .catch(() => [] as IndexedTask[]),
          ),
        ),
        usersApi.list().catch(() => ({ users: [] as User[] })),
      ]);
      setTasks(tasksByProject.flat());
      setUsers(usersRes.users);
      setIndexLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [projects, indexLoaded]);

  // Invalidation du cache quand la liste de projets change
  useEffect(() => {
    setIndexLoaded(false);
  }, [projects.length]);

  // Raccourci clavier ⌘K / Ctrl+K pour ouvrir
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
        loadIndex();
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, loadIndex]);

  // Click outside → fermer
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => setHighlight(0), [query]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const projectHits: ResultProject[] = projects
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((p: Project) => ({
        kind: "project",
        id: p.id,
        label: p.name,
        hint: projectPrefix(p),
        href: `/projects/${p.id}`,
      }));

    const userHits: ResultUser[] = users
      .filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((u) => ({
        kind: "user",
        id: u.id,
        label: u.name,
        hint: u.email,
        href: `/users/${u.id}`,
      }));

    const taskHits: ResultTask[] = tasks
      .filter((t) => {
        const hay = `${t.title} ${t.identifier ?? ""} ${t._projectName}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 6)
      .map((t) => ({
        kind: "task",
        id: t.id,
        label: t.title,
        hint: t._projectName,
        href: `/tasks/${t.id}`,
        identifier: t.identifier ?? t.id.slice(0, 8),
      }));

    return [...projectHits, ...userHits, ...taskHits];
  }, [query, projects, users, tasks]);

  const goTo = (r: Result) => {
    router.push(r.href);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[highlight];
      if (r) goTo(r);
    }
  };

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--ink-3))]" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          loadIndex();
        }}
        onKeyDown={onKeyDown}
        placeholder="Rechercher tâches, projets, membres…"
        autoComplete="off"
        className="h-9 w-[340px] rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] pl-8 pr-14 text-[13px] placeholder:text-[hsl(var(--ink-4))] focus:border-[hsl(var(--brand)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.3)]"
      />
      {query ? (
        <button
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-sunken)/0.7)] hover:text-ink"
          aria-label="Effacer"
        >
          <X className="h-3 w-3" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-2 top-1/2 inline-flex h-5 -translate-y-1/2 items-center gap-0.5 rounded border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-1.5 font-mono text-[10px] text-[hsl(var(--ink-3))]">
          <Command className="h-2.5 w-2.5" /> K
        </kbd>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)]">
          {query.trim().length === 0 ? (
            <div className="px-4 py-8 text-center">
              <span className="grid h-10 w-10 mx-auto place-items-center rounded-full bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-3))]">
                <Search className="h-4 w-4" />
              </span>
              <div className="mt-3 text-[12.5px] font-medium">
                Tapez pour rechercher
              </div>
              <div className="mt-1 text-[11px] text-[hsl(var(--ink-3))]">
                Projets, tâches et membres
              </div>
            </div>
          ) : loading && !indexLoaded ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-[12.5px] text-[hsl(var(--ink-3))]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Indexation…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12.5px] text-[hsl(var(--ink-3))]">
              Aucun résultat pour <span className="font-mono">«{query}»</span>
            </div>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto py-1">
              {results.map((r, i) => (
                <li key={`${r.kind}:${r.id}`}>
                  <button
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => goTo(r)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left",
                      highlight === i && "bg-[hsl(var(--bg-sunken)/0.7)]",
                    )}
                  >
                    {r.kind === "user" ? (
                      <Avatar id={r.id} name={r.label} size="sm" />
                    ) : (
                      <span
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-[6px]",
                          r.kind === "project"
                            ? "bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]"
                            : "bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-2))]",
                        )}
                      >
                        {r.kind === "project" ? (
                          <FolderKanban className="h-3.5 w-3.5" />
                        ) : (
                          <ListChecks className="h-3.5 w-3.5" />
                        )}
                      </span>
                    )}
                    {r.kind === "task" && (
                      <span className="font-mono text-[10.5px] font-semibold tracking-wider text-[hsl(var(--ink-3))] shrink-0">
                        {r.identifier}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium tracking-tight">
                        {r.label}
                      </span>
                      <span className="block truncate text-[11px] text-[hsl(var(--ink-3))]">
                        {r.kind === "project" ? "Projet" : r.hint}
                      </span>
                    </span>
                    {r.kind === "user" && (
                      <UserIcon className="h-3.5 w-3.5 text-[hsl(var(--ink-4))]" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.5)] px-3 py-1.5 text-[10.5px] text-[hsl(var(--ink-3))]">
            <kbd className="font-mono">↑↓</kbd> naviguer ·{" "}
            <kbd className="font-mono">↵</kbd> ouvrir ·{" "}
            <kbd className="font-mono">Esc</kbd> fermer
          </div>
        </div>
      )}
    </div>
  );
}
