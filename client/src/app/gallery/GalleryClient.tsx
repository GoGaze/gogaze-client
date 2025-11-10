"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getFileType, getMediaFileUrl } from "@/lib/api";
import {
  Search,
  Grid3x3,
  List,
  Play,
  Square,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";

interface MediaFile {
  id: number;
  title: string;
  file: string;
  processed_file?: string;
  uploaded_at: string;
}

interface GalleryClientProps {
  mediaFiles: MediaFile[]; // Initial SSR data
}

export function GalleryClient({ mediaFiles: initialMediaFiles }: GalleryClientProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(initialMediaFiles);
  const [loading, setLoading] = useState(false);

  // Fetch media files client-side so it appears in browser network tab
  useEffect(() => {
    const fetchMediaFiles = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/media');
        if (response.ok) {
          const data = await response.json();
          setMediaFiles(data);
        }
      } catch (error) {
        console.error('Error fetching media files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMediaFiles();
  }, []);

  const filteredMedia = mediaFiles.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
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
        const response = await fetch(`/api/media/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Refresh media files list
          const refreshResponse = await fetch('/api/media');
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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Gallery</h1>
        <p className="text-slate-400">Browse and manage your uploaded media files</p>
      </div>

      {/* Filters & Search */}
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={
                  viewMode === "grid"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "border-slate-600 text-slate-300 hover:bg-slate-700"
                }
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className={
                  viewMode === "list"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "border-slate-600 text-slate-300 hover:bg-slate-700"
                }
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
            All ({mediaFiles.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="data-[state=active]:bg-purple-600">
            Videos ({mediaFiles.filter((m) => getFileType(m.file) === "video").length})
          </TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-purple-600">
            Images ({mediaFiles.filter((m) => getFileType(m.file) === "image").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Media Grid/List */}
      {loading ? (
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="py-16">
            <div className="text-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-lg mb-2">Loading media files...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredMedia.length === 0 ? (
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="py-16">
            <div className="text-center text-slate-400">
              <p className="text-lg mb-2">No media files found</p>
              <p className="text-sm">Upload your first media file to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((item) => {
            const fileType = getFileType(item.file);
            const fileUrl = getMediaFileUrl(item.file);
            const uploadDate = new Date(item.uploaded_at).toLocaleDateString();
            
            return (
              <Card
                key={item.id}
                className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-purple-500 transition-all group overflow-hidden"
              >
                <div className="relative aspect-video overflow-hidden">
                  {fileType === "image" ? (
                    <img
                      src={fileUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <Play className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                  {fileType === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-6 w-6 text-slate-900 ml-1" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="secondary"
                      className={
                        fileType === "video"
                          ? "bg-purple-600/90 text-white"
                          : "bg-pink-600/90 text-white"
                      }
                    >
                      {fileType}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-white font-medium truncate mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {uploadDate}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => window.open(fileUrl, '_blank')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-green-400 hover:bg-green-900/20"
                      onClick={() => handlePlay(item.id)}
                      title="Play on device"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-yellow-400 hover:bg-yellow-900/20"
                      onClick={() => handleStop(item.id)}
                      title="Stop on device"
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-red-400 hover:bg-red-900/20"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700">
              {filteredMedia.map((item) => {
                const fileType = getFileType(item.file);
                const fileUrl = getMediaFileUrl(item.file);
                const uploadDate = new Date(item.uploaded_at).toLocaleDateString();
                
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-700/30 transition-colors"
                  >
                    {fileType === "image" ? (
                      <img
                        src={fileUrl}
                        alt={item.title}
                        className="h-16 w-24 object-cover rounded"
                      />
                    ) : (
                      <div className="h-16 w-24 bg-slate-700 rounded flex items-center justify-center">
                        <Play className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">{item.title}</h3>
                        <Badge
                          variant="outline"
                          className={
                            fileType === "video"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500"
                              : "bg-pink-500/20 text-pink-300 border-pink-500"
                          }
                        >
                          {fileType}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">
                        Uploaded {uploadDate}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => window.open(fileUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-green-400 hover:bg-green-900/20"
                        onClick={() => handlePlay(item.id)}
                        title="Play on device"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-yellow-400 hover:bg-yellow-900/20"
                        onClick={() => handleStop(item.id)}
                        title="Stop on device"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-red-400 hover:bg-red-900/20"
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
  );
}
