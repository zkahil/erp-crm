// Étoile à huit branches : deux carrés superposés, clin d'œil au zellige.
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="6" y="6" width="20" height="20" rx="2" fill="currentColor" />
      <rect x="6" y="6" width="20" height="20" rx="2" fill="currentColor" transform="rotate(45 16 16)" />
      <circle cx="16" cy="16" r="4" fill="var(--surface)" />
    </svg>
  );
}
