"use client";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { mad } from "@/lib/format";

export function RevenueChart({ data }: { data: { label: string; total: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "var(--sunken)" }}
            formatter={(v) => [mad(Number(v)), "Facturé"]}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)", fontSize: 13 }}
          />
          <Bar dataKey="total" radius={[6, 6, 2, 2]} maxBarSize={56}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === data.length - 1 ? "var(--brand)" : "var(--brand-soft)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
