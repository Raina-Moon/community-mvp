import { create } from "zustand";
import { supabase } from "../lib/supabase";
import * as AuthSvc from "../services/auth";
import type { User } from "@supabase/supabase-js";

type AuthState = {
  user: User | null;
  bootstrap: () => void;
  subscribeAuth: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  async bootstrap() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ user: session?.user ?? null });
    } catch {
      set({ user: null });
    }
  },

  subscribeAuth() {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
    return () => subscription.unsubscribe();
  },

  async signIn(email, password) {
    await AuthSvc.signIn(email, password);
  },

  async signUp(email, password, username) {
    await AuthSvc.signUp(email, password, username);
    const u = await AuthSvc.getCurrentUser();
    set({ user: u ?? null });
  },

  async signOut() {
    await AuthSvc.signOut();
  },
}));
