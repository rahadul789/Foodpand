export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card skeleton-card">
      <div className="skeleton-line skeleton-line-title" />
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="skeleton-line" />
      ))}
    </div>
  );
}

export function StatSkeletons() {
  return (
    <div className="stats-grid">
      <CardSkeleton lines={1} />
      <CardSkeleton lines={1} />
      <CardSkeleton lines={1} />
      <CardSkeleton lines={1} />
    </div>
  );
}
