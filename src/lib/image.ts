/**
 * Client-only. Resizes an image file down to fit maxDimension×maxDimension and
 * re-encodes it as JPEG before upload — a profile photo shot on a phone camera
 * can easily be 4-8MB; nobody on paid mobile data should have to upload that
 * to look right at 96px in a directory row. No dependency: createImageBitmap
 * and canvas are native browser APIs.
 */
export async function resizeImageToJpeg(
  file: File,
  maxDimension: number,
  quality = 0.85
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('canvas-2d-unavailable')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob-failed'))),
      'image/jpeg',
      quality
    )
  })
}
