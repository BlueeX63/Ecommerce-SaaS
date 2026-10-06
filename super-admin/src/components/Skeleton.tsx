/** Base shimmer primitive - a plain pulsing bar, no gradient sweep. Keeps with the panel's classic, flat look. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-black/[0.06] rounded ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-black/10 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-4 h-4 rounded-sm" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-7 w-16" />
    </div>
  );
}

export function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-black/[0.02] border-b border-black/10">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-5 py-3">
              <Skeleton className="h-3 w-16" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-black/5">
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: columns }).map((_, c) => (
              <td key={c} className="px-5 py-3.5">
                <Skeleton className={`h-3.5 ${c === 0 ? "w-32" : "w-20"}`} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PanelSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="bg-surface border border-black/10 rounded-lg p-5">
      <Skeleton className="h-4 w-28 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}
