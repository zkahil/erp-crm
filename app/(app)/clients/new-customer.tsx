"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { createCustomerSchema, type CreateCustomerInput } from "@/lib/validation/customer";
import { createCustomerAction } from "./actions";

const input = "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm";

export function NewCustomer({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
  });

  const close = () => { setOpen(false); if (defaultOpen) router.replace("/clients"); };

  const onSubmit = handleSubmit(async (values) => {
    const res = await createCustomerAction(values);
    if (!res.ok) { setError("root", { message: res.error }); return; }
    toast("Client créé");
    close();
    router.refresh();
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="size-4" aria-hidden />Nouveau client</Button>
      <Dialog open={open} onClose={close} title="Nouveau client">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nom ou raison sociale</span>
            <input {...register("name")} className={input} autoFocus />
            {errors.name && <span className="mt-1 block text-xs text-bad">{errors.name.message}</span>}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Adresse e-mail</span>
            <input {...register("email")} type="email" className={input} />
            {errors.email && <span className="mt-1 block text-xs text-bad">{errors.email.message}</span>}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm"><span className="mb-1 block font-medium">Téléphone</span><input {...register("phone")} className={input} /></label>
            <label className="block text-sm"><span className="mb-1 block font-medium">Ville</span><input {...register("city")} className={input} /></label>
          </div>
          {errors.root && <p role="alert" className="text-sm text-bad">{errors.root.message}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={close}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>Créer le client</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
