"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFileType, getMediaFileUrl, MediaFile } from "@/lib/api";

/**
 * Client-side recent-uploads grid for the dashboard. Clicking a card opens a
 * modal preview (video player / image), mirroring the gallery's behaviour —
 * the dashboard page is a Server Component and can't handle the click itself.
 */
export function DashboardMediaGrid({ mediaFiles }: { mediaFiles: MediaFile[] }) {
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const selectedType = selected ? getFileType(selected.file) : null;

  return (
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
          const uploadDate = new Date(item.uploaded_at).toLocaleDateString();

          return (
            <Card
              key={item.id}
              onClick={() => setSelected(item)}
              className="border-border bg-card overflow-hidden group hover:border-primary/40 transition-colors cursor-pointer"
            >
              <div className="relative aspect-video overflow-hidden bg-secondary">
                {fileType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
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

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">
              {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="overflow-hidden rounded-md bg-secondary">
              {selectedType === "video" ? (
                <video
                  src={getMediaFileUrl(selected.file)}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh]"
                />
              ) : selectedType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getMediaFileUrl(selected.file)}
                  alt={selected.title}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="flex h-40 items-center justify-center">
                  <FileVideo className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
