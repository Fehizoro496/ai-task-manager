"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/shell/sidebar";
import { useAuthStore } from "@/services";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user?.status === "PENDING") {
      router.replace("/pending");
    } else if (status === "authenticated" && user?.status === "REJECTED") {
      router.replace("/login");
    }
  }, [status, user, router]);

  if (status !== "authenticated" || !user || user.status !== "APPROVED") {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper">
        <div className="flex items-center gap-2 text-[13px] text-[hsl(var(--ink-3))]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
