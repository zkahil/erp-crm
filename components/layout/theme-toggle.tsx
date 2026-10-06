"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  return (
    <button
      aria-label={dark ? "Passer en thème clair" : "Passer en thème sombre"}
      onClick={() => {
        const next = !dark;
        document.documentElement.classList.toggle("dark", next);
        try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
        setDark(next);
      }}
      className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-muted hover:bg-sunken"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
