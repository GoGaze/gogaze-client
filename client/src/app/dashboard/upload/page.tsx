"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileVideo, FileImage, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadFile[] = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: "pending",
    }));
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    // Simulate upload progress
    for (const file of files) {
      if (file.status === "completed") continue;

      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "uploading" as const } : f))
      );

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
        );
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "completed" as const } : f))
      );
    }

    setUploading(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const isVideo = (file: File) => file.type.startsWith("video/");
  const isImage = (file: File) => file.type.startsWith("image/");

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload Media</h1>
          <p className="text-slate-400">Upload videos and photos to your gallery</p>
        </div>

        {/* Upload Area */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white">Select Files</CardTitle>
            <CardDescription className="text-slate-400">
              Choose videos or images to upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* File Input */}
              <div>
                <Label htmlFor="file-upload" className="text-slate-200 mb-2 block">
                  Choose Files
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="bg-slate-700/50 border-slate-600 text-white cursor-pointer"
                  disabled={uploading}
                />
                <p className="text-xs text-slate-400 mt-2">
                  Supported formats: Images (JPG, PNG, GIF) and Videos (MP4, MOV, AVI)
                </p>
              </div>

              {/* Drag & Drop Zone */}
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center hover:border-purple-500 transition-colors">
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 font-medium mb-2">
                  Drag and drop files here
                </p>
                <p className="text-sm text-slate-400">or use the file browser above</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Files */}
        {files.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Selected Files ({files.length})</CardTitle>
                  <CardDescription className="text-slate-400">
                    Review your files before uploading
                  </CardDescription>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || files.every((f) => f.status === "completed")}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {files.map((uploadFile) => (
                  <div
                    key={uploadFile.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-slate-700/30 border border-slate-600"
                  >
                    {/* Preview/Icon */}
                    <div className="flex-shrink-0">
                      {uploadFile.preview ? (
                        <img
                          src={uploadFile.preview}
                          alt={uploadFile.file.name}
                          className="h-16 w-16 rounded object-cover"
                        />
                      ) : isVideo(uploadFile.file) ? (
                        <div className="h-16 w-16 rounded bg-purple-600/20 flex items-center justify-center">
                          <FileVideo className="h-8 w-8 text-purple-400" />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded bg-blue-600/20 flex items-center justify-center">
                          <FileImage className="h-8 w-8 text-blue-400" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium truncate">
                          {uploadFile.file.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            uploadFile.status === "completed"
                              ? "bg-green-500/20 text-green-300 border-green-500"
                              : uploadFile.status === "uploading"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500"
                              : uploadFile.status === "error"
                              ? "bg-red-500/20 text-red-300 border-red-500"
                              : "bg-slate-500/20 text-slate-300 border-slate-500"
                          }
                        >
                          {uploadFile.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">
                        {formatFileSize(uploadFile.file.size)} •{" "}
                        {isVideo(uploadFile.file) ? "Video" : "Image"}
                      </p>

                      {/* Progress Bar */}
                      {uploadFile.status === "uploading" && (
                        <div className="mt-2">
                          <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 transition-all duration-300"
                              style={{ width: `${uploadFile.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {uploadFile.progress}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(uploadFile.id)}
                      disabled={uploading}
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Tips */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Upload Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Maximum file size: 100MB per file</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Supported video formats: MP4, MOV, AVI, MKV, WebM</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Supported image formats: JPG, PNG, GIF, WebP, SVG</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>You can upload multiple files at once</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
