import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { ROLE_LABEL } from "@/lib/status";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const u = session.user as { name?: string | null; email?: string | null; role?: string };

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell user={{ name: u.name ?? u.email ?? "Utilisateur", role: ROLE_LABEL[u.role ?? ""] ?? "" }} signOutAction={signOutAction}>
      {children}
    </AppShell>
  );
}
