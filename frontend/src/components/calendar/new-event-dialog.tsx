"use client";
import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarPlus,
  Globe2,
  Loader2,
  Lock,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  calendarApi,
  toast,
  usersApi,
  useAuth,
  useProjects,
} from "@/services";
import type {
  CalendarEventVisibility,
  CustomCalendarEvent,
  User,
} from "@/services";
import { cn } from "@/lib/utils";

// Radix Select interdit la valeur "" sur un Item — on utilise un sentinel.
const NO_PROJECT = "__none__";

interface NewEventDialogProps {
  open: boolean;
  onClose: () => void;
  /** Date pré-sélectionnée (ISO ou YYYY-MM-DD). */
  initialDate?: string | null;
  /** Callback après création réussie. */
  onCreated?: (event: CustomCalendarEvent) => void;
}

// Normalise vers « minuit UTC » du jour calendaire d'entrée, peu importe
// le format reçu (YYYY-MM-DD ou ISO complet). Les serveurs renvoient les
// dates en YYYY-MM-DD basé UTC : on doit s'aligner pour éviter le j-1.
const toIso = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (value.length === 10) {
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d)).toISOString();
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  ).toISOString();
};

const todayUtcIso = () => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  ).toISOString();
};

export function NewEventDialog({
  open,
  onClose,
  initialDate,
  onCreated,
}: NewEventDialogProps) {
  const { user: currentUser } = useAuth();
  const { projects } = useProjects();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [visibility, setVisibility] = useState<CalendarEventVisibility>("PUBLIC");
  const [viewerIds, setViewerIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset à chaque ouverture, recale la date initiale.
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setDate(toIso(initialDate ?? null) ?? todayUtcIso());
    setProjectId("");
    setVisibility("PUBLIC");
    setViewerIds([]);
    setError(null);
    setSaving(false);
  }, [open, initialDate]);

  // Charge la liste des users une seule fois (à l'ouverture).
  useEffect(() => {
    if (!open || usersLoaded) return;
    usersApi
      .list()
      .then((res) => {
        setUsers(res.users);
        setUsersLoaded(true);
      })
      .catch(() => setUsersLoaded(true));
  }, [open, usersLoaded]);

  const availableViewers = useMemo(
    () =>
      users.filter(
        (u) => u.id !== currentUser?.id && !viewerIds.includes(u.id),
      ),
    [users, currentUser?.id, viewerIds],
  );

  const selectedViewers = useMemo(
    () => viewerIds.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[],
    [viewerIds, users],
  );

  const submit = async () => {
    if (!title.trim() || !date) {
      setError("Saisissez un titre et choisissez une date.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { event } = await calendarApi.create({
        title: title.trim(),
        date,
        description: description.trim() || undefined,
        projectId: projectId || null,
        visibility,
        viewerIds: visibility === "RESTRICTED" ? viewerIds : undefined,
      });
      toast.success(`« ${event.title} » a été ajouté.`, "Événement créé");
      onCreated?.(event);
      onClose();
    } catch (e) {
      console.error("Create event failed", e);
      const message = e instanceof Error ? e.message : "Création impossible.";
      setError(message);
      toast.error(message, "Création de l'événement");
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[hsl(230_30%_8%/0.45)] backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[540px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-3)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <header className="flex items-center justify-between border-b border-[hsl(var(--line))] px-5 py-4">
            <Dialog.Title className="flex items-center gap-2 font-display text-[18px] font-semibold tracking-tight">
              <CalendarPlus className="h-4 w-4 text-[hsl(var(--brand-ink))]" />
              Nouvel événement
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="grid h-8 w-8 place-items-center rounded-[8px] text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </header>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
            <Field label="Titre">
              <Input
                autoFocus
                placeholder="Ex. Revue de sprint"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <DatePicker
                  value={date}
                  onChange={setDate}
                  disabled={saving}
                  placeholder="Choisir une date"
                  className="w-full !h-10"
                />
              </Field>
              <Field label="Projet (optionnel)">
                <Select
                  value={projectId || NO_PROJECT}
                  onChange={(v) => setProjectId(v === NO_PROJECT ? "" : v)}
                  disabled={saving}
                  placeholder="— Aucun —"
                  options={[
                    { value: NO_PROJECT, label: "— Aucun —" },
                    ...projects.map((p) => ({
                      value: p.id,
                      label: p.name,
                      swatch: p.color ?? undefined,
                    })),
                  ]}
                />
              </Field>
            </div>

            <Field label="Description (optionnelle)">
              <Textarea
                placeholder="Détails de l'événement…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                rows={3}
              />
            </Field>

            <div>
              <div className="mb-1.5 text-[12px] font-semibold tracking-tight text-[hsl(var(--ink-2))]">
                Visibilité
              </div>
              <div className="grid grid-cols-2 gap-2">
                <VisibilityCard
                  icon={Globe2}
                  title="Public"
                  description="Visible par tous les utilisateurs."
                  selected={visibility === "PUBLIC"}
                  onClick={() => setVisibility("PUBLIC")}
                  disabled={saving}
                />
                <VisibilityCard
                  icon={Lock}
                  title="Restreint"
                  description="Visible par le créateur, les utilisateurs choisis et les membres du projet."
                  selected={visibility === "RESTRICTED"}
                  onClick={() => setVisibility("RESTRICTED")}
                  disabled={saving}
                />
              </div>
            </div>

            {visibility === "RESTRICTED" && (
              <Field label="Personnes spécifiques (optionnel)">
                <ViewerMultiSelect
                  selected={selectedViewers}
                  available={availableViewers}
                  loaded={usersLoaded}
                  disabled={saving}
                  onAdd={(id) => setViewerIds((curr) => [...curr, id])}
                  onRemove={(id) =>
                    setViewerIds((curr) => curr.filter((v) => v !== id))
                  }
                />
                {!!projectId && (
                  <span className="mt-1 block text-[11px] text-[hsl(var(--ink-3))]">
                    Les membres du projet sélectionné y auront aussi accès.
                  </span>
                )}
              </Field>
            )}

            {error && (
              <div className="rounded-[var(--radius-sm)] border border-[hsl(var(--accent-rose)/0.3)] bg-[hsl(var(--alert-danger-bg))] px-3 py-2 text-[12.5px] text-[hsl(var(--accent-rose))]">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[hsl(var(--line))] bg-[hsl(var(--bg-sunken)/0.4)] px-5 py-3">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button variant="brand" size="sm" onClick={submit} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {saving ? "Création…" : "Créer l'événement"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function VisibilityCard({
  icon: Icon,
  title,
  description,
  selected,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-start gap-1.5 rounded-[var(--radius-md)] border bg-[hsl(var(--bg))] p-3 text-left transition-colors",
        selected
          ? "border-[hsl(var(--brand)/0.55)] bg-[hsl(var(--brand-soft)/0.55)] ring-1 ring-[hsl(var(--brand)/0.35)]"
          : "border-[hsl(var(--line))] hover:border-[hsl(var(--ink-4))]",
        disabled && "opacity-60",
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            selected ? "text-[hsl(var(--brand-ink))]" : "text-[hsl(var(--ink-3))]",
          )}
        />
        <span className="text-[13px] font-semibold tracking-tight">{title}</span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-[hsl(var(--ink-3))]">
        {description}
      </p>
    </button>
  );
}

function ViewerMultiSelect({
  selected,
  available,
  loaded,
  disabled,
  onAdd,
  onRemove,
}: {
  selected: User[];
  available: User[];
  loaded: boolean;
  disabled?: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [available, query]);

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-[var(--radius-sm)] border border-[hsl(var(--line-strong))] bg-[hsl(var(--bg-elevated))] px-2 py-1.5",
          open && "border-[hsl(var(--brand)/0.6)] ring-2 ring-[hsl(var(--brand)/0.3)]",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        {selected.map((u) => (
          <span
            key={u.id}
            className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--bg-sunken))] py-0.5 pl-0.5 pr-1.5 text-[11.5px]"
          >
            <Avatar id={u.id} name={u.name} size="xs" />
            <span className="font-medium">{u.name}</span>
            <button
              type="button"
              onClick={() => onRemove(u.id)}
              className="grid h-3.5 w-3.5 place-items-center rounded-full text-[hsl(var(--ink-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-[hsl(var(--accent-rose))]"
              aria-label={`Retirer ${u.name}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <div className="flex min-w-[120px] flex-1 items-center gap-1">
          <Search className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ink-3))]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={selected.length === 0 ? "Ajouter une personne…" : ""}
            className="min-w-0 flex-1 bg-transparent text-[12.5px] placeholder:text-[hsl(var(--ink-4))] focus:outline-none"
            autoComplete="off"
          />
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-[220px] overflow-y-auto rounded-[var(--radius-md)] border border-[hsl(var(--line))] bg-[hsl(var(--bg-elevated))] shadow-[var(--shadow-2)]">
          {!loaded ? (
            <div className="flex items-center justify-center gap-2 px-4 py-4 text-[12px] text-[hsl(var(--ink-3))]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-4 text-center text-[12px] text-[hsl(var(--ink-3))]">
              Aucun utilisateur disponible
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onAdd(u.id);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left hover:bg-[hsl(var(--bg-sunken)/0.7)]"
                  >
                    <Avatar id={u.id} name={u.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium tracking-tight">
                        {u.name}
                      </div>
                      <div className="truncate text-[11px] text-[hsl(var(--ink-3))]">
                        {u.email}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
