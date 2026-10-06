export function Sparkline({ values, className = "h-8 w-24" }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pts = values
    .map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 28 - 1}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
