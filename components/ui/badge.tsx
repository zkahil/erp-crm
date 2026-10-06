import clsx from "clsx";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/status";

const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-muted border border-line",
  brand: "bg-brand-soft text-brand",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
