import clsx from "clsx";
import type { ReactNode } from "react";

export function TableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl border border-line bg-surface">{children}</div>;
}

export function Th({ children, right }: { children?: ReactNode; right?: boolean }) {
  return (
    <th scope="col" className={clsx("whitespace-nowrap border-b border-line bg-sunken px-4 py-2.5 text-xs font-medium text-muted", right ? "text-right" : "text-left")}>
      {children}
    </th>
  );
}

export function Td({ children, right, muted, className }: { children?: ReactNode; right?: boolean; muted?: boolean; className?: string }) {
  return (
    <td className={clsx("whitespace-nowrap border-b border-line px-4 py-3 group-last:border-b-0", right && "text-right tabular-nums", muted && "text-muted", className)}>
      {children}
    </td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="group transition-colors hover:bg-sunken">{children}</tr>;
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}
