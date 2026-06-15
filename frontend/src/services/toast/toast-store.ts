"use client";
import { create } from "zustand";

export type ToastKind = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
  duration: number;
  action?: ToastAction;
}

interface ToastState {
  toasts: Toast[];
  push: (input: Omit<Toast, "id" | "duration"> & { duration?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: ({ duration = 4500, ...input }) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, duration, ...input }] }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

export { useToastStore };

export const toast = {
  success: (message: string, title?: string) =>
    useToastStore.getState().push({ kind: "success", message, title }),
  error: (message: string, title?: string) =>
    useToastStore.getState().push({ kind: "error", message, title, duration: 6500 }),
  info: (message: string, title?: string) =>
    useToastStore.getState().push({ kind: "info", message, title }),
  warning: (message: string, title?: string) =>
    useToastStore.getState().push({ kind: "warning", message, title }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
