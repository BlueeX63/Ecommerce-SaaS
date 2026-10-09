import type { ReactNode } from "react";

/** Shimmering placeholder block. */
export function Bone({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-lg bg-black/[0.06] ${className}`} aria-hidden />;
}

export function LoadingRegion({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="font-heading text-3xl text-primary mb-1">{title}</h1>
        {subtitle && <p className="text-secondary text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <LoadingRegion className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
      <div className="p-4 border-b border-black/[0.04]">
        <Bone className="h-10 w-full max-w-md" />
      </div>
      <table className="w-full">
        <tbody className="divide-y divide-black/[0.04]">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((__, c) => (
                <td key={c} className="px-6 py-4">
                  {c === 0 ? (
                    <div className="flex items-center gap-3">
                      <Bone className="h-10 w-10 shrink-0" />
                      <Bone className="h-4 w-32" />
                    </div>
                  ) : (
                    <Bone className="h-4 w-20" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </LoadingRegion>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const palette: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    DELIVERED: "bg-green-100 text-green-700",
    SHIPPED: "bg-blue-100 text-blue-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    PARTIALLY_PAID: "bg-amber-100 text-amber-700",
    UNPAID: "bg-amber-100 text-amber-700",
    PENDING: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
  };
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${palette[value] ?? "bg-gray-100 text-gray-700"}`}>{value.replace(/_/g, " ")}</span>;
}

export const inputClass = "w-full px-4 py-2.5 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm";
