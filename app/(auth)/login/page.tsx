import { login } from "./actions";
import { LogoMark } from "@/components/ui/logo";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="zellige hidden flex-col justify-between p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <LogoMark className="size-8 text-white" />
          <span className="font-display text-xl font-semibold">ERP CRM</span>
        </div>
        <p className="max-w-md font-display text-4xl font-semibold leading-[1.15] tracking-tight">
          Du devis à l’encaissement, au même endroit.
        </p>
      </section>

      <section className="flex items-center justify-center bg-canvas px-6 py-12">
        <form action={login} className="w-full max-w-sm space-y-4">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Connexion</h1>
          {error && (
            <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
              E-mail ou mot de passe incorrect.
            </p>
          )}
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Adresse e-mail</span>
            <input name="email" type="email" required autoComplete="email" defaultValue="admin@example.com" className="h-10 w-full rounded-lg border border-line bg-surface px-3" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Mot de passe</span>
            <input name="password" type="password" required autoComplete="current-password" className="h-10 w-full rounded-lg border border-line bg-surface px-3" />
          </label>
          <button className="h-10 w-full rounded-lg bg-brand text-sm font-medium text-white hover:opacity-90">Se connecter</button>
        </form>
      </section>
    </div>
  );
}
