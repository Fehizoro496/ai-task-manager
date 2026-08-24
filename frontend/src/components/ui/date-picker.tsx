"use client";
import { DatePicker as AntDatePicker } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  /** Date sélectionnée en ISO 8601 (ou null). */
  value: string | null;
  /** Appelé avec une ISO (ou null pour effacer). */
  onChange: (iso: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Style appliqué au champ (ex. couleur rouge pour overdue). */
  className?: string;
  /** Quand fourni, affiché à droite (ex. <Badge tone="rose">en retard</Badge>). */
  trailing?: React.ReactNode;
}

// Le contrat public reste « ISO minuit UTC » du jour calendaire, sans dérive
// timezone : on ne manipule que la portion YYYY-MM-DD.
const isoToDayjs = (iso: string | null): Dayjs | null =>
  iso ? dayjs(iso.slice(0, 10)) : null;

const dayjsToIso = (d: Dayjs | null): string | null =>
  d ? new Date(`${d.format("YYYY-MM-DD")}T00:00:00.000Z`).toISOString() : null;

export function DatePicker({
  value,
  onChange,
  placeholder = "Choisir une date",
  disabled,
  className,
  trailing,
}: DatePickerProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <AntDatePicker
        value={isoToDayjs(value)}
        onChange={(d) => onChange(dayjsToIso(d))}
        placeholder={placeholder}
        disabled={disabled}
        format="D MMM YYYY"
        // Cf. Select : le calendrier doit s'ouvrir dans le conteneur du trigger
        // pour rester cliquable dans une Radix Dialog modale.
        getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
        className={cn("w-full", className)}
      />
      {trailing}
    </div>
  );
}
