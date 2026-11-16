import { PHOTO_BUCKET, supabase } from './supabase'

export type PhotoFolder = 'selfie' | 'body' | 'outfit' | 'chat'

/** Storage path convention enforced by RLS: {user_id}/{folder}/{uuid}.jpg */
export function photoPath(userId: string, folder: PhotoFolder, id = crypto.randomUUID()) {
  return `${userId}/${folder}/${id}.jpg`
}

export async function uploadPhoto(userId: string, folder: PhotoFolder, blob: Blob) {
  const path = photoPath(userId, folder)
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return path
}

export async function deletePhotos(paths: string[]) {
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths)
  if (error) throw error
}

export async function signedUrl(path: string, seconds = 600) {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, seconds)
  if (error) throw error
  return data.signedUrl
}

export interface StoredPhoto {
  path: string
  folder: PhotoFolder
  createdAt: string
}

/** Lists the user's photos in the given folders, newest first. */
export async function listPhotos(userId: string, folders: PhotoFolder[]): Promise<StoredPhoto[]> {
  const results = await Promise.all(
    folders.map(async (folder) => {
      const { data, error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .list(`${userId}/${folder}`, { sortBy: { column: 'created_at', order: 'desc' } })
      if (error) throw error
      return (data ?? [])
        .filter((f) => f.name.endsWith('.jpg'))
        .map((f) => ({
          path: `${userId}/${folder}/${f.name}`,
          folder,
          createdAt: f.created_at ?? '',
        }))
    }),
  )
  return results.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
