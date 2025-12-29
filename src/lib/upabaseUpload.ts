// src/lib/supabaseUpload.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadProductImage(
  blob: Blob,
  opts?: { bucket?: string; folder?: string }
) {
  const bucket = opts?.bucket ?? "product-images";
  const folder = opts?.folder ?? "products";

  const ext = "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const path = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: "image/jpeg",
      upsert: false,
      cacheControl: "3600",
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Failed to get public URL");

  return { publicUrl: data.publicUrl, path };
}