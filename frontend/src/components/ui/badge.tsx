import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "brand" | "sage" | "apricot" | "rose" | "teal";
};

export function Badge({ className, tone = "neutral", ...rest }: Props) {
  const map: Record<NonNullable<Props["tone"]>, string> = {
    neutral: "bg-[hsl(var(--bg-muted))] text-[hsl(var(--ink-2))] border-[hsl(var(--line-strong))]",
    brand:   "bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))] border-[hsl(var(--brand)/0.25)]",
    sage:    "bg-[hsl(152_50%_94%)] text-[hsl(var(--accent-sage))] border-[hsl(var(--accent-sage)/0.3)]",
    apricot: "bg-[hsl(23_92%_94%)] text-[hsl(22_78%_42%)] border-[hsl(var(--accent-apricot)/0.3)]",
    rose:    "bg-[hsl(348_78%_96%)] text-[hsl(var(--accent-rose))] border-[hsl(var(--accent-rose)/0.3)]",
    teal:    "bg-[hsl(184_64%_94%)] text-[hsl(var(--accent-teal))] border-[hsl(var(--accent-teal)/0.3)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-tight",
        map[tone],
        className,
      )}
      {...rest}
    />
  );
}
