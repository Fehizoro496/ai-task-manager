"use client";
import { Select as AntSelect } from "antd";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
  swatch?: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Classe appliquée au popup du dropdown. */
  contentClassName?: string;
}

/** Rendu d'une option : pastille de couleur optionnelle + libellé. */
function OptionLabel({ opt }: { opt: SelectOption }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {opt.swatch && (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
          style={{ background: opt.swatch }}
        />
      )}
      <span className="min-w-0 flex-1 truncate">{opt.label}</span>
    </span>
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  disabled,
  className,
  contentClassName,
}: SelectProps) {
  return (
    <AntSelect
      value={value || undefined}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      // Rend le dropdown à l'intérieur du conteneur du trigger : indispensable
      // dans une Radix Dialog modale (body en pointer-events:none) pour que les
      // clics souris sur les options soient pris en compte.
      getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
      className={cn("w-full", className)}
      classNames={contentClassName ? { popup: { root: contentClassName } } : undefined}
      options={options.map((opt) => ({
        value: opt.value,
        disabled: opt.disabled,
        label: <OptionLabel opt={opt} />,
      }))}
    />
  );
}
