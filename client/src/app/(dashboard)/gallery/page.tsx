import { getMediaFiles } from "@/lib/server-api";
import { GalleryClient } from "./GalleryClient";

export default async function GalleryPage() {
  const mediaFiles = await getMediaFiles();

  return <GalleryClient mediaFiles={mediaFiles} />;
}
