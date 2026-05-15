"use client";
import { useState } from "react";
import {
  Plus, Search, Send, Sparkles, ListChecks, FlaskConical, ClipboardList,
  Wand2, Bot, History, MoreHorizontal,
} from "lucide-react";
import { aiConversations } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/services";
import { cn } from "@/lib/utils";

const QUICK = [
  { Icon: Wand2, label: "Générer un plan de projet" },
  { Icon: ListChecks, label: "Optimiser le backlog" },
  { Icon: ClipboardList, label: "Expliquer cette tâche" },
  { Icon: FlaskConical, label: "Créer des tests unitaires" },
];

export function AssistantShell() {
  const { user } = useAuth();
  const currentUser = user ?? { id: "guest", name: "Invité" };
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; body: string }[]>([]);

  function send() {
    if (!draft.trim()) return;
    const user = draft.trim();
    setMessages((m) => [...m, { role: "user", body: user }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          body:
            `Voici une première décomposition : je propose 3 epics avec 9 stories au total. ` +
            `Souhaitez-vous une vue cible mobile ou desktop d'abord ?`,
        },
      ]);
    }, 700);
  }

  return (
    <div className="grid h-[calc(100dvh-120px)] grid-cols-[300px_1fr] gap-5">
      {/* Sidebar of conversations */}
      <aside className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
        <header className="border-b border-[hsl(var(--line))] p-3">
          <button className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-dashed border-[hsl(var(--brand)/0.4)] bg-[hsl(var(--brand-soft)/0.6)] py-2 text-[12.5px] font-semibold text-[hsl(var(--brand-ink))] hover:bg-[hsl(var(--brand-soft))]">
            <Plus className="h-3.5 w-3.5" />
            Nouveau chat
          </button>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--ink-3))]" />
            <input
              placeholder="Rechercher…"
              className="h-8 w-full rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] pl-7 pr-2 text-[12.5px] placeholder:text-[hsl(var(--ink-4))] focus:border-[hsl(var(--brand)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.3)]"
            />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
            Conversations
          </div>
          <ul>
            {aiConversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActive(c.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-left",
                    active === c.id
                      ? "bg-[hsl(var(--bg-sunken))]"
                      : "hover:bg-[hsl(var(--bg-sunken)/0.6)]",
                  )}
                >
                  <History className="mt-0.5 h-3.5 w-3.5 text-[hsl(var(--ink-3))]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium tracking-tight">
                      {c.title}
                    </div>
                    <div className="truncate text-[11px] text-[hsl(var(--ink-3))]">
                      {c.preview}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main chat area */}
      <section className="relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-1)]">
        <header className="flex items-center justify-between border-b border-[hsl(var(--line))] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-gradient-to-br from-[hsl(var(--brand))] to-[#A78BFA] text-white shadow-[var(--shadow-brand)]">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <div className="font-display text-[14px] font-semibold tracking-tight">
                Assistant IA
              </div>
              <div className="text-[10.5px] text-[hsl(var(--ink-3))]">
                Connecté à vos projets — privé par défaut
              </div>
            </div>
            <span className="ml-1 rounded-full bg-[hsl(var(--brand-soft))] px-1.5 py-0.5 text-[9.5px] font-bold tracking-widest text-[hsl(var(--brand-ink))]">
              BETA
            </span>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))]">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </header>

        {/* Messages or greeting */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-[640px] text-center">
              <div className="relative mx-auto mb-4 h-14 w-14">
                <div className="absolute inset-0 rounded-full bg-[hsl(var(--brand-soft))] animate-[float_5s_ease-in-out_infinite]" />
                <div className="absolute inset-2 grid place-items-center rounded-full bg-gradient-to-br from-[hsl(var(--brand))] to-[#A78BFA] text-white shadow-[var(--shadow-brand)]">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <h2 className="font-display text-[26px] font-semibold leading-tight tracking-tight">
                Bonjour {currentUser.name.split(" ")[0]}{" "}
                <span className="font-serif italic font-normal text-[hsl(var(--ink-2))]">
                  👋
                </span>
              </h2>
              <p className="mt-2 text-[14px] text-[hsl(var(--ink-3))]">
                Comment puis-je vous aider aujourd&apos;hui ?
              </p>

              <div className="mx-auto mt-7 grid max-w-[520px] grid-cols-2 gap-2.5">
                {QUICK.map(({ Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => setDraft(label)}
                    className="group flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-3 py-2.5 text-left shadow-[var(--shadow-1)] transition-all hover:-translate-y-px hover:shadow-[var(--shadow-2)]"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand-ink))]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[12.5px] font-medium tracking-tight">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="mx-auto flex max-w-[720px] flex-col gap-4">
              {messages.map((m, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-3",
                    m.role === "user" ? "justify-end" : "",
                  )}
                >
                  {m.role === "ai" && (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[hsl(var(--brand))] to-[#A78BFA] text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-[var(--radius-md)] px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                      m.role === "user"
                        ? "bg-[hsl(var(--ink))] text-white"
                        : "border border-[hsl(var(--line))] bg-[hsl(var(--bg))]",
                    )}
                  >
                    {m.body}
                  </div>
                  {m.role === "user" && (
                    <Avatar id={currentUser.id} name={currentUser.name} size="sm" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] p-3">
          <div className="mx-auto flex max-w-[720px] items-end gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] p-1.5 pl-3 shadow-[var(--shadow-1)] focus-within:border-[hsl(var(--brand)/0.6)] focus-within:ring-2 focus-within:ring-[hsl(var(--brand)/0.3)]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Posez-moi une question…"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-[13.5px] placeholder:text-[hsl(var(--ink-4))] focus:outline-none"
            />
            <button
              onClick={send}
              className="grid h-9 w-9 place-items-center rounded-[8px] bg-[hsl(var(--brand))] text-white shadow-[var(--shadow-brand)] hover:bg-[hsl(var(--brand-ink))] disabled:opacity-40"
              disabled={!draft.trim()}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mx-auto mt-2 max-w-[720px] text-center text-[10.5px] text-[hsl(var(--ink-3))]">
            L&apos;IA peut faire des erreurs — vérifiez les informations importantes.
          </div>
        </div>
      </section>
    </div>
  );
}
