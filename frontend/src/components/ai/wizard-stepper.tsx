import { cn } from "@/lib/utils";

export function WizardStepper({
  step,
}: {
  step: 1 | 2 | 3;
}) {
  const items = [
    { n: 1, label: "Spécifications" },
    { n: 2, label: "Prévisualisation" },
    { n: 3, label: "Confirmation" },
  ];
  return (
    <ol className="flex items-center gap-3">
      {items.map((it, i) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <li key={it.n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full border text-[11px] font-bold tabular",
                  done && "border-[hsl(var(--accent-sage))] bg-[hsl(var(--accent-sage))] text-white",
                  active && "border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white shadow-[var(--shadow-brand)]",
                  !done && !active && "border-[hsl(var(--line-strong))] text-[hsl(var(--ink-3))]",
                )}
              >
                {it.n}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium tracking-tight",
                  active ? "text-ink" : "text-[hsl(var(--ink-3))]",
                )}
              >
                {it.label}
              </span>
            </div>
            {i < items.length - 1 && (
              <span
                className={cn(
                  "h-px w-10",
                  done
                    ? "bg-[hsl(var(--accent-sage))]"
                    : "bg-[hsl(var(--line-strong))]",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
