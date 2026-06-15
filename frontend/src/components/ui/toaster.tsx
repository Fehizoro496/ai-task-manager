"use client";
import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useToastStore, type Toast, type ToastKind } from "@/services/toast/toast-store";
import { cn } from "@/lib/utils";

const ICONS: Record<ToastKind, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const TONES: Record<ToastKind, { bg: string; fg: string; ring: string }> = {
  success: {
    bg: "bg-[hsl(152_50%_96%)]",
    fg: "text-[hsl(var(--accent-sage))]",
    ring: "ring-[hsl(var(--accent-sage)/0.3)]",
  },
  error: {
    bg: "bg-[hsl(var(--alert-danger-bg))]",
    fg: "text-[hsl(var(--accent-rose))]",
    ring: "ring-[hsl(var(--accent-rose)/0.35)]",
  },
  warning: {
    bg: "bg-[hsl(var(--alert-warning-bg))]",
    fg: "text-[hsl(22_78%_42%)]",
    ring: "ring-[hsl(var(--accent-apricot)/0.35)]",
  },
  info: {
    bg: "bg-[hsl(var(--brand-soft))]",
    fg: "text-[hsl(var(--brand-ink))]",
    ring: "ring-[hsl(var(--brand)/0.3)]",
  },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = ICONS[toast.kind];
  const tone = TONES[toast.kind];

  useEffect(() => {
    if (toast.duration <= 0) return;
    const t = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-3 shadow-[var(--shadow-3)] ring-1 transition-all animate-[fadeup_0.2s_ease-out_both]",
        tone.ring,
      )}
    >
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full",
          tone.bg,
          tone.fg,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        {toast.title && (
          <div className="text-[13px] font-semibold tracking-tight">
            {toast.title}
          </div>
        )}
        <div className="text-[12.5px] leading-snug text-[hsl(var(--ink-2))]">
          {toast.message}
        </div>
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              dismiss(toast.id);
            }}
            className="mt-1.5 text-[12px] font-semibold text-[hsl(var(--brand-ink))] hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Fermer"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
