import { Topbar } from "@/components/shell/topbar";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { MessagesShell } from "@/components/messages/messages-shell";

export default function MessagesPage() {
  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Messages" }]} />} />
      <MessagesShell />
    </>
  );
}
