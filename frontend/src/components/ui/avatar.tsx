import { cn, initials } from "@/lib/utils";

const SIZES = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-6 w-6 text-[11px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-16 w-16 text-base",
  "2xl": "h-20 w-20 text-lg",
} as const;

const PALETTE = [
  "from-[#A78BFA] to-[#6366F1]",
  "from-[#FCA5A5] to-[#F472B6]",
  "from-[#FBBF24] to-[#F97316]",
  "from-[#86EFAC] to-[#22C55E]",
  "from-[#67E8F9] to-[#0EA5E9]",
  "from-[#FDBA74] to-[#FB7185]",
];

function colorFor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[n % PALETTE.length];
}

export function Avatar({
  name,
  id,
  size = "md",
  className,
  ring,
}: {
  name: string;
  id: string;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-full font-semibold text-white shadow-[inset_0_-2px_4px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.25)] bg-gradient-to-br",
        SIZES[size],
        colorFor(id),
        ring && "ring-2 ring-[hsl(var(--bg-elevated))]",
        className,
      )}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarGroup({
  users,
  max = 4,
  size = "sm",
}: {
  users: { id: string; name: string }[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((u) => (
        <Avatar key={u.id} id={u.id} name={u.name} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "inline-grid place-items-center rounded-full bg-[hsl(var(--bg-muted))] text-[hsl(var(--ink-2))] font-semibold ring-2 ring-[hsl(var(--bg-elevated))]",
            SIZES[size],
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
