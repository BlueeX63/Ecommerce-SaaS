import type { ReactNode } from "react";

/** Shimmering placeholder block. Respects reduced-motion (the animation is plain CSS in globals.css). */
export function Bone({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-lg bg-black/[0.06] ${className}`} aria-hidden />;
}

/** Wrapper that announces "loading" to assistive tech once, instead of every placeholder block. */
export function LoadingRegion({ label = "Loading", children, className = "" }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-2.5">
        <Bone className="h-8 w-56" />
        <Bone className="h-4 w-80 max-w-full" />
      </div>
      {withAction && <Bone className="h-10 w-36 rounded-xl" />}
    </div>
  );
}

export function TableSkeletonRows({ rows = 6, cols = 5, first = "avatar" }: { rows?: number; cols?: number; first?: "avatar" | "text" }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} aria-hidden>
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-6 py-4">
              {c === 0 && first === "avatar" ? (
                <div className="flex items-center gap-3">
                  <Bone className="h-10 w-10 shrink-0 rounded-lg" />
                  <Bone className="h-4 w-32" />
                </div>
              ) : (
                <Bone className={`h-4 ${c === cols - 1 ? "ml-auto w-14" : c % 2 ? "w-24" : "w-16"}`} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** A full table card (toolbar + header + rows) for list pages. */
export function TableCardSkeleton({ rows = 7, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden" aria-hidden>
      <div className="p-4 border-b border-black/[0.04] flex gap-4">
        <Bone className="h-10 w-full max-w-md" />
        <Bone className="h-10 w-24" />
      </div>
      <div className="px-6 py-4 border-b border-black/[0.04] flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-3.5 w-20" />
        ))}
      </div>
      <table className="w-full">
        <tbody className="divide-y divide-black/[0.04]">
          <TableSkeletonRows rows={rows} cols={cols} />
        </tbody>
      </table>
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl border border-black/[0.04] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <Bone className="h-3.5 w-24" />
            <Bone className="h-9 w-9 rounded-xl" />
          </div>
          <Bone className="h-8 w-32" />
          <Bone className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className = "h-80" }: { className?: string }) {
  return (
    <div className={`bg-surface rounded-2xl border border-black/[0.04] p-6 shadow-sm ${className}`} aria-hidden>
      <Bone className="mb-6 h-5 w-40" />
      <div className="flex h-[calc(100%-3rem)] items-end gap-3">
        {[45, 70, 55, 85, 60, 95, 75, 50, 80, 65].map((h, i) => (
          <Bone key={i} className="flex-1 rounded-t-md" />
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl border border-black/[0.04] p-6 shadow-sm space-y-4">
          <Bone className="h-5 w-40" />
          <Bone className="h-3.5 w-full" />
          <Bone className="h-3.5 w-2/3" />
          <Bone className="mt-2 h-9 w-28 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6" aria-hidden>
      <div className="flex items-center gap-4">
        <Bone className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Bone className="h-7 w-52" />
          <Bone className="h-3.5 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl border border-black/[0.04] p-6 space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Bone className="h-4 w-48" />
                  <Bone className="h-3 w-32" />
                </div>
                <Bone className="h-4 w-16" />
              </div>
            ))}
          </div>
          <CardGridSkeleton count={1} />
        </div>
        <div className="space-y-6">
          <CardGridSkeleton count={2} />
        </div>
      </div>
    </div>
  );
}

/** Generic list-page loading state: header, toolbar and a table. */
export function ListPageSkeleton({ cols = 5, rows = 7 }: { cols?: number; rows?: number }) {
  return (
    <LoadingRegion label="Loading" className="max-w-7xl mx-auto space-y-6">
      <PageHeaderSkeleton />
      <TableCardSkeleton cols={cols} rows={rows} />
    </LoadingRegion>
  );
}

export function DashboardPageSkeleton() {
  return (
    <LoadingRegion label="Loading dashboard" className="max-w-7xl mx-auto space-y-6">
      <PageHeaderSkeleton withAction={false} />
      <StatCardsSkeleton />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartSkeleton className="xl:col-span-2 h-80" />
        <ChartSkeleton className="h-80" />
      </div>
    </LoadingRegion>
  );
}

/** Branded full-screen loader, used where there is no page chrome to keep on screen yet. */
export function BrandLoader({ label = "Loading your workspace" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background">
      <div className="relative h-16 w-16">
        <span className="absolute inset-0 rounded-2xl border border-black/10" />
        <span className="absolute inset-0 animate-spin rounded-2xl border-2 border-transparent border-t-accent [animation-duration:1.1s]" />
        <span className="absolute inset-3 rounded-lg bg-primary" />
        <span className="absolute inset-3 animate-pulse rounded-lg bg-accent/70 mix-blend-multiply" />
      </div>
      <div className="text-center">
        <p className="font-heading text-lg tracking-tight text-primary">Monolith</p>
        <p className="mt-1 text-sm text-secondary">{label}…</p>
      </div>
    </div>
  );
}
