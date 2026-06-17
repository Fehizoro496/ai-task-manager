"use client";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare2,
  Sparkles,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { UserMenu } from "@/components/shell/user-menu";
import {
  routerService,
  useAuth,
  usePendingUsersStore,
  usePendingUsersWatcher,
  useProjects,
  useUnreadMessagesStore,
  useUnreadMessagesWatcher,
} from "@/services";
import { colorForProject } from "@/lib/mappers";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  go: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  unread?: number;
  adminOnly?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const { projects } = useProjects();
  const messagesUnread = useUnreadMessagesStore((s) => s.total);
  const pendingCount = usePendingUsersStore((s) => s.count);
  usePendingUsersWatcher();
  useUnreadMessagesWatcher();

  const items: NavItem[] = [
    { href: "/dashboard", go: () => routerService.toDashboard(), label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/projects", go: () => routerService.toProjects(), label: "Projets", icon: FolderKanban },
    { href: "/my-tasks", go: () => routerService.toMyTasks(), label: "Mes tâches", icon: CheckSquare2 },
    { href: "/messages", go: () => routerService.toMessages(), label: "Messages", icon: MessageSquare, unread: messagesUnread },
    { href: "/ai/new", go: () => routerService.toAiNew(), label: "IA Planification", icon: Sparkles, accent: true },
    { href: "/calendar", go: () => routerService.toCalendar(), label: "Calendrier", icon: Calendar },
    { href: "/reports", go: () => routerService.toReports(), label: "Rapports", icon: BarChart3 },
    { href: "/admin", go: () => routerService.toAdmin(), label: "Administration", icon: ShieldCheck, adminOnly: true, unread: pendingCount },
    { href: "/settings", go: () => routerService.toSettings(), label: "Paramètres", icon: Settings },
  ];

  const favorites = projects.slice(0, 4);

  return (
    <aside className="hidden lg:flex w-[252px] shrink-0 flex-col border-r border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] h-dvh sticky top-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 h-[60px] border-b border-[hsl(var(--line))]">
        <button
          type="button"
          onClick={() => routerService.toDashboard()}
          className="cursor-pointer"
        >
          <Wordmark />
        </button>
      </div>

      <nav className="flex-1 min-h-0 px-2 pb-3 overflow-y-auto pt-3">
        <ul className="flex flex-col gap-0.5">
          {items
            .filter((it) => !it.adminOnly || isAdmin)
            .map((it) => {
              const Icon = it.icon;
              const active =
                pathname === it.href ||
                (it.href !== "/dashboard" && pathname.startsWith(it.href));
              return (
                <li key={it.href}>
                  <button
                    type="button"
                    onClick={it.go}
                    className={cn(
                      "group relative flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-[13.5px] font-medium tracking-tight transition-colors",
                      active
                        ? "bg-[hsl(var(--bg-sunken))] text-ink"
                        : "text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--bg-sunken)/0.6)]",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[hsl(var(--brand))]" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        it.accent
                          ? "text-[hsl(var(--brand))]"
                          : active
                            ? "text-ink"
                            : "text-[hsl(var(--ink-3))]",
                      )}
                    />
                    {it.label}
                    {it.accent && !active && (
                      <span className="ml-auto rounded-full bg-[hsl(var(--accent-apricot)/0.16)] px-1.5 py-px text-[9.5px] font-bold tracking-wider text-[hsl(22_78%_42%)]">
                        NEW
                      </span>
                    )}
                    {it.unread != null && it.unread > 0 && !it.accent && (
                      <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(var(--accent-rose))] px-1 text-[9.5px] font-bold text-white tabular">
                        {it.unread}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
        </ul>

        {favorites.length > 0 && (
          <div className="mt-5 px-3">
            <div className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-4))]">
              Projets
              <button
                type="button"
                onClick={() => routerService.toProjects()}
                className="grid h-5 w-5 place-items-center rounded hover:bg-[hsl(var(--bg-muted))]"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <ul className="mt-2 flex flex-col gap-0.5">
              {favorites.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => routerService.toProject(p.id)}
                    className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-left text-[12.5px] text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--bg-sunken)/0.6)]"
                  >
                    <span
                      className="h-2 w-2 rounded-[3px]"
                      style={{ background: colorForProject(p.id) }}
                    />
                    <span className="truncate">{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className="m-3">
        <UserMenu variant="card" />
      </div>
    </aside>
  );
}
