"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";

export function Toaster() {
  const [t, setT] = useState<{ message: string; tone: string } | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const h = (e: Event) => {
      setT((e as CustomEvent).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setT(null), 3200);
    };
    window.addEventListener("toast", h);
    return () => { window.removeEventListener("toast", h); clearTimeout(timer); };
  }, []);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-5 right-5 z-[60]">
      {t && (
        <div className={clsx("rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg", t.tone === "bad" ? "bg-bad text-canvas" : "bg-ink text-canvas")}>
          {t.message}
        </div>
      )}
    </div>
  );
}
