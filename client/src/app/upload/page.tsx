"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileVideo, FileImage, Loader2, CloudUpload } from "lucide-react";
import { formatFileSize } from "@/lib/api";

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  errorMessage?: string;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024;

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const processFiles = (fileList: File[]) => {
    const newFiles: UploadFile[] = fileList.map((file) => {
      const isTooLarge = file.size > MAX_FILE_SIZE;
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        progress: 0,
        status: isTooLarge ? ("error" as const) : ("pending" as const),
        errorMessage: isTooLarge
          ? `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`
          : undefined,
      };
    });
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    for (const file of files) {
      if (file.status === "completed" || file.status === "error") continue;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, status: "uploading" as const, progress: 0 }
            : f
        )
      );

      try {
        const result = await new Promise<{
          ok: boolean;
          status: number;
          data: Record<string, string>;
        }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append("title", file.file.name);
          formData.append("file", file.file);

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percent = Math.round(
                (event.loaded / event.total) * 100
              );
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === file.id ? { ...f, progress: percent } : f
                )
              );
            }
          });

          xhr.addEventListener("load", () => {
            let data = {};
            try {
              data = JSON.parse(xhr.responseText);
            } catch {
              /* ignore */
            }
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              data: data as Record<string, string>,
            });
          });

          xhr.addEventListener("error", () =>
            reject(new Error("Network error"))
          );
          xhr.addEventListener("timeout", () =>
            reject(new Error("Upload timeout"))
          );
          xhr.addEventListener("abort", () =>
            reject(new Error("Upload aborted"))
          );

          xhr.timeout = 600000;
          xhr.open("POST", "/api/media");
          xhr.send(formData);
        });

        if (result.ok) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: "completed" as const, progress: 100 }
                : f
            )
          );
        } else {
          let errorMessage =
            result.data?.error ||
            result.data?.detail ||
            "Upload failed.";

          if (result.status === 413) {
            errorMessage = "File is too large. Maximum size is 500MB.";
          } else if (result.status === 502) {
            errorMessage = result.data?.error?.includes("Backend server")
              ? result.data.error
              : "Backend server is not responding. Please check if the API server is running.";
          } else if (result.status === 504) {
            errorMessage =
              "Upload timeout. The file may be too large or the connection is slow.";
          } else if (result.status >= 500) {
            errorMessage =
              result.data?.error || "Server error. Please try again later.";
          }

          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: "error" as const, errorMessage }
                : f
            )
          );
        }
      } catch (error) {
        let errorMessage = "Upload failed. Please try again.";
        if (error instanceof Error) {
          if (
            error.message.includes("413") ||
            error.message.includes("too large")
          ) {
            errorMessage = "File is too large. Maximum size is 500MB.";
          } else if (
            error.message.includes("502") ||
            error.message.includes("Bad Gateway")
          ) {
            errorMessage =
              "Cannot connect to backend server. Please check if the API server is running.";
          } else if (
            error.message.includes("504") ||
            error.message.includes("timeout")
          ) {
            errorMessage =
              "Upload timeout. The file may be too large or the connection is slow.";
          } else if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError") ||
            error.message.includes("Network error")
          ) {
            errorMessage =
              "Network error. Please check your connection and try again.";
          } else {
            errorMessage = error.message;
          }
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: "error" as const, errorMessage }
              : f
          )
        );
      }
    }

    setUploading(false);
  };

  const isVideo = (file: File) => file.type.startsWith("video/");

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-foreground">
          Upload Media
        </h1>

        {/* Drag & Drop Zone */}
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center py-16 px-6 cursor-pointer border-2 border-dashed rounded-lg m-4 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CloudUpload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Images and videos up to 500MB
              </p>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </CardContent>
        </Card>

        {/* Selected Files */}
        {files.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Files ({files.length})
                </CardTitle>
                <Button
                  onClick={handleUpload}
                  disabled={
                    uploading ||
                    files.every((f) => f.status === "completed") ||
                    files.every((f) => f.status === "error")
                  }
                  size="sm"
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
            <CardContent className="space-y-2">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-3 rounded-md bg-secondary/50 border border-border"
                >
                  {/* Thumbnail */}
                  <div className="shrink-0">
                    {uploadFile.preview ? (
                      <img
                        src={uploadFile.preview}
                        alt={uploadFile.file.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : isVideo(uploadFile.file) ? (
                      <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
                        <FileVideo className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
                        <FileImage className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {uploadFile.file.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          uploadFile.status === "completed"
                            ? "border-green-500/40 text-green-400 text-xs"
                            : uploadFile.status === "uploading"
                              ? "border-primary/40 text-primary text-xs"
                              : uploadFile.status === "error"
                                ? "border-destructive/40 text-destructive text-xs"
                                : "text-xs"
                        }
                      >
                        {uploadFile.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.file.size)}
                    </p>

                    {uploadFile.status === "error" &&
                      uploadFile.errorMessage && (
                        <p className="text-xs text-destructive mt-1">
                          {uploadFile.errorMessage}
                        </p>
                      )}

                    {uploadFile.status === "uploading" && (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress
                          value={uploadFile.progress}
                          className="h-1.5 flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {uploadFile.progress}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(uploadFile.id)}
                    disabled={uploading}
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Maximum file size: 500MB per file</p>
          <p>
            Supported formats: MP4, MOV, AVI, MKV, WebM, JPG, PNG, GIF, WebP,
            SVG
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
