import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { SettingsShell } from "@/components/settings/settings-shell";

export default function SettingsPage() {
  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Paramètres" }]} />} />
      <main className="flex-1 px-8 py-7">
        <div className="mb-6">
          <h1 className="font-display text-[28px] font-semibold tracking-tight">
            Paramètres
          </h1>
          <p className="mt-1 text-[13.5px] text-[hsl(var(--ink-3))]">
            Votre compte, votre équipe, vos préférences — tout au même endroit.
          </p>
        </div>
        <SettingsShell />
      </main>
    </>
  );
}
