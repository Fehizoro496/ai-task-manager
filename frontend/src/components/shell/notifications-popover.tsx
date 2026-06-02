"use client";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  Bell,
  Settings as SettingsIcon,
  CheckCheck,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { routerService, useNotifications } from "@/services";
import type { Notification } from "@/services";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const now = new Date();
  const d = new Date(iso);
  const diff = Math.max(1, Math.round((now.getTime() - d.getTime()) / 60000));
  if (diff < 60) return `il y a ${diff} min`;
  const h = Math.round(diff / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.round(h / 24);
  return `il y a ${days} j`;
}

export function NotificationsPopover() {
  const { items, markRead, markAllRead, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleClick = (n: Notification) => {
    if (!n.read) markRead(n.id);
    if (n.link) {
      setOpen(false);
      routerService.push(n.link);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="relative grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-muted))] data-[state=open]:bg-[hsl(var(--bg-muted))] data-[state=open]:border-[hsl(var(--line-strong))]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-[hsl(var(--ink-2))]" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(var(--accent-rose))] px-1 text-[9.5px] font-bold text-white ring-2 ring-[hsl(var(--bg-elevated))]">
              {unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[420px] overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <header className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-[hsl(var(--line))]">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-[15px] font-semibold tracking-tight">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <Badge tone="rose" className="!text-[10px]">
                  {unreadCount} non lues
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => markAllRead()}
                disabled={unreadCount === 0}
                className="inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[11.5px] font-medium text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--bg-muted))] disabled:opacity-50"
              >
                <CheckCheck className="h-3 w-3" />
                Tout marquer lu
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  routerService.toSettings();
                }}
                className="grid h-7 w-7 place-items-center rounded-[6px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink"
              >
                <SettingsIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          <div className="max-h-[440px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-3))]">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="mt-3 text-[13px] font-medium">
                  Aucune notification
                </div>
                <div className="mt-1 text-[11.5px] text-[hsl(var(--ink-3))]">
                  Vous êtes à jour.
                </div>
              </div>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={cn(
                        "group relative flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[hsl(var(--bg-sunken)/0.45)]",
                        !n.read && "bg-[hsl(var(--brand-soft)/0.35)]",
                        n.link && "cursor-pointer",
                      )}
                    >
                      {!n.read && (
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand))]" />
                      )}
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))] shrink-0">
                        <Bell className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] leading-snug font-medium text-ink">
                          {n.message}
                        </div>
                        <div className="mt-1 text-[10.5px] font-medium text-[hsl(var(--ink-4))]">
                          {timeAgo(n.createdAt)}
                        </div>
                      </div>
                      <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[hsl(var(--ink-4))] opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
