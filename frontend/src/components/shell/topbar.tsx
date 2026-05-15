"use client";
import { Search, Command } from "lucide-react";
import { NotificationsPopover } from "@/components/shell/notifications-popover";
import { UserMenu } from "@/components/shell/user-menu";

export function Topbar({
  breadcrumb,
}: {
  breadcrumb?: React.ReactNode;
}) {
  return (
    <header className="h-[60px] border-b border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated)/0.7)] backdrop-blur-md sticky top-0 z-30">
      <div className="flex h-full items-center gap-3 px-6">
        <div className="flex items-center gap-1.5 text-[13px] text-[hsl(var(--ink-2))]">
          {breadcrumb}
        </div>

        <div className="relative ml-auto hidden md:flex">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--ink-3))]" />
          <input
            placeholder="Rechercher tâches, projets, membres…"
            className="h-9 w-[320px] rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] pl-8 pr-14 text-[13px] placeholder:text-[hsl(var(--ink-4))] focus:border-[hsl(var(--brand)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.3)]"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 inline-flex h-5 -translate-y-1/2 items-center gap-0.5 rounded border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-1.5 font-mono text-[10px] text-[hsl(var(--ink-3))]">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </div>

        <NotificationsPopover />

        <UserMenu />
      </div>
    </header>
  );
}
