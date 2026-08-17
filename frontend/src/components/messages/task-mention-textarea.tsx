"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { tasksApi } from "@/services";
import type { Task } from "@/services";
import { isMentionBoundary } from "@/lib/task-mentions";
import { normalizeApiStatus } from "@/lib/mappers";
import { statusLabel, statusToken } from "@/lib/labels";
import { cn } from "@/lib/utils";

// Mention en cours de saisie, juste avant le curseur : `#`, puis les caractères
// déjà tapés (identifiant partiel ou début de titre).
const TRIGGER_PATTERN = /#([A-Za-z0-9-]*)$/;
const SEARCH_DEBOUNCE_MS = 180;

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Appelé sur ↵ lorsque l'autocomplétion n'a pas capté la touche. */
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function TaskMentionTextarea({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  rows = 2,
  className,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // `null` = pas de mention en cours de saisie ; "" = `#` seul (tâches récentes).
  const [query, setQuery] = useState<string | null>(null);
  const [anchor, setAnchor] = useState(0);
  const [results, setResults] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const close = useCallback(() => {
    setQuery(null);
    setResults([]);
    setHighlight(0);
  }, []);

  // Ouvre / ferme l'autocomplétion selon ce qui précède le curseur.
  const syncTrigger = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const before = el.value.slice(0, el.selectionStart ?? 0);
    const match = before.match(TRIGGER_PATTERN);
    if (!match || !isMentionBoundary(before[before.length - match[0].length - 1])) {
      close();
      return;
    }
    setAnchor(before.length - match[0].length);
    setQuery(match[1]);
  }, [close]);

  useEffect(() => {
    if (query === null) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      tasksApi
        .search(query, 8)
        .then(({ tasks }) => {
          if (cancelled) return;
          setResults(tasks.filter((t) => t.identifier));
          setHighlight(0);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const applyTask = useCallback(
    (task: Task) => {
      const el = ref.current;
      if (!el || !task.identifier) return;
      const cursor = el.selectionStart ?? value.length;
      const mention = `#${task.identifier} `;
      onChange(value.slice(0, anchor) + mention + value.slice(cursor));
      close();
      // Le curseur est repositionné après le re-render du parent.
      const caret = anchor + mention.length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(caret, caret);
      });
    },
    [anchor, close, onChange, value],
  );

  // Le panneau reste visible pendant la recherche pour éviter un clignotement,
  // mais seules des suggestions chargées peuvent capter le clavier.
  const panelOpen = query !== null && (loading || results.length > 0);
  const canSelect = query !== null && results.length > 0;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (query !== null && e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (canSelect) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % results.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + results.length) % results.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        const task = results[highlight];
        if (task) {
          e.preventDefault();
          applyTask(task);
          return;
        }
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="relative">
      {panelOpen && (
        <div className="absolute bottom-full left-0 z-30 mb-1.5 w-[min(440px,100%)] overflow-hidden rounded-[var(--radius-md)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] shadow-lg">
          <div className="border-b border-[hsl(var(--line))] px-2.5 py-1.5 text-[10.5px] uppercase tracking-wide text-[hsl(var(--ink-3))]">
            Lier une tâche
          </div>
          {results.length === 0 ? (
            <div className="flex items-center gap-2 px-2.5 py-3 text-[12px] text-[hsl(var(--ink-3))]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Recherche…
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {results.map((task, i) => {
                const status = normalizeApiStatus(task.status);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      // `onMouseDown` : le clic doit précéder le blur du textarea.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyTask(task);
                      }}
                      onMouseEnter={() => setHighlight(i)}
                      className={cn(
                        "flex w-full items-center gap-2 px-2.5 py-1.5 text-left",
                        i === highlight
                          ? "bg-[hsl(var(--bg-sunken))]"
                          : "hover:bg-[hsl(var(--bg-sunken)/0.6)]",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          statusToken[status].dot,
                        )}
                      />
                      <span className="shrink-0 font-mono text-[11px] text-[hsl(var(--ink-3))]">
                        {task.identifier}
                      </span>
                      <span className="truncate text-[12.5px]">{task.title}</span>
                      <span className="ml-auto shrink-0 text-[10.5px] text-[hsl(var(--ink-4))]">
                        {statusLabel[status]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-[hsl(var(--line))] px-2.5 py-1 text-[10px] text-[hsl(var(--ink-4))]">
            <kbd className="font-mono">↑↓</kbd> naviguer ·{" "}
            <kbd className="font-mono">↵</kbd> insérer ·{" "}
            <kbd className="font-mono">esc</kbd> fermer
          </div>
        </div>
      )}

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          syncTrigger();
        }}
        onSelect={syncTrigger}
        onKeyDown={handleKeyDown}
        onBlur={close}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={className}
      />
    </div>
  );
}
