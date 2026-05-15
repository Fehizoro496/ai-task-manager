import { Settings as SettingsIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function ProjectSettingsPage() {
  return (
    <main className="px-8 py-8">
      <EmptyState
        Icon={SettingsIcon}
        title="Paramètres du projet"
        hint="Nom, couleur, dépôt, intégrations, archivage — en cours de design."
      />
    </main>
  );
}
