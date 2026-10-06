const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD", maximumFractionDigits: 0 });
const moneyCents = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD", minimumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const mad = (n: number | { toString(): string }) => money.format(Number(n));
export const madCents = (n: number | { toString(): string }) => moneyCents.format(Number(n));
export const fmtDate = (d: Date | null | undefined) => (d ? date.format(d) : "–");
export const fmtDateTime = (d: Date) => dateTime.format(d);
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
export const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / 86_400_000);
