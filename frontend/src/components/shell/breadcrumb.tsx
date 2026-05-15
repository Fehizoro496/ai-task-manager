import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px]">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {it.href && !last ? (
              <Link
                href={it.href}
                className="text-[hsl(var(--ink-3))] hover:text-ink"
              >
                {it.label}
              </Link>
            ) : (
              <span
                className={
                  last
                    ? "font-semibold text-ink"
                    : "text-[hsl(var(--ink-3))]"
                }
              >
                {it.label}
              </span>
            )}
            {!last && (
              <ChevronRight className="h-3 w-3 text-[hsl(var(--ink-4))]" />
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
