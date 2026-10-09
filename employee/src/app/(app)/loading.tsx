import { Bone, LoadingRegion, TableSkeleton } from "@/components/ui";

export default function Loading() {
  return (
    <LoadingRegion className="space-y-6">
      <div className="space-y-2.5">
        <Bone className="h-8 w-56" />
        <Bone className="h-4 w-80 max-w-full" />
      </div>
      <TableSkeleton />
    </LoadingRegion>
  );
}
