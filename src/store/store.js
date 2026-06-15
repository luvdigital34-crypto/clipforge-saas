import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useStore = create(
  persist(
    (set, get) => ({
      // Clé API (stockée localement)
      apiKey: "",
      setApiKey: (k) => set({ apiKey: k }),

      // Projet courant
      project: null,
      setProject: (p) => set({ project: p }),

      // Résultats agents
      agentResults: null,
      setAgentResults: (r) => set({ agentResults: r }),

      // Résultats rendu vidéo
      renderResults: {},
      setRenderResult: (id, r) =>
        set((s) => ({ renderResults: { ...s.renderResults, [id]: r } })),

      // Variante sélectionnée
      selectedVariant: null,
      setSelectedVariant: (id) => set({ selectedVariant: id }),

      // Pipeline
      pipeline: { step: "idle", message: "", percent: 0 },
      setPipeline: (step, message, percent) =>
        set({ pipeline: { step, message, percent } }),

      // Historique
      history: [],
      addToHistory: (p) =>
        set((s) => ({ history: [p, ...s.history].slice(0, 30) })),

      reset: () =>
        set({
          project: null,
          agentResults: null,
          renderResults: {},
          selectedVariant: null,
          pipeline: { step: "idle", message: "", percent: 0 },
        }),
    }),
    {
      name: "clipforge-storage",
      partialize: (s) => ({ apiKey: s.apiKey, history: s.history }),
    }
  )
);
