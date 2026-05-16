import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

const BUCKET = 'community-posts';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Durée des URLs signées affichées dans le fil (1 h). */
export const COMMUNITY_SIGNED_URL_TTL_SEC = 60 * 60;

const UUID_FOLDER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[^/]+$/i;

export type CommunityImageUploadResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

/**
 * Extrait le chemin storage (`{userId}/{file}.jpg`) depuis un path ou une URL legacy.
 */
export function extractCommunityStoragePath(pathOrUrl: string): string | null {
  if (!pathOrUrl?.trim()) return null;
  const raw = pathOrUrl.trim();
  if (!/^https?:\/\//i.test(raw)) {
    const path = raw.replace(/^\/+/, '');
    return UUID_FOLDER.test(path) ? path : null;
  }
  const m = raw.match(
    /\/storage\/v1\/object\/(?:public|sign)\/community-posts\/([^?]+)/i,
  );
  if (!m?.[1]) return null;
  try {
    const path = decodeURIComponent(m[1]);
    return UUID_FOLDER.test(path) ? path : null;
  } catch {
    return null;
  }
}

/**
 * URL signée pour afficher une photo (bucket privé).
 * Accepte un path storage ou une ancienne URL publique/signée.
 */
export async function getCommunityImageSignedUrl(
  pathOrLegacyUrl: string,
): Promise<string | null> {
  const path = extractCommunityStoragePath(pathOrLegacyUrl);
  if (!path) {
    if (/^https?:\/\//i.test(pathOrLegacyUrl)) return pathOrLegacyUrl;
    return null;
  }
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, COMMUNITY_SIGNED_URL_TTL_SEC);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Compresse et envoie une photo de post communauté dans
 * `community-posts/{userId}/{timestamp}.jpg` (aligné RLS Supabase).
 * En base : stocker `path`, pas l’URL.
 */
export async function uploadCommunityPostImage(
  userId: string,
  localUri: string,
): Promise<CommunityImageUploadResult> {
  if (!userId) {
    return { ok: false, error: 'Utilisatrice non identifiée.' };
  }

  try {
    const resized = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: 1200 } }],
      { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
    );

    const res = await fetch(resized.uri);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_UPLOAD_BYTES) {
      return {
        ok: false,
        error: `Image trop lourde (${Math.round(buf.byteLength / 1024)} Ko, max 5 Mo).`,
      };
    }

    const path = `${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, new Uint8Array(buf), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      if (/row-level security|policy/i.test(error.message)) {
        return {
          ok: false,
          error:
            "Upload refusé. Exécute le script « security-community-storage.sql » dans Supabase (policies storage).",
        };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true, path };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Vérifie qu’une image (path ou URL) appartient au dossier storage de l’utilisatrice. */
export function isCommunityImageOwnedByUser(
  pathOrUrl: string,
  userId: string,
): boolean {
  if (!pathOrUrl || !userId) return false;
  const path = extractCommunityStoragePath(pathOrUrl);
  if (path) return path.startsWith(`${userId}/`);
  return pathOrUrl.includes(`/community-posts/${userId}/`);
}
