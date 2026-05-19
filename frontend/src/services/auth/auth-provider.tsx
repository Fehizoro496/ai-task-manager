"use client";
import { useEffect } from "react";
import { authApi } from "../api/auth.api";
import { ApiError, tokenStorage } from "../api/client";
import { socketService } from "../socket/socket";
import { projectsStoreApi } from "../hooks/use-projects";
import { useAuthStore } from "./auth-store";
import { applyAppearance, resetAppearance } from "@/lib/apply-appearance";
import type { User } from "../api/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  // 1. Bootstrap : si token en session, charger /me
  useEffect(() => {
    const stored = tokenStorage.get();
    if (!stored) {
      setStatus("unauthenticated");
      return;
    }
    setStatus("loading");
    authApi
      .me()
      .then((me) => setSession(stored, me))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
        } else {
          setStatus("unauthenticated");
        }
      });
  }, [setSession, setStatus, logout]);

  // 2. Socket : connecté tant qu'un token est en mémoire (y compris PENDING)
  useEffect(() => {
    if (!token || !user) {
      socketService.disconnect();
      // Vide les caches métiers à la déconnexion (sinon un autre user dans
      // le même onglet hériterait des données de la session précédente).
      projectsStoreApi.getState().reset();
      return;
    }
    socketService.connect({ token });
    return () => {
      // Pas de déco ici — l'unmount n'arrive qu'à la fin de la session
    };
  }, [token, user]);

  // 3. Écoute les changements de statut (approve/reject par l'admin)
  useEffect(() => {
    const off = socketService.on("user:status_change", (...args) => {
      const payload = args[0] as { user: User } | undefined;
      if (!payload?.user) return;
      setUser(payload.user);
    });
    return off;
  }, [setUser]);

  // 4. Applique l'apparence (theme/accent/density) à chaque changement
  //    des préférences de l'utilisateur courant.
  useEffect(() => {
    if (user?.preferences?.appearance) {
      applyAppearance(user.preferences.appearance);
    } else if (!user) {
      resetAppearance();
    }
  }, [user]);

  return <>{children}</>;
}
