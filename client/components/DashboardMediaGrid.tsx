"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, FileVideo, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DevicePickerDialog } from "@/components/DevicePickerDialog";
import { useToast } from "@/components/ui/toast";
import {
  getFileType,
  getMediaFileUrl,
  mediaApi,
  ApiError,
  MediaFile,
} from "@/lib/api";

type PickerAction = "play" | "stop";

/**
 * Client-side recent-uploads grid for the dashboard. Clicking a card opens a
 * modal preview (video player / image) with "Play on Device" / "Stop" actions
 * that reuse the gallery's device picker — the dashboard page is a Server
 * Component and can't handle the interactivity itself.
 */
export function DashboardMediaGrid({ mediaFiles }: { mediaFiles: MediaFile[] }) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAction, setPickerAction] = useState<PickerAction>("play");
  const [pendingMediaId, setPendingMediaId] = useState<number | null>(null);
  const selectedType = selected ? getFileType(selected.file) : null;

  const openPicker = (action: PickerAction, id: number) => {
    setPickerAction(action);
    setPendingMediaId(id);
    setSelected(null); // close the preview modal so the picker isn't nested
    setPickerOpen(true);
  };

  const onDeviceSelected = async (deviceId: string) => {
    if (pendingMediaId == null) return;
    const id = pendingMediaId;
    try {
      if (pickerAction === "play") {
        await mediaApi.playMediaOnDevice(id, deviceId);
        toast({
          title: "Play command sent",
          description: `Now playing on ${deviceId}.`,
          variant: "success",
        });
      } else {
        await mediaApi.stopMediaOnDevice(id, deviceId);
        toast({
          title: "Stop command sent",
          description: `Stopped on ${deviceId}.`,
          variant: "success",
        });
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Request failed.";
      toast({
        title: `Could not ${pickerAction}`,
        description: message,
        variant: "error",
      });
    }
  };

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
                  <Image
                    src={fileUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
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
            <div className="space-y-3">
              <div className="overflow-hidden rounded-md bg-secondary">
                {selectedType === "video" ? (
                  <video
                    src={getMediaFileUrl(selected.file)}
                    controls
                    autoPlay
                    className="w-full max-h-[60vh]"
                  />
                ) : selectedType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getMediaFileUrl(selected.file)}
                    alt={selected.title}
                    className="w-full max-h-[60vh] object-contain"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <FileVideo className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => openPicker("play", selected.id)}
                >
                  <Play className="mr-2 h-4 w-4" /> Play on Device
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => openPicker("stop", selected.id)}
                >
                  <Square className="mr-2 h-4 w-4" /> Stop
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DevicePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={onDeviceSelected}
        title={pickerAction === "play" ? "Play on device" : "Stop on device"}
        onlineOnly={pickerAction === "play"}
      />
    </>
  );
}
