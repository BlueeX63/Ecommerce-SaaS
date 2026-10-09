import { DetailSkeleton, LoadingRegion } from "@/components/dashboard/Skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading">
      <DetailSkeleton />
    </LoadingRegion>
  );
}
