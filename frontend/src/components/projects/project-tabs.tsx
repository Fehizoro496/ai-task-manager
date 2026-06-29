"use client";
import { usePathname } from "next/navigation";
import { routerService } from "@/services";
import { cn } from "@/lib/utils";

export function ProjectTabs({
  projectId,
  canManage = false,
}: {
  projectId: string;
  /** Affiche l'onglet Paramètres (owner du projet ou admin uniquement). */
  canManage?: boolean;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const items = [
    { href: base, label: "Aperçu", exact: true, go: () => routerService.toProject(projectId) },
    { href: `${base}/board`, label: "Tâches", go: () => routerService.toProjectBoard(projectId) },
    // Membres et Paramètres : réservés aux managers (admin).
    ...(canManage
      ? [
          { href: `${base}/members`, label: "Membres", go: () => routerService.toProjectMembers(projectId) },
          { href: `${base}/settings`, label: "Paramètres", go: () => routerService.toProjectSettings(projectId) },
        ]
      : []),
  ];
  return (
    <div className="border-b border-[hsl(var(--line))]">
      <nav className="flex gap-1">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          return (
            <button
              key={it.href}
              type="button"
              onClick={it.go}
              className={cn(
                "relative px-3.5 py-2.5 text-[13px] font-medium tracking-tight",
                active
                  ? "text-ink"
                  : "text-[hsl(var(--ink-3))] hover:text-ink",
              )}
            >
              {it.label}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-t bg-[hsl(var(--brand))]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
