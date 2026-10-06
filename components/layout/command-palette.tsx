"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CornerDownLeft, Plus, Search } from "lucide-react";
import { NAV_GROUPS } from "./nav";

type Item = { id: string; group: string; label: string; hint?: string; href: string };

const BASE: Item[] = [
  { id: "a-customer", group: "Actions", label: "Nouveau client", href: "/clients?new=1" },
  ...NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ id: `n-${i.href}`, group: "Aller à", label: i.label, href: i.href }))),
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [remote, setRemote] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQ(""); setRemote([]); setIdx(0); setTimeout(() => input.current?.focus(), 0); }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) { setRemote([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then(setRemote)
        .catch(() => {});
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const local = needle ? BASE.filter((i) => i.label.toLowerCase().includes(needle)) : BASE;
    return [...remote, ...local];
  }, [q, remote]);

  useEffect(() => setIdx(0), [q, remote]);

  if (!open) return null;

  const go = (it?: Item) => { if (!it) return; onClose(); router.push(it.href); };
  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/40 px-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recherche et actions"
        className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          if (e.key === "Enter") go(items[idx]);
        }}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-muted" aria-hidden />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chercher ou lancer une action"
            aria-label="Chercher ou lancer une action"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">Aucun résultat pour « {q} »</li>}
          {items.map((it, i) => {
            const header = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <li key={it.id}>
                {header && <p className="px-3 pb-1 pt-2 text-xs text-muted">{header}</p>}
                <button
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => go(it)}
                  className={clsx("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm", i === idx && "bg-brand-soft text-brand")}
                >
                  {it.id === "a-customer" && <Plus className="size-4" aria-hidden />}
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.hint && <span className="truncate text-xs text-muted">{it.hint}</span>}
                  {i === idx && <CornerDownLeft className="size-3.5" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
