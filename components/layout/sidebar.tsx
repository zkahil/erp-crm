"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LogOut } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { NAV_GROUPS } from "./nav";
import { initials } from "@/lib/format";

export function Sidebar({
  open, onClose, user, signOutAction,
}: {
  open: boolean;
  onClose: () => void;
  user: { name: string; role: string };
  signOutAction: () => Promise<void>;
}) {
  const path = usePathname();
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-canvas px-3 py-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2 text-brand" onClick={onClose}>
          <LogoMark />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">ERP CRM</span>
        </Link>

        <nav className="flex-1 space-y-5 overflow-y-auto" aria-label="Navigation principale">
          {NAV_GROUPS.map((g) => (
            <div key={g.title}>
              <p className="mb-1 px-2 text-xs text-muted">{g.title}</p>
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = path === it.href || path.startsWith(it.href + "/");
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={clsx(
                          "flex h-9 items-center gap-2.5 rounded-lg px-2 text-sm transition-colors",
                          active ? "bg-brand-soft font-medium text-brand" : "text-ink/80 hover:bg-sunken",
                        )}
                      >
                        <it.icon className="size-[18px]" aria-hidden />
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{initials(user.name)}</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.role}</p>
          </div>
          <form action={signOutAction}>
            <button aria-label="Se déconnecter" className="rounded-md p-1.5 text-muted hover:bg-sunken"><LogOut className="size-4" /></button>
          </form>
        </div>
      </aside>
    </>
  );
}
