export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <div className="skeleton mb-2 h-8 w-56" />
      <div className="skeleton mb-8 h-4 w-80" />
      <div className="skeleton h-72 w-full rounded-2xl" />
    </div>
  );
}
