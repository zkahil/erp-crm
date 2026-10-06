"use client";
import { Menu, Search } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur sm:px-8">
      <button onClick={onMenu} aria-label="Ouvrir le menu" className="grid size-9 place-items-center rounded-lg border border-line bg-surface lg:hidden">
        <Menu className="size-4" />
      </button>
      <button
        onClick={onSearch}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-muted hover:bg-sunken"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left">Rechercher un client, un produit, une facture</span>
        <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-xs sm:inline">Ctrl K</kbd>
      </button>
      <div className="ml-auto"><ThemeToggle /></div>
    </header>
  );
}
