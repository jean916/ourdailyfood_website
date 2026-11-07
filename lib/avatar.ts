import { supabase } from "@/lib/supabase";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function checkAvatarFile(file: File): string | null {
  if (!AVATAR_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG or WebP image.";
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return "The image is too large. Please choose one under 5 MB.";
  }

  return null;
}

// Crops the photo to a square and shrinks it to 400x400 so uploads are small and fast.
export async function squareJpeg(file: File, size = 400): Promise<Blob> {
  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("The image could not be read."));
      img.src = url;
    });

    const side = Math.min(image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser cannot process images.");

    context.drawImage(
      image,
      (image.width - side) / 2,
      (image.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size
    );

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("The image could not be prepared.")),
        "image/jpeg",
        0.85
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Uploads the photo to the "avatars" bucket and returns its public address.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const blob = await squareJpeg(file);
  const path = `${userId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { contentType: "image/jpeg", cacheControl: "3600" });

  if (error) throw new Error("The photo could not be uploaded.");

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
