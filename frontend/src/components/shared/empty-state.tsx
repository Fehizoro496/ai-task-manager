import { type LucideIcon } from "lucide-react";

export function EmptyState({
  Icon,
  title,
  hint,
}: {
  Icon: LucideIcon;
  title: string;
  hint: string;
}) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-[var(--radius-lg)] border border-dashed border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-[12px] bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-4 font-display text-[18px] font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-1 text-[13px] text-[hsl(var(--ink-3))]">{hint}</p>
    </div>
  );
}
