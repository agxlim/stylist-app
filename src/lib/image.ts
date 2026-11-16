// Browser-side photo preparation. Every photo is decoded, resized and re-encoded
// as JPEG before upload, which:
//   * strips EXIF metadata, including GPS location
//   * normalizes iPhone HEIC photos (where the browser can decode them) and rotation
//   * keeps uploads small (AI vision models don't benefit beyond ~1568px)

export const MAX_EDGE = 1568
export const MIN_SHORT_EDGE = 400
export const JPEG_QUALITY = 0.82
export const MAX_INPUT_BYTES = 30 * 1024 * 1024

export class ImageError extends Error {}

/** Scale (w, h) down so the long edge is at most `maxEdge`. Never upscales. */
export function fitWithin(width: number, height: number, maxEdge = MAX_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export function checkInputFile(file: { type: string; size: number; name: string }) {
  const looksLikeImage =
    file.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp)$/i.test(file.name)
  if (!looksLikeImage) throw new ImageError('That file isn’t a photo. Please choose an image.')
  if (file.size > MAX_INPUT_BYTES) throw new ImageError('That photo is too large (over 30 MB).')
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() }
    } catch {
      // Fall through to <img>, which handles more formats on some browsers (e.g. HEIC on Safari).
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} }
  } catch {
    throw new ImageError(
      'We couldn’t read this photo. Try taking a new one, or choose a JPEG or PNG.',
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

export interface PreparedImage {
  blob: Blob
  width: number
  height: number
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  checkInputFile(file)
  const decoded = await decode(file)
  try {
    if (Math.min(decoded.width, decoded.height) < MIN_SHORT_EDGE) {
      throw new ImageError('This photo is too small. Please use a clearer, higher-resolution photo.')
    }
    const { width, height } = fitWithin(decoded.width, decoded.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageError('Your browser couldn’t process this photo.')
    ctx.drawImage(decoded.source, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    if (!blob) throw new ImageError('Your browser couldn’t process this photo.')
    return { blob, width, height }
  } finally {
    decoded.close()
  }
}
