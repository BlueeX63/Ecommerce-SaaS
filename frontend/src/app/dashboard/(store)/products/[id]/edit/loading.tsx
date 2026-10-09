import { CardGridSkeleton, LoadingRegion, PageHeaderSkeleton } from "@/components/dashboard/Skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading form" className="max-w-5xl mx-auto space-y-6">
      <PageHeaderSkeleton withAction={false} />
      <CardGridSkeleton count={4} />
    </LoadingRegion>
  );
}
