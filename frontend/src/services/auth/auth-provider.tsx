"use client";
import { useEffect } from "react";
import { authApi } from "../api/auth.api";
import { ApiError, tokenStorage } from "../api/client";
import { useAuthStore } from "./auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setStatus = useAuthStore((s) => s.setStatus);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }
    setStatus("loading");
    authApi
      .me()
      .then((user) => setSession(token, user))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
        } else {
          setStatus("unauthenticated");
        }
      });
  }, [setSession, setStatus, logout]);

  return <>{children}</>;
}
