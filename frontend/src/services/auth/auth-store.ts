"use client";
import { create } from "zustand";
import type { User } from "../api/types";
import { tokenStorage } from "../api/client";

interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  setSession: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
  setStatus: (status: AuthState["status"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  status: "idle",

  setSession: (token, user) => {
    tokenStorage.set(token);
    set({ token, user, status: "authenticated" });
  },

  setUser: (user) => set({ user }),

  setStatus: (status) => set({ status }),

  logout: () => {
    tokenStorage.clear();
    set({ user: null, token: null, status: "unauthenticated" });
  },
}));

export const isAdmin = (user: User | null) => user?.role === "ADMIN";
