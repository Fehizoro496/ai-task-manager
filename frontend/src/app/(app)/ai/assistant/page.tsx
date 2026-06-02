import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { AssistantShell } from "@/components/ai/assistant-shell";

export default function AssistantPage() {
  return (
    <>
      <Topbar
        breadcrumb={<Breadcrumb items={[{ label: "IA Planification", href: "/ai/new" }, { label: "Assistant" }]} />}
      />
      <main className="flex-1 px-6 py-6">
        <AssistantShell />
      </main>
    </>
  );
}
