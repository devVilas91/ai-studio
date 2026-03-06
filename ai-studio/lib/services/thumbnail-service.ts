import sharp from "sharp";
import { uploadToStorage } from "../storage/supabase-storage";

export interface ThumbnailOptions {
  width: number;
  height: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  format?: "png" | "jpeg" | "webp";
}

export async function generateThumbnail(
  fileBuffer: Buffer,
  options: ThumbnailOptions = { width: 300, height: 300, fit: "cover", format: "jpeg" }
): Promise<Buffer> {
  return sharp(fileBuffer)
    .resize(options.width, options.height, { fit: options.fit })
    .toFormat(options.format || "jpeg", { quality: 80 })
    .toBuffer();
}

export async function processAndStoreThumbnail(
  assetId: string,
  fileBuffer: Buffer,
  originalFilename: string,
  projectId: string
): Promise<{ thumbnailUrl: string }> {
  // Generate thumbnail
  const thumbnailBuffer = await generateThumbnail(fileBuffer, {
    width: 300,
    height: 300,
    fit: "cover",
    format: "jpeg",
  });

  // Generate thumbnail filename
  const thumbnailFilename = `thumbnails/${projectId}/${assetId}-${Date.now()}.jpg`;

  // Upload to Supabase Storage
  const thumbnailUrl = await uploadToStorage(
    "thumbnails",
    thumbnailFilename,
    thumbnailBuffer,
    "image/jpeg"
  );

  return { thumbnailUrl };
}
