import Link from "next/link";
import clsx from "clsx";

export function Pagination({ page, total, pageSize, basePath, q }: { page: number; total: number; pageSize: number; basePath: string; q?: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => `${basePath}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const link = "inline-flex h-8 items-center rounded-lg border border-line bg-surface px-3 text-sm hover:bg-sunken";
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-muted">
      <span>{from}–{to} sur {total}</span>
      <div className="flex gap-2">
        {page > 1 ? <Link href={href(page - 1)} className={link}>Précédent</Link> : <span className={clsx(link, "pointer-events-none opacity-40")}>Précédent</span>}
        {page < pages ? <Link href={href(page + 1)} className={link}>Suivant</Link> : <span className={clsx(link, "pointer-events-none opacity-40")}>Suivant</span>}
      </div>
    </div>
  );
}
