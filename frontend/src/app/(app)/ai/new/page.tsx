import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { PlanWizard } from "@/components/ai/plan-wizard";

export default function AiNewPlanPage() {
  return (
    <>
      <Topbar
        breadcrumb={<Breadcrumb items={[{ label: "IA Planification" }, { label: "Nouvelle génération" }]} />}
      />
      <main className="flex-1 px-8 py-8">
        <PlanWizard />
      </main>
    </>
  );
}
