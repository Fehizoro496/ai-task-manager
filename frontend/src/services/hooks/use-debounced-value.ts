"use client";
import { useEffect, useState } from "react";

/**
 * Retarde la propagation d'une valeur qui change vite (saisie clavier) afin de
 * ne déclencher les effets qui en dépendent — requête réseau notamment —
 * qu'une fois la frappe stabilisée.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
