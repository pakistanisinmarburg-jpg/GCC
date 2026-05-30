import { supabase } from "./supabase";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function validateImage(file: File) {
  if (!ALLOWED.includes(file.type)) throw new Error("Only JPEG, PNG or WebP images are allowed.");
  if (file.size > MAX_BYTES) throw new Error("Image must be 5MB or smaller.");
}

export async function uploadImage(bucket: string, file: File, prefix = ""): Promise<string> {
  validateImage(file);
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${prefix ? prefix.replace(/\/$/, "") + "/" : ""}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadFile(bucket: string, file: File, prefix = ""): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${prefix ? prefix.replace(/\/$/, "") + "/" : ""}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
