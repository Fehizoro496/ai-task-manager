/**
 * Force le téléchargement d'un fichier plutôt que son ouverture dans un onglet.
 *
 * L'attribut `download` d'un `<a>` est ignoré pour les URL cross-origin : le
 * navigateur ouvre alors le fichier dans un nouvel onglet. On récupère donc la
 * ressource en blob (même origine grâce au CORS backend) puis on déclenche le
 * téléchargement sur une URL blob locale, où `download` est respecté.
 */
export async function downloadFile(url: string, filename?: string): Promise<void> {
  try {
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerAnchorDownload(objectUrl, filename);
    // Laisse le temps au clic de se propager avant de révoquer.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    // Repli : navigation directe (le navigateur télécharge ou affiche selon
    // les en-têtes), au moins l'utilisateur n'est pas bloqué.
    triggerAnchorDownload(url, filename);
  }
}

function triggerAnchorDownload(href: string, filename?: string) {
  const a = document.createElement("a");
  a.href = href;
  if (filename) a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
