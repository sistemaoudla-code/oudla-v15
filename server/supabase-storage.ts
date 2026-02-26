import { createClient, SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "uploads";

let client: SupabaseClient | null = null;
let initialized = false;

function getClient(): SupabaseClient | null {
  if (initialized) return client;
  initialized = true;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn("⚠️ Supabase Storage desativado: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos");
    return null;
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  console.log("✅ Supabase Storage ativo (bucket:", BUCKET_NAME + ")");
  return client;
}

export function isStorageEnabled(): boolean {
  return !!getClient();
}

export async function uploadToStorage(
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<string> {
  const supabase = getClient();
  if (!supabase) {
    throw new Error("Supabase Storage não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }

  const filePath = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function deleteFromStorage(imageUrl: string): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;

  if (imageUrl.startsWith("/uploads/") || imageUrl.startsWith("/reviews/")) {
    return;
  }

  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
    if (pathParts.length < 2) return;

    const filePath = decodeURIComponent(pathParts[1]);
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("Supabase Storage delete error:", error);
    }
  } catch (err) {
    console.error("Error parsing storage URL for deletion:", err);
  }
}
