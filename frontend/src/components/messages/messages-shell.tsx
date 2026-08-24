"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Search,
  Send,
  Loader2,
  Users as UsersIcon,
  RefreshCcw,
  Paperclip,
  Image as ImageIcon,
  Trash2,
  X,
  FileText,
  Download,
  AlertTriangle,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  chatApi,
  socketService,
  toast,
  useAuth,
  useUnreadMessagesStore,
  API_BASE_URL,
} from "@/services";
import type { Attachment, Conversation, Message } from "@/services";
import { MessageContent } from "./task-mention";
import { TaskMentionTextarea } from "./task-mention-textarea";
import { cn } from "@/lib/utils";

/** URL absolue d'une pièce jointe servie par le backend (/uploads/...). */
function mediaUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Fichier sélectionné avant envoi, avec URL d'aperçu pour les images. */
interface PendingFile {
  file: File;
  previewUrl: string | null;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `${diffDays} j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/** Minuscules sans accents, pour une recherche tolérante. */
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Aperçu texte d'un message pour la liste des conversations. */
function previewOf(msg: Pick<Message, "content" | "attachments" | "deletedAt">): string {
  if (msg.deletedAt) return "Message supprimé";
  if (msg.content?.trim()) return msg.content;
  const n = msg.attachments?.length ?? 0;
  if (n > 1) return `${n} pièces jointes`;
  if (n === 1) return msg.attachments![0].name;
  return "";
}

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return tb - ta;
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
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const clearUnreadForConv = useUnreadMessagesStore((s) => s.clearForConv);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const refetchConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const { conversations } = await chatApi.listConversations();
      const sorted = sortConversations(conversations);
      setConversations(sorted);
      setActiveId((curr) => curr ?? sorted[0]?.id ?? null);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  const bumpConversation = useCallback(
    (msg: Message) => {
      setConversations((curr) => {
        const idx = curr.findIndex((c) => c.id === msg.conversationId);
        if (idx === -1) return curr;
        const isActive = msg.conversationId === activeIdRef.current;
        const isMine = msg.senderId === user?.id;
        const incrUnread = !isActive && !isMine ? 1 : 0;
        const updated: Conversation = {
          ...curr[idx],
          unreadCount: (curr[idx].unreadCount ?? 0) + incrUnread,
          lastMessage: {
            content: previewOf(msg),
            senderId: msg.senderId,
            senderName: msg.senderName,
            createdAt: msg.createdAt,
          },
        };
        const rest = curr.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    },
    [user?.id],
  );

  useEffect(() => {
    refetchConversations();
  }, [refetchConversations]);

  // Le socket est lifecyclé par AuthProvider — on attache juste les listeners.
  useEffect(() => {
    const onMessage = (...args: unknown[]) => {
      const msg = args[0] as Message | undefined;
      if (!msg || !msg.conversationId) return;
      bumpConversation(msg);
      if (msg.conversationId === activeIdRef.current) {
        setMessages((curr) =>
          curr.some((m) => m.id === msg.id) ? curr : [...curr, msg],
        );
        // Conv active : on aligne lastReadAt côté serveur sans bruit.
        if (msg.senderId !== user?.id) {
          chatApi.markRead(msg.conversationId).catch(() => {});
        }
      }
    };

    const off = socketService.on("new_message", onMessage);
    return off;
  }, [bumpConversation, user?.id]);

  // Suppression temps réel : on remplace le message par son tombstone en place.
  useEffect(() => {
    const onDeleted = (...args: unknown[]) => {
      const msg = args[0] as Message | undefined;
      if (!msg?.id) return;
      setMessages((curr) =>
        curr.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)),
      );
      setConversations((curr) =>
        curr.map((c) =>
          c.lastMessage &&
          c.id === msg.conversationId &&
          c.lastMessage.createdAt === msg.createdAt
            ? { ...c, lastMessage: { ...c.lastMessage, content: "Message supprimé" } }
            : c,
        ),
      );
    };
    const off = socketService.on("message:deleted", onDeleted);
    return off;
  }, []);

  // Load messages + mark as read quand la conv active change.
  useEffect(() => {
    if (!activeId) return;
    setLoadingMsgs(true);
    chatApi
      .listMessages(activeId)
      .then(({ messages }) => setMessages(messages))
      .finally(() => setLoadingMsgs(false));

    chatApi.markRead(activeId).catch(() => {});
    clearUnreadForConv(activeId);
    setConversations((curr) =>
      curr.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c)),
    );
  }, [activeId, clearUnreadForConv]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, activeId]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const filteredConversations = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return conversations;
    return conversations.filter((c) => {
      const haystack = [
        conversationLabel(c, user?.id ?? ""),
        ...(c.members?.map((m) => m.name) ?? []),
        c.lastMessage?.senderName ?? "",
        c.lastMessage?.content ?? "",
      ];
      return haystack.some((value) => normalize(value).includes(q));
    });
  }, [conversations, query, user?.id]);

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    // Snapshot immédiat : l'input est remis à zéro juste après (onChange), ce
    // qui vide la FileList live. On fige donc les File maintenant.
    const incoming = Array.from(list);
    setPending((curr) => {
      const room = MAX_ATTACHMENTS - curr.length;
      if (room <= 0) {
        toast.error(`Maximum ${MAX_ATTACHMENTS} fichiers par message.`);
        return curr;
      }
      const picked: PendingFile[] = [];
      for (const file of incoming.slice(0, room)) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`« ${file.name} » dépasse 10 Mo.`);
          continue;
        }
        picked.push({
          file,
          previewUrl: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null,
        });
      }
      return [...curr, ...picked];
    });
  }

  function removePending(index: number) {
    setPending((curr) => {
      const target = curr[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return curr.filter((_, i) => i !== index);
    });
  }

  async function send() {
    const content = draft.trim();
    const files = pending.map((p) => p.file);
    if ((!content && files.length === 0) || !activeId) return;
    const snapshot = pending;
    setSending(true);
    setDraft("");
    setPending([]);
    try {
      const { message } = await chatApi.sendMessage(activeId, content, files);
      // Dedupe — socket may also broadcast this same message
      setMessages((curr) =>
        curr.some((m) => m.id === message.id) ? curr : [...curr, message],
      );
      bumpConversation(message);
      snapshot.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    } catch (err) {
      setDraft(content);
      setPending(snapshot);
      console.error("send message failed", err);
      toast.error(
        err instanceof Error ? err.message : "Envoi impossible.",
        "Message non envoyé",
      );
    } finally {
      setSending(false);
    }
  }

  async function confirmDelete() {
    const m = pendingDelete;
    if (!m) return;
    const snapshot = messages;
    setDeleting(true);
    setMessages((curr) =>
      curr.map((x) =>
        x.id === m.id
          ? { ...x, deletedAt: new Date().toISOString(), content: "", attachments: [] }
          : x,
      ),
    );
    try {
      await chatApi.deleteMessage(m.id);
      setPendingDelete(null);
    } catch (err) {
      setMessages(snapshot);
      toast.error(
        err instanceof Error ? err.message : "Suppression impossible.",
      );
    } finally {
      setDeleting(false);
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
            <button
              onClick={() => refetchConversations()}
              title="Rafraichir"
              className="grid h-7 w-7 place-items-center rounded-[6px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
              }}
              placeholder="Rechercher…"
              aria-label="Rechercher une conversation"
              allowClear
              prefix={
                <Search className="h-3.5 w-3.5 text-[hsl(var(--ink-3))]" />
              }
              className="w-full"
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
          ) : filteredConversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12px] text-[hsl(var(--ink-3))]">
              Aucun résultat pour «&nbsp;{query.trim()}&nbsp;».
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {filteredConversations.map((c) => {
                const label = conversationLabel(c, user.id);
                const lm = c.lastMessage;
                const previewSender =
                  lm && lm.senderId === user.id ? "Vous" : lm?.senderName;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={cn(
                        "group flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left",
                        activeId === c.id
                          ? "bg-[hsl(var(--bg-sunken))] text-ink"
                          : "text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--bg-sunken)/0.6)]",
                      )}
                    >
                      <Avatar id={c.id} name={label} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={cn(
                              "truncate text-[12.5px]",
                              c.unreadCount > 0 ? "font-semibold text-ink" : "font-medium",
                            )}
                          >
                            {label}
                          </span>
                          {c.unreadCount > 0 && (
                            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(var(--brand))] px-1 text-[9.5px] font-bold text-white">
                              {c.unreadCount}
                            </span>
                          )}
                          {lm && (
                            <span className="ml-auto shrink-0 font-mono text-[10px] text-[hsl(var(--ink-4))]">
                              {fmtRelative(lm.createdAt)}
                            </span>
                          )}
                        </div>
                        {lm ? (
                          <div className="truncate text-[11px] text-[hsl(var(--ink-3))]">
                            <span className="font-medium">{previewSender}:</span>{" "}
                            {lm.content}
                          </div>
                        ) : (
                          <div className="truncate text-[11px] text-[hsl(var(--ink-4))]">
                            Aucun message
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
                          {m.deletedAt ? (
                            <p className="mt-0.5 text-[13px] italic text-[hsl(var(--ink-4))]">
                              Message supprimé
                            </p>
                          ) : (
                            <>
                              {m.content?.trim() && (
                                <MessageContent
                                  content={m.content}
                                  mentionedTasks={m.mentionedTasks}
                                  className="mt-0.5 max-w-[68ch] text-[13.5px] leading-relaxed text-[hsl(var(--ink-2))]"
                                />
                              )}
                              {(m.attachments?.length ?? 0) > 0 && (
                                <MessageAttachments attachments={m.attachments!} />
                              )}
                            </>
                          )}
                        </div>
                        {!m.deletedAt && (isMine || isAdmin) && (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(m)}
                            title="Supprimer le message"
                            aria-label="Supprimer le message"
                            className="absolute right-2 top-1.5 hidden h-6 w-6 place-items-center rounded-[6px] text-[hsl(var(--ink-4))] hover:bg-[hsl(var(--alert-danger-bg))] hover:text-[hsl(var(--accent-rose))] group-hover:grid"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-3">
              <div className="rounded-[var(--radius-md)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg))] focus-within:border-[hsl(var(--brand)/0.5)] focus-within:ring-2 focus-within:ring-[hsl(var(--brand)/0.3)]">
                {pending.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-b border-[hsl(var(--line))] p-2">
                    {pending.map((p, i) => (
                      <div
                        key={i}
                        className="relative flex items-center gap-2 rounded-[var(--radius-sm)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-1.5 pr-6"
                      >
                        {p.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.previewUrl}
                            alt={p.file.name}
                            className="h-10 w-10 rounded-[4px] object-cover"
                          />
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-[4px] bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-3))]">
                            <FileText className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0 max-w-[140px]">
                          <div className="truncate text-[11.5px] font-medium">
                            {p.file.name}
                          </div>
                          <div className="text-[10px] text-[hsl(var(--ink-3))]">
                            {formatBytes(p.file.size)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePending(i)}
                          aria-label="Retirer la pièce jointe"
                          className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--accent-rose))]"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <TaskMentionTextarea
                  value={draft}
                  onChange={setDraft}
                  onSubmit={send}
                  placeholder="Écrivez votre message…"
                  rows={2}
                  disabled={sending}
                  className="max-h-40 w-full resize-none bg-transparent px-3 py-2.5 text-[13.5px] placeholder:text-[hsl(var(--ink-4))] focus:outline-none disabled:opacity-50"
                />
                <div className="flex items-center justify-between px-2 pb-2">
                  <div className="flex items-center gap-1">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      hidden
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={sending}
                      title="Joindre une photo"
                      className="grid h-7 w-7 place-items-center rounded-[6px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink disabled:opacity-50"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending}
                      title="Joindre un fichier"
                      className="grid h-7 w-7 place-items-center rounded-[6px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink disabled:opacity-50"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <span className="ml-1 hidden text-[10.5px] text-[hsl(var(--ink-3))] sm:inline">
                      <kbd className="font-mono">↵</kbd> envoyer ·{" "}
                      <kbd className="font-mono">#</kbd> lier une tâche
                    </span>
                  </div>
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={send}
                    disabled={(!draft.trim() && pending.length === 0) || sending}
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

      <Dialog.Root
        open={pendingDelete !== null}
        onOpenChange={(v) => {
          if (!v && !deleting) setPendingDelete(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[hsl(230_30%_8%/0.45)] backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <div className="flex items-start gap-3 px-5 pt-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[hsl(var(--alert-danger-bg))] text-[hsl(var(--accent-rose))]">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <Dialog.Title className="font-display text-[16px] font-semibold tracking-tight">
                  Supprimer ce message ?
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-[12.5px] leading-relaxed text-[hsl(var(--ink-3))]">
                  Le message et ses pièces jointes seront retirés pour tous les
                  participants. Cette action est irréversible.
                </Dialog.Description>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-5 py-3">
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" disabled={deleting}>
                  Annuler
                </Button>
              </Dialog.Close>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[hsl(var(--accent-rose))] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[hsl(348_70%_50%)] disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Supprimer
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/** Rendu des pièces jointes d'un message : images en vignettes, autres en liens. */
function MessageAttachments({ attachments }: { attachments: Attachment[] }) {
  const images = attachments.filter((a) => isImageMime(a.mime));
  const files = attachments.filter((a) => !isImageMime(a.mime));
  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {images.map((a) => (
            <a
              key={a.url}
              href={mediaUrl(a.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-[var(--radius-sm)] border border-[hsl(var(--line))]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(a.url)}
                alt={a.name}
                className="max-h-52 max-w-[280px] object-cover"
              />
            </a>
          ))}
        </div>
      )}
      {files.map((a) => (
        <a
          key={a.url}
          href={mediaUrl(a.url)}
          target="_blank"
          rel="noopener noreferrer"
          download={a.name}
          className="group/file inline-flex max-w-[280px] items-center gap-2 rounded-[var(--radius-sm)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] p-2 hover:border-[hsl(var(--brand)/0.4)]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[5px] bg-[hsl(var(--bg-sunken))] text-[hsl(var(--ink-3))]">
            <FileText className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-medium">
              {a.name}
            </span>
            <span className="block text-[10.5px] text-[hsl(var(--ink-3))]">
              {formatBytes(a.size)}
            </span>
          </span>
          <Download className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ink-4))] group-hover/file:text-[hsl(var(--brand-ink))]" />
        </a>
      ))}
    </div>
  );
}
