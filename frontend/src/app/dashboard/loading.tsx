import { Loader2 } from "lucide-react";

export default function DashboardRootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
    </div>
  );
}
