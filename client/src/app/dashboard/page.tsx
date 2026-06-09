import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMediaFiles } from "@/lib/server-api";
import { getFileType, MediaFile } from "@/lib/api";
import { DashboardMediaGrid } from "@/components/DashboardMediaGrid";
import Link from "next/link";
import { Upload, Image as ImageIcon } from "lucide-react";

export default async function DashboardPage() {
  const mediaFiles: MediaFile[] = await getMediaFiles();

  const videoCount = mediaFiles.filter(
    (m) => getFileType(m.file) === "video"
  ).length;
  const imageCount = mediaFiles.filter(
    (m) => getFileType(m.file) === "image"
  ).length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header with inline stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">
                {mediaFiles.length}
              </span>{" "}
              uploads
            </span>
            <span className="text-border">|</span>
            <span>
              <span className="font-medium text-foreground">{videoCount}</span>{" "}
              videos
            </span>
            <span className="text-border">|</span>
            <span>
              <span className="font-medium text-foreground">{imageCount}</span>{" "}
              images
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload New
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/gallery">
              <ImageIcon className="mr-2 h-4 w-4" />
              Browse Gallery
            </Link>
          </Button>
        </div>

        {/* Recent uploads grid */}
        {mediaFiles.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-20 text-center">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-medium text-foreground mb-1">
                No media yet
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first file to get started
              </p>
              <Button asChild>
                <Link href="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DashboardMediaGrid mediaFiles={mediaFiles} />
        )}
      </div>
    </DashboardLayout>
  );
}
