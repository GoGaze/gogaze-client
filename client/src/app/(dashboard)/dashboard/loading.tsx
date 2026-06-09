import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Shown (inside the persistent sidebar layout) while the server component
// fetches media, so navigation paints a structural skeleton immediately
// instead of a blank full-screen spinner.
export default function DashboardLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-4 w-28" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-border bg-card">
            <Skeleton className="aspect-video w-full" />
            <CardContent className="space-y-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
