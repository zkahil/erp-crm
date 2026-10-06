"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

export function ConfirmAction({
  label, title, description, confirmLabel, success, action, redirectTo,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  success: string;
  action: () => Promise<{ ok: true } | { ok: false; error: string }>;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const close = () => { setOpen(false); setError(null); };

  return (
    <>
      <Button variant="outline" className="h-8 px-2.5" onClick={() => setOpen(true)}>{label}</Button>
      <Dialog open={open} onClose={close} title={title}>
        <p className="text-sm text-muted">{description}</p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={close}>Annuler</Button>
          <Button
            disabled={pending}
            onClick={() => start(async () => {
              const r = await action();
              if (!r.ok) { setError(r.error); return; }
              toast(success);
              close();
              if (redirectTo) router.push(redirectTo); else router.refresh();
            })}
          >
            {confirmLabel}
          </Button>
        </div>
      </Dialog>
    </>
  );
}