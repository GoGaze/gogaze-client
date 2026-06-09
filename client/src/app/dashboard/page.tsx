import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMediaFiles } from "@/lib/server-api";
import { getFileType, getMediaFileUrl, MediaFile } from "@/lib/api";
import Link from "next/link";
import { Upload, Image as ImageIcon, Play, FileVideo } from "lucide-react";

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
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                Recent uploads
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mediaFiles.slice(0, 12).map((item) => {
                const fileType = getFileType(item.file);
                const fileUrl = getMediaFileUrl(item.file);
                const uploadDate = new Date(
                  item.uploaded_at
                ).toLocaleDateString();

                return (
                  <Card
                    key={item.id}
                    className="border-border bg-card overflow-hidden group hover:border-primary/40 transition-colors"
                  >
                    <div className="relative aspect-video overflow-hidden bg-secondary">
                      {fileType === "image" ? (
                        <img
                          src={fileUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileVideo className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      {fileType === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="h-5 w-5 text-background ml-0.5" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-background/80 backdrop-blur-sm text-foreground"
                        >
                          {fileType}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {uploadDate}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {mediaFiles.length > 12 && (
              <div className="text-center">
                <Button variant="outline" asChild>
                  <Link href="/gallery">View all {mediaFiles.length} files</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
