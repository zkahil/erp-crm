"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { Toaster } from "@/components/ui/toaster";

export function AppShell({
  user, signOutAction, children,
}: {
  user: { name: string; role: string };
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const [nav, setNav] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((o) => !o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <Sidebar open={nav} onClose={() => setNav(false)} user={user} signOutAction={signOutAction} />
      <div className="flex min-w-0 flex-col">
        <Topbar onMenu={() => setNav(true)} onSearch={() => setPalette(true)} />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <Toaster />
    </div>
  );
}
