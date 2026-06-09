import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Structural skeleton shown while the gallery's server component fetches media.
export default function GalleryLoading() {
  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-9 w-full sm:max-w-xs" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
