export function SettingsSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-10 animate-pulse">
      <div>
        <div className="h-7 w-56 bg-black/[0.06] rounded-lg mb-2" />
        <div className="h-4 w-80 bg-black/[0.04] rounded-lg" />
      </div>

      <div className="space-y-6 max-w-2xl">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3.5 w-28 bg-black/[0.05] rounded" />
            <div className="h-10 w-full bg-black/[0.04] rounded-lg" />
          </div>
        ))}
        <div className="h-10 w-36 bg-black/[0.08] rounded-lg" />
      </div>
    </div>
  );
}

export function BillingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-7 w-56 bg-black/[0.06] rounded-lg mb-2" />
        <div className="h-4 w-72 bg-black/[0.04] rounded-lg" />
      </div>

      <div className="h-24 bg-black/[0.03] border border-black/[0.06] rounded-xl" />

      <div className="space-y-3">
        <div className="h-5 w-24 bg-black/[0.06] rounded mb-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-black/[0.03] border border-black/[0.06] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
