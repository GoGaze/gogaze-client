"use client";

import { useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileVideo, FileImage, Loader2, CloudUpload, RotateCw } from "lucide-react";
import { formatFileSize } from "@/lib/api";

interface UploadFile {
  id: string;
  file: File;
  title: string;
  preview?: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  errorMessage?: string;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024;
let idCounter = 0;

function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

/** Validate a file client-side; returns an error message or null. */
function validate(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File size (${formatFileSize(file.size)}) exceeds the ${formatFileSize(MAX_FILE_SIZE)} limit.`;
  }
  // An empty type can happen for some containers; let the backend's magic-byte
  // check be the authority there. Only reject clearly non-media types.
  if (file.type && !file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return `Unsupported file type (${file.type}). Only images and videos are allowed.`;
  }
  return null;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // Latest files, readable inside uploadOne so a title edited mid-batch is sent.
  const filesRef = useRef<UploadFile[]>(files);
  filesRef.current = files;

  const processFiles = (fileList: File[]) => {
    const newFiles: UploadFile[] = fileList.map((file) => {
      const errorMessage = validate(file);
      return {
        id: `f${++idCounter}`,
        file,
        title: stripExtension(file.name),
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        progress: 0,
        status: errorMessage ? ("error" as const) : ("pending" as const),
        errorMessage: errorMessage ?? undefined,
      };
    });
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const setTitle = (id: string, title: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, title } : f)));
  };

  const patch = (id: string, changes: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...changes } : f)));
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
    // Validate dropped files (the `accept` attribute does NOT apply to drops).
    processFiles(Array.from(e.dataTransfer.files));
  };

  const uploadOne = (uploadFile: UploadFile): Promise<void> =>
    new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      // Read the latest title (it may have been edited while queued).
      const latest = filesRef.current.find((f) => f.id === uploadFile.id);
      const title = (latest?.title ?? uploadFile.title).trim() || uploadFile.file.name;
      formData.append("title", title);
      formData.append("file", uploadFile.file);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          patch(uploadFile.id, { progress: Math.round((event.loaded / event.total) * 100) });
        }
      });

      const fail = (message: string) => {
        patch(uploadFile.id, { status: "error", errorMessage: message });
        resolve();
      };

      xhr.addEventListener("load", () => {
        let data: Record<string, string> = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          /* ignore */
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          patch(uploadFile.id, { status: "completed", progress: 100, errorMessage: undefined });
          resolve();
        } else if (xhr.status === 413) {
          fail("File is too large. Maximum size is 500MB.");
        } else if (xhr.status === 502) {
          fail("Backend server is not responding.");
        } else if (xhr.status === 504) {
          fail("Upload timed out — the file may be too large or the connection slow.");
        } else {
          fail(data?.error || data?.detail || `Upload failed (HTTP ${xhr.status}).`);
        }
      });
      xhr.addEventListener("error", () => fail("Network error. Check your connection and try again."));
      xhr.addEventListener("timeout", () => fail("Upload timed out."));
      xhr.addEventListener("abort", () => fail("Upload aborted."));

      xhr.timeout = 600000;
      xhr.open("POST", "/api/media");
      patch(uploadFile.id, { status: "uploading", progress: 0, errorMessage: undefined });
      xhr.send(formData);
    });

  const handleUpload = async () => {
    setUploading(true);
    // Snapshot of pending files at click time.
    const pending = files.filter((f) => f.status === "pending");
    for (const f of pending) {
      await uploadOne(f);
    }
    setUploading(false);
  };

  const retryFile = async (id: string) => {
    const target = files.find((f) => f.id === id);
    if (!target) return;
    const err = validate(target.file);
    if (err) {
      patch(id, { status: "error", errorMessage: err });
      return;
    }
    setUploading(true);
    await uploadOne(target);
    setUploading(false);
  };

  const hasPending = files.some((f) => f.status === "pending");
  const isVideo = (file: File) => file.type.startsWith("video/");

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 lg:p-8">
        <h1 className="text-2xl font-semibold text-foreground">Upload Media</h1>

        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <label
              htmlFor="file-upload"
              className={`m-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-16 transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CloudUpload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium text-foreground">
                Drag &amp; drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">Images and videos up to 500MB</p>
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

        {files.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Files ({files.length})</CardTitle>
                <Button onClick={handleUpload} disabled={uploading || !hasPending} size="sm">
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Upload All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 p-3"
                >
                  <div className="shrink-0">
                    {uploadFile.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={uploadFile.preview} alt={uploadFile.title} className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-primary/10">
                        {isVideo(uploadFile.file) ? (
                          <FileVideo className="h-5 w-5 text-primary" />
                        ) : (
                          <FileImage className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Input
                        value={uploadFile.title}
                        onChange={(e) => setTitle(uploadFile.id, e.target.value)}
                        disabled={uploadFile.status === "uploading" || uploadFile.status === "completed"}
                        className="h-7 flex-1 bg-background text-sm"
                        aria-label="Title"
                      />
                      <Badge
                        variant="outline"
                        className={
                          uploadFile.status === "completed"
                            ? "border-green-500/40 text-xs text-green-400"
                            : uploadFile.status === "uploading"
                              ? "border-primary/40 text-xs text-primary"
                              : uploadFile.status === "error"
                                ? "border-destructive/40 text-xs text-destructive"
                                : "text-xs"
                        }
                      >
                        {uploadFile.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {uploadFile.file.name} · {formatFileSize(uploadFile.file.size)}
                    </p>

                    {uploadFile.status === "error" && uploadFile.errorMessage && (
                      <p className="mt-1 text-xs text-destructive">{uploadFile.errorMessage}</p>
                    )}

                    {uploadFile.status === "uploading" && (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={uploadFile.progress} className="h-1.5 flex-1" />
                        <span className="w-8 text-right text-xs text-muted-foreground">
                          {uploadFile.progress}%
                        </span>
                      </div>
                    )}
                  </div>

                  {uploadFile.status === "error" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => retryFile(uploadFile.id)}
                      disabled={uploading}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Retry"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(uploadFile.id)}
                    disabled={uploadFile.status === "uploading"}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Maximum file size: 500MB per file</p>
          <p>Supported formats: MP4, MOV, AVI, MKV, WebM, JPG, PNG, GIF, WebP, BMP</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
