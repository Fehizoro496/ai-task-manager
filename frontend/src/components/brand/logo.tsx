import { cn } from "@/lib/utils";

export function Logo({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-[10px] bg-gradient-to-br from-[hsl(var(--brand))] via-[#7C8CFF] to-[#A78BFA] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_10px_-2px_hsl(var(--brand)/0.5)]",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.55}
        height={size * 0.55}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3 13.5 8.5 19 10 13.5 11.5 12 17 10.5 11.5 5 10 10.5 8.5 12 3z" />
        <path d="M19 17l.8 2.5L22 20l-2.2.5L19 23l-.8-2.5L16 20l2.2-.5L19 17z" opacity=".75" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-apricot))] ring-2 ring-[hsl(var(--bg))]" />
    </div>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo size={32} />
      <span className="font-display text-[15px] font-semibold tracking-tight leading-none">
        AI Task <span className="text-[hsl(var(--brand-ink))]">Manager</span>
      </span>
    </div>
  );
}
