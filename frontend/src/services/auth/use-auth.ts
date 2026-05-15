"use client";
import { useAuthStore } from "./auth-store";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);
  const setSession = useAuthStore((s) => s.setSession);

  return {
    user,
    token,
    status,
    isAuthenticated: status === "authenticated",
    isAdmin: user?.role === "ADMIN",
    logout,
    setSession,
  };
}

export const useCurrentUser = () => useAuthStore((s) => s.user);
