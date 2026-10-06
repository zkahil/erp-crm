"use client";
import { useTransition } from "react";
import { OPPORTUNITY_STATUS } from "@/lib/status";
import { toast } from "@/lib/toast";
import { moveOpportunity } from "./actions";

export function MoveSelect({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Changer l’étape"
      value={status}
      disabled={pending}
      onChange={(e) => start(async () => { await moveOpportunity({ id, status: e.target.value }); toast("Étape mise à jour"); })}
      className="h-7 w-full rounded-md border border-line bg-surface px-1.5 text-xs text-muted"
    >
      {Object.entries(OPPORTUNITY_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
    </select>
  );
}
