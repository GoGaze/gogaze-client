"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Grid3x3,
  List,
  Play,
  Download,
  Trash2,
  Eye,
  MoreVertical,
} from "lucide-react";

// Mock data for demonstration
const mockMedia = [
  {
    id: "1",
    name: "Summer_Vacation.mp4",
    type: "video",
    size: "45.2 MB",
    uploadDate: "2025-10-20",
    thumbnail: "https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Video+1",
  },
  {
    id: "2",
    name: "Product_Photo.jpg",
    type: "image",
    size: "2.1 MB",
    uploadDate: "2025-10-22",
    thumbnail: "https://via.placeholder.com/400x300/EC4899/FFFFFF?text=Image+1",
  },
  {
    id: "3",
    name: "Tutorial_Video.mp4",
    type: "video",
    size: "78.5 MB",
    uploadDate: "2025-10-23",
    thumbnail: "https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Video+2",
  },
  {
    id: "4",
    name: "Landscape_Shot.png",
    type: "image",
    size: "5.8 MB",
    uploadDate: "2025-10-24",
    thumbnail: "https://via.placeholder.com/400x300/EC4899/FFFFFF?text=Image+2",
  },
];

export default function GalleryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  const filteredMedia = mockMedia.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "videos" && item.type === "video") ||
      (selectedTab === "images" && item.type === "image");
    return matchesSearch && matchesTab;
  });

  return (
    <DashboardLayout>
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
              All ({mockMedia.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-purple-600">
              Videos ({mockMedia.filter((m) => m.type === "video").length})
            </TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-purple-600">
              Images ({mockMedia.filter((m) => m.type === "image").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Media Grid/List */}
        {filteredMedia.length === 0 ? (
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
            {filteredMedia.map((item) => (
              <Card
                key={item.id}
                className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-purple-500 transition-all group overflow-hidden"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {item.type === "video" && (
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
                        item.type === "video"
                          ? "bg-purple-600/90 text-white"
                          : "bg-pink-600/90 text-white"
                      }
                    >
                      {item.type}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-white font-medium truncate mb-1">{item.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {item.size} • {item.uploadDate}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-700">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-700/30 transition-colors"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="h-16 w-24 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">{item.name}</h3>
                        <Badge
                          variant="outline"
                          className={
                            item.type === "video"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500"
                              : "bg-pink-500/20 text-pink-300 border-pink-500"
                          }
                        >
                          {item.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">
                        {item.size} • Uploaded {item.uploadDate}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
