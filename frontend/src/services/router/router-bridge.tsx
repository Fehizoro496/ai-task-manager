"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { bindRouter, unbindRouter } from "./router-service";

/**
 * Composant invisible monte dans le layout root. Bind le router Next sur
 * notre singleton service a chaque render. Doit etre rendu apres tous
 * les autres providers (pour eviter une boucle de redirect).
 */
export function RouterBridge() {
  const router = useRouter();
  useEffect(() => {
    bindRouter(router);
    return () => unbindRouter();
  }, [router]);
  return null;
}
