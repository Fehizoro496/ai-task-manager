"use client";
import { GlobalSearch } from "@/components/shell/global-search";
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

        <div className="ml-auto">
          <GlobalSearch />
        </div>

        <NotificationsPopover />

        <UserMenu />
      </div>
    </header>
  );
}
