/**
 * authStore.js — État auth global
 */
import { create } from "zustand";
import { supabase, getProfile, createProfile } from "../utils/supabase.js";

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      let profile = await getProfile(session.user.id);
      if (!profile) profile = await createProfile(session.user.id, session.user.email);
      set({ user: session.user, profile, loading: false });
    } else {
      set({ loading: false });
    }

    // Écoute les changements d'auth
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        let profile = await getProfile(session.user.id);
        if (!profile) profile = await createProfile(session.user.id, session.user.email);
        set({ user: session.user, profile });
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  setProfile: (profile) => set({ profile }),

  canGenerateVideo: () => {
    const { profile } = get();
    if (!profile) return false;
    if (profile.plan === "unlimited") return true;
    return profile.videos_used < profile.videos_limit;
  },

  videosRemaining: () => {
    const { profile } = get();
    if (!profile) return 0;
    if (profile.plan === "unlimited") return Infinity;
    return Math.max(0, profile.videos_limit - profile.videos_used);
  },
}));
