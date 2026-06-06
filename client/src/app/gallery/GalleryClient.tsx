"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DevicePickerDialog } from "@/components/DevicePickerDialog";
import { useToast } from "@/components/ui/toast";
import { getFileType, getMediaFileUrl, mediaApi, ApiError, MediaFile } from "@/lib/api";
import {
  Search,
  Grid3x3,
  List,
  Play,
  Square,
  Trash2,
  Eye,
  X,
  FileVideo,
  File as FileIcon,
  ExternalLink,
  Pencil,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface GalleryClientProps {
  mediaFiles: MediaFile[];
}

type PickerAction = "play" | "stop";

export function GalleryClient({ mediaFiles: initialMediaFiles }: GalleryClientProps) {
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(initialMediaFiles);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

  // Device picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAction, setPickerAction] = useState<PickerAction>("play");
  const [pendingMediaId, setPendingMediaId] = useState<number | null>(null);

  // Delete / rename dialogs
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
  const [renameTarget, setRenameTarget] = useState<MediaFile | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await mediaApi.getMediaFiles();
      setMediaFiles(data);
    } catch {
      setFetchError("Couldn't load your media. The server may be unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedFile) setSelectedFile(null);
    },
    [selectedFile],
  );
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const filteredMedia = mediaFiles.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const fileType = getFileType(item.file);
    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "videos" && fileType === "video") ||
      (selectedTab === "images" && fileType === "image");
    return matchesSearch && matchesTab;
  });

  // ---- device play/stop ----
  const openPicker = (action: PickerAction, id: number) => {
    setPickerAction(action);
    setPendingMediaId(id);
    setPickerOpen(true);
  };

  const onDeviceSelected = async (deviceId: string) => {
    if (pendingMediaId == null) return;
    const id = pendingMediaId;
    try {
      if (pickerAction === "play") {
        await mediaApi.playMediaOnDevice(id, deviceId);
        toast({ title: "Play command sent", description: `Now playing on ${deviceId}.`, variant: "success" });
      } else {
        await mediaApi.stopMediaOnDevice(id, deviceId);
        toast({ title: "Stop command sent", description: `Stopped on ${deviceId}.`, variant: "success" });
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Request failed.";
      toast({ title: `Could not ${pickerAction}`, description: message, variant: "error" });
    }
  };

  // ---- delete ----
  const doDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await mediaApi.deleteMediaFile(deleteTarget.id);
      if (selectedFile?.id === deleteTarget.id) setSelectedFile(null);
      setMediaFiles((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      toast({ title: "File deleted", variant: "success" });
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Delete failed.";
      toast({ title: "Could not delete", description: message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  // ---- rename ----
  const openRename = (file: MediaFile) => {
    setRenameTarget(file);
    setRenameValue(file.title);
  };
  const doRename = async () => {
    if (!renameTarget) return;
    const title = renameValue.trim();
    if (!title) return;
    setBusy(true);
    try {
      const updated = await mediaApi.updateMediaFile(renameTarget.id, { title });
      setMediaFiles((prev) => prev.map((m) => (m.id === updated.id ? { ...m, title } : m)));
      setSelectedFile((prev) => (prev && prev.id === updated.id ? { ...prev, title } : prev));
      toast({ title: "Renamed", variant: "success" });
      setRenameTarget(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Rename failed.";
      toast({ title: "Could not rename", description: message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const renderThumb = (item: MediaFile, fileUrl: string, fileType: string) => {
    if (fileType === "image") {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fileUrl}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      );
    }
    const Icon = fileType === "video" ? FileVideo : FileIcon;
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Gallery</h1>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-input bg-secondary pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="h-8 bg-secondary">
              <TabsTrigger value="all" className="h-6 px-3 text-xs">
                All ({mediaFiles.length})
              </TabsTrigger>
              <TabsTrigger value="videos" className="h-6 px-3 text-xs">
                Videos ({mediaFiles.filter((m) => getFileType(m.file) === "video").length})
              </TabsTrigger>
              <TabsTrigger value="images" className="h-6 px-3 text-xs">
                Images ({mediaFiles.filter((m) => getFileType(m.file) === "image").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-1">
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")}>
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-border bg-card">
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="space-y-2 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : fetchError ? (
            <Card className="border-destructive/40 bg-card">
              <CardContent className="py-16 text-center">
                <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
                <p className="text-foreground">{fetchError}</p>
                <Button variant="outline" className="mt-4" onClick={fetchMedia}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : filteredMedia.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">No media files found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload your first media file to get started
                </p>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div
              className={`grid gap-4 ${
                selectedFile
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {filteredMedia.map((item) => {
                const fileType = getFileType(item.file);
                const fileUrl = getMediaFileUrl(item.file);
                const uploadDate = new Date(item.uploaded_at).toLocaleDateString();
                const isSelected = selectedFile?.id === item.id;
                return (
                  <Card
                    key={item.id}
                    className={`group cursor-pointer overflow-hidden border-border bg-card transition-colors ${
                      isSelected ? "border-primary ring-2 ring-primary" : "hover:border-primary/40"
                    }`}
                    onClick={() => setSelectedFile((prev) => (prev?.id === item.id ? null : item))}
                  >
                    <div className="relative aspect-video overflow-hidden bg-secondary">
                      {renderThumb(item, fileUrl, fileType)}
                      {fileType === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                            <Play className="ml-0.5 h-5 w-5 text-black" />
                          </div>
                        </div>
                      )}
                      <div className="absolute right-2 top-2">
                        <Badge variant="secondary" className="bg-background/80 text-xs text-foreground backdrop-blur-sm">
                          {fileType}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{uploadDate}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {filteredMedia.map((item) => {
                    const fileType = getFileType(item.file);
                    const fileUrl = getMediaFileUrl(item.file);
                    const uploadDate = new Date(item.uploaded_at).toLocaleDateString();
                    const isSelected = selectedFile?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex cursor-pointer items-center gap-4 p-3 transition-colors ${
                          isSelected ? "bg-primary/5" : "hover:bg-secondary/50"
                        }`}
                        onClick={() => setSelectedFile((prev) => (prev?.id === item.id ? null : item))}
                      >
                        <div className="h-12 w-20 shrink-0 overflow-hidden rounded bg-secondary">
                          {renderThumb(item, fileUrl, fileType)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                            <Badge variant="outline" className="text-xs">{fileType}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{uploadDate}</p>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => window.open(fileUrl, "_blank")}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:text-green-300" onClick={() => openPicker("play", item.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(item)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        {selectedFile && (
          <div className="flex w-[400px] shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-200">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="truncate pr-2 text-sm font-medium text-foreground">{selectedFile.title}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => setSelectedFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-4 p-4">
                <div className="overflow-hidden rounded-md bg-secondary">
                  {getFileType(selectedFile.file) === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getMediaFileUrl(selectedFile.file)} alt={selectedFile.title} className="max-h-64 w-full object-contain" />
                  ) : getFileType(selectedFile.file) === "video" ? (
                    <video src={getMediaFileUrl(selectedFile.file)} controls className="max-h-64 w-full" />
                  ) : (
                    <div className="flex h-40 items-center justify-center">
                      <FileIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Transcode status (videos) */}
                {selectedFile.transcode_status && selectedFile.transcode_status !== "completed" && (
                  <Badge
                    variant="outline"
                    className={
                      selectedFile.transcode_status === "failed"
                        ? "border-destructive/50 text-destructive"
                        : "border-yellow-500/50 text-yellow-500"
                    }
                  >
                    {selectedFile.transcode_status === "failed" ? "Transcode failed" : "Processing…"}
                  </Badge>
                )}

                {/* Playback analytics */}
                <div className="grid grid-cols-2 gap-3 rounded-md bg-secondary/50 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total plays</p>
                    <p className="text-sm font-medium text-foreground">{selectedFile.total_play_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total play time</p>
                    <p className="text-sm font-medium text-foreground">{selectedFile.total_play_duration_display ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedFile.is_currently_playing ? "▶ Playing" : "Idle"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                    <p className="text-sm font-medium text-foreground">{new Date(selectedFile.uploaded_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button className="w-full justify-start" variant="outline" onClick={() => openPicker("play", selectedFile.id)}>
                    <Play className="mr-2 h-4 w-4" /> Play on Device
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => openPicker("stop", selectedFile.id)}>
                    <Square className="mr-2 h-4 w-4" /> Stop Playback
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => openRename(selectedFile)}>
                    <Pencil className="mr-2 h-4 w-4" /> Rename
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => window.open(getMediaFileUrl(selectedFile.file), "_blank")}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Open Original
                  </Button>
                  <Button className="w-full justify-start text-destructive hover:text-destructive" variant="outline" onClick={() => setDeleteTarget(selectedFile)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Device picker */}
      <DevicePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={onDeviceSelected}
        title={pickerAction === "play" ? "Play on device" : "Stop on device"}
        onlineOnly={pickerAction === "play"}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete file?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be permanently removed, including its stored file. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={busy}>Cancel</Button>
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={doDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename file</DialogTitle>
            <DialogDescription>Give this media a clearer title.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-input">Title</Label>
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)} disabled={busy}>Cancel</Button>
            <Button onClick={doRename} disabled={busy || !renameValue.trim()}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
