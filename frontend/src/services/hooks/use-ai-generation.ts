"use client";
import { create } from "zustand";
import { aiApi } from "../api/ai.api";
import type { AiDraft } from "../api/types";
import { useToastStore } from "../toast/toast-store";
import { routerService } from "../router";

type GenStatus = "idle" | "generating" | "done" | "error";

interface AiGenerationState {
  status: GenStatus;
  draft: AiDraft | null;
  /** Projet ciblé par la génération en cours (pour la redirection après approbation). */
  projectId: string | null;
  error: string | null;
  /**
   * Lance la génération. Vit dans le store (pas dans le composant) → survit
   * à la navigation in-app. Notifie via un toast cliquable à la fin.
   */
  start: (input: { projectId: string; document: string }) => Promise<void>;
  setDraft: (draft: AiDraft) => void;
  reset: () => void;
}

export const useAiGenerationStore = create<AiGenerationState>((set, get) => ({
  status: "idle",
  draft: null,
  projectId: null,
  error: null,

  start: async ({ projectId, document }) => {
    if (get().status === "generating") return;
    set({ status: "generating", error: null, draft: null, projectId });
    try {
      const draft = await aiApi.generatePlan({ projectId, document });
      set({ status: "done", draft });
      useToastStore.getState().push({
        kind: "success",
        title: "Génération terminée",
        message: "Votre plan IA est prêt.",
        duration: 8000,
        action: { label: "Voir l'aperçu", onClick: () => routerService.toAiNew() },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "La génération a échoué.";
      set({ status: "error", error: message });
      useToastStore.getState().push({
        kind: "error",
        title: "Génération du plan",
        message,
        duration: 6500,
      });
    }
  },

  setDraft: (draft) => set({ draft }),
  reset: () => set({ status: "idle", draft: null, projectId: null, error: null }),
}));
