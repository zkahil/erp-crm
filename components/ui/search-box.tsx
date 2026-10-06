import { Search } from "lucide-react";

export function SearchBox({ q, placeholder }: { q?: string; placeholder: string }) {
  return (
    <form className="relative w-full max-w-xs" role="search">
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm placeholder:text-muted"
      />
    </form>
  );
}
