"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const items = [
    { href: base, label: "Aperçu", exact: true },
    { href: `${base}/board`, label: "Tâches" },
    { href: `${base}/members`, label: "Membres" },
    { href: `${base}/settings`, label: "Paramètres" },
  ];
  return (
    <div className="border-b border-[hsl(var(--line))]">
      <nav className="flex gap-1">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
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
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
