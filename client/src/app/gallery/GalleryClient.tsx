"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getFileType, getMediaFileUrl, MediaFile } from "@/lib/api";
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
  ExternalLink,
} from "lucide-react";

interface GalleryClientProps {
  mediaFiles: MediaFile[];
}

export function GalleryClient({
  mediaFiles: initialMediaFiles,
}: GalleryClientProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(initialMediaFiles);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

  useEffect(() => {
    const fetchMediaFiles = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/media");
        if (response.ok) {
          const data = await response.json();
          setMediaFiles(data);
        }
      } catch (error) {
        console.error("Error fetching media files:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMediaFiles();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedFile) {
        setSelectedFile(null);
      }
    },
    [selectedFile]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const filteredMedia = mediaFiles.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const fileType = getFileType(item.file);
    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "videos" && fileType === "video") ||
      (selectedTab === "images" && fileType === "image");
    return matchesSearch && matchesTab;
  });

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this file?")) {
      try {
        const response = await fetch(`/api/media/${id}`, { method: "DELETE" });
        if (response.ok) {
          if (selectedFile?.id === id) setSelectedFile(null);
          const refreshResponse = await fetch("/api/media");
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setMediaFiles(data);
          }
        } else {
          alert("Failed to delete file");
        }
      } catch (error) {
        console.error("Failed to delete file:", error);
        alert("Failed to delete file");
      }
    }
  };

  const handlePlay = async (id: number) => {
    const deviceId = prompt("Enter device ID:");
    if (deviceId) {
      try {
        const response = await fetch(`/api/media/${id}/play`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: deviceId }),
        });
        if (response.ok) {
          alert("Play command sent to device!");
        } else {
          alert("Failed to send play command to device");
        }
      } catch (error) {
        console.error("Failed to play on device:", error);
        alert("Failed to send play command to device");
      }
    }
  };

  const handleStop = async (id: number) => {
    const deviceId = prompt("Enter device ID:");
    if (deviceId) {
      try {
        const response = await fetch(`/api/media/${id}/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: deviceId }),
        });
        if (response.ok) {
          alert("Stop command sent to device!");
        } else {
          alert("Failed to send stop command to device");
        }
      } catch (error) {
        console.error("Failed to stop on device:", error);
        alert("Failed to send stop command to device");
      }
    }
  };

  const toggleSelect = (item: MediaFile) => {
    setSelectedFile((prev) => (prev?.id === item.id ? null : item));
  };

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-foreground mb-6">Gallery</h1>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-input"
          />
        </div>
        <div className="flex items-center gap-3">
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
          >
            <TabsList className="h-8 bg-secondary">
              <TabsTrigger value="all" className="text-xs px-3 h-6">
                All ({mediaFiles.length})
              </TabsTrigger>
              <TabsTrigger value="videos" className="text-xs px-3 h-6">
                Videos (
                {
                  mediaFiles.filter((m) => getFileType(m.file) === "video")
                    .length
                }
                )
              </TabsTrigger>
              <TabsTrigger value="images" className="text-xs px-3 h-6">
                Images (
                {
                  mediaFiles.filter((m) => getFileType(m.file) === "image")
                    .length
                }
                )
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content area with optional preview panel */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* File grid/list */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-border bg-card overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMedia.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">No media files found</p>
                <p className="text-sm text-muted-foreground mt-1">
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
                const uploadDate = new Date(
                  item.uploaded_at
                ).toLocaleDateString();
                const isSelected = selectedFile?.id === item.id;

                return (
                  <Card
                    key={item.id}
                    className={`border-border bg-card overflow-hidden group cursor-pointer transition-colors ${
                      isSelected
                        ? "ring-2 ring-primary border-primary"
                        : "hover:border-primary/40"
                    }`}
                    onClick={() => toggleSelect(item)}
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
                            <Play className="h-5 w-5 text-black ml-0.5" />
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
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {filteredMedia.map((item) => {
                    const fileType = getFileType(item.file);
                    const fileUrl = getMediaFileUrl(item.file);
                    const uploadDate = new Date(
                      item.uploaded_at
                    ).toLocaleDateString();
                    const isSelected = selectedFile?.id === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/5"
                            : "hover:bg-secondary/50"
                        }`}
                        onClick={() => toggleSelect(item)}
                      >
                        {fileType === "image" ? (
                          <img
                            src={fileUrl}
                            alt={item.title}
                            className="h-12 w-18 object-cover rounded"
                          />
                        ) : (
                          <div className="h-12 w-18 bg-secondary rounded flex items-center justify-center">
                            <FileVideo className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {fileType}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {uploadDate}
                          </p>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => window.open(fileUrl, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-400 hover:text-green-300"
                            onClick={() => handlePlay(item.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
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
          <div className="w-[400px] shrink-0 border border-border bg-card rounded-lg overflow-hidden flex flex-col transition-all duration-200">
            {/* Panel header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-medium text-foreground truncate pr-2">
                {selectedFile.title}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Preview */}
                <div className="rounded-md overflow-hidden bg-secondary">
                  {getFileType(selectedFile.file) === "image" ? (
                    <img
                      src={getMediaFileUrl(selectedFile.file)}
                      alt={selectedFile.title}
                      className="w-full object-contain max-h-64"
                    />
                  ) : (
                    <video
                      src={getMediaFileUrl(selectedFile.file)}
                      controls
                      className="w-full max-h-64"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      File name
                    </p>
                    <p className="text-sm text-foreground">
                      {selectedFile.title}
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <Badge variant="outline" className="text-xs">
                        {getFileType(selectedFile.file)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Uploaded
                      </p>
                      <p className="text-sm text-foreground">
                        {new Date(
                          selectedFile.uploaded_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handlePlay(selectedFile.id)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Play on Device
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleStop(selectedFile.id)}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop Playback
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        getMediaFileUrl(selectedFile.file),
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Original
                  </Button>
                  <Button
                    className="w-full justify-start text-destructive hover:text-destructive"
                    variant="outline"
                    onClick={() => handleDelete(selectedFile.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
