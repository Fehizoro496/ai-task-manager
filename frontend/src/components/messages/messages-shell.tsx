"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, Send, Loader2, Users as UsersIcon } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { chatApi, socketService, useAuth } from "@/services";
import type { Conversation, Message } from "@/services";
import { cn } from "@/lib/utils";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function conversationLabel(conv: Conversation, currentUserId: string): string {
  if (conv.name) return conv.name;
  const others = conv.members?.filter((m) => m.id !== currentUserId) ?? [];
  if (others.length === 0) return "Conversation";
  if (others.length === 1) return others[0].name;
  return others.map((o) => o.name).join(", ");
}

export function MessagesShell() {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const refetchConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const { conversations } = await chatApi.listConversations();
      setConversations(conversations);
      setActiveId((curr) => curr ?? conversations[0]?.id ?? null);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    refetchConversations();
  }, [refetchConversations]);

  // Connect socket once when token is available
  useEffect(() => {
    if (!token) return;
    const socket = socketService.connect({ token });

    const onMessage = (payload: unknown) => {
      const msg = payload as Message;
      if (!msg || !msg.conversationId) return;
      if (msg.conversationId === activeIdRef.current) {
        setMessages((curr) =>
          curr.some((m) => m.id === msg.id) ? curr : [...curr, msg],
        );
      }
    };

    socket.on("new_message", onMessage);
    socket.on("message:new", onMessage);

    return () => {
      socket.off("new_message", onMessage);
      socket.off("message:new", onMessage);
      socketService.disconnect();
    };
  }, [token]);

  // Load messages + join room when active conversation changes
  useEffect(() => {
    if (!activeId) return;
    setLoadingMsgs(true);
    chatApi
      .listMessages(activeId)
      .then(({ messages }) => setMessages(messages))
      .finally(() => setLoadingMsgs(false));

    socketService.joinConversation(activeId);
    return () => {
      socketService.leaveConversation(activeId);
    };
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, activeId]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  async function send() {
    if (!draft.trim() || !activeId) return;
    const content = draft.trim();
    setSending(true);
    setDraft("");
    try {
      const { message } = await chatApi.sendMessage(activeId, content);
      // Dedupe — socket may also broadcast this same message
      setMessages((curr) =>
        curr.some((m) => m.id === message.id) ? curr : [...curr, message],
      );
    } catch (err) {
      setDraft(content);
      console.error("send message failed", err);
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="grid h-[calc(100dvh-60px)] grid-cols-[280px_1fr]">
      <aside className="flex min-h-0 flex-col border-r border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))]">
        <header className="border-b border-[hsl(var(--line))] p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold tracking-tight">
              Messages
            </h2>
            <button className="grid h-7 w-7 place-items-center rounded-[6px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))]">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--ink-3))]" />
            <input
              placeholder="Rechercher…"
              className="h-8 w-full rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] pl-7 pr-2 text-[12.5px] placeholder:text-[hsl(var(--ink-4))] focus:border-[hsl(var(--brand)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.3)]"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loadingConvs ? (
            <div className="flex items-center justify-center gap-2 py-6 text-[12px] text-[hsl(var(--ink-3))]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement…
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12px] text-[hsl(var(--ink-3))]">
              Aucune conversation.
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {conversations.map((c) => {
                const label = conversationLabel(c, user.id);
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left",
                        activeId === c.id
                          ? "bg-[hsl(var(--bg-sunken))] text-ink"
                          : "text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--bg-sunken)/0.6)]",
                      )}
                    >
                      <Avatar id={c.id} name={label} size="xs" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-medium">{label}</div>
                        {c.lastMessage && (
                          <div className="truncate text-[10.5px] text-[hsl(var(--ink-3))]">
                            {c.lastMessage.senderName}: {c.lastMessage.content}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col bg-paper">
        {active ? (
          <>
            <header className="flex items-center gap-3 border-b border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] px-5 py-3">
              <Avatar id={active.id} name={conversationLabel(active, user.id)} size="md" />
              <div className="min-w-0">
                <h1 className="truncate font-display text-[16px] font-semibold tracking-tight">
                  {conversationLabel(active, user.id)}
                </h1>
                <p className="truncate text-[11.5px] text-[hsl(var(--ink-3))]">
                  {active.members?.length ?? 0} membre
                  {(active.members?.length ?? 0) > 1 ? "s" : ""}
                </p>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
              {loadingMsgs ? (
                <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[hsl(var(--ink-3))]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des messages…
                </div>
              ) : messages.length === 0 ? (
                <div className="grid place-items-center py-16 text-center text-[13px] text-[hsl(var(--ink-3))]">
                  Aucun message. Commencez la conversation.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {messages.map((m, i) => {
                    const prev = messages[i - 1];
                    const grouped =
                      prev &&
                      prev.senderId === m.senderId &&
                      new Date(m.createdAt).getTime() -
                        new Date(prev.createdAt).getTime() <
                        5 * 60_000;
                    const isMine = m.senderId === user.id;
                    return (
                      <li
                        key={m.id}
                        className="group relative flex items-start gap-3 rounded-[var(--radius-md)] px-2 py-1.5 hover:bg-[hsl(var(--bg-elevated)/0.6)]"
                      >
                        {grouped ? (
                          <span className="w-8 shrink-0 text-center text-[10px] text-transparent group-hover:text-[hsl(var(--ink-4))] font-mono tabular">
                            {fmtTime(m.createdAt)}
                          </span>
                        ) : (
                          <Avatar id={m.senderId} name={m.senderName} size="md" />
                        )}
                        <div className="min-w-0 flex-1">
                          {!grouped && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-[13.5px] font-semibold tracking-tight">
                                {isMine ? user.name : m.senderName}
                              </span>
                              <span className="font-mono text-[10.5px] text-[hsl(var(--ink-3))]">
                                {fmtTime(m.createdAt)}
                              </span>
                            </div>
                          )}
                          <div className="mt-0.5 max-w-[68ch] whitespace-pre-wrap text-[13.5px] leading-relaxed text-[hsl(var(--ink-2))]">
                            {m.content}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-3">
              <div className="rounded-[var(--radius-md)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] focus-within:border-[hsl(var(--brand)/0.5)] focus-within:ring-2 focus-within:ring-[hsl(var(--brand)/0.3)]">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Écrivez votre message…"
                  rows={2}
                  disabled={sending}
                  className="max-h-40 w-full resize-none bg-transparent px-3 py-2.5 text-[13.5px] placeholder:text-[hsl(var(--ink-4))] focus:outline-none disabled:opacity-50"
                />
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="text-[10.5px] text-[hsl(var(--ink-3))]">
                    <kbd className="font-mono">↵</kbd> envoyer ·{" "}
                    <kbd className="font-mono">⇧↵</kbd> ligne
                  </span>
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={send}
                    disabled={!draft.trim() || sending}
                  >
                    {sending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Envoyer
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-3))]">
                <UsersIcon className="h-5 w-5" />
              </span>
              <div className="mt-3 text-[13px] font-medium">
                Aucune conversation sélectionnée
              </div>
              <div className="mt-1 text-[11.5px] text-[hsl(var(--ink-3))]">
                Choisissez une conversation à gauche.
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
