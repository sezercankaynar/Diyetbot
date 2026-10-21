// A photo for Claude: read, scaled down (long side ≤ 1280 px) and re-encoded as JPEG, so requests stay
// small and fast. Returns the base64 data and a preview URL.

export interface AiImage {
  data: string
  mediaType: 'image/jpeg'
  preview: string
}

export async function fileToImage(file: File, max = 1280): Promise<AiImage> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('Fotoğraf açılamadı.'))
      i.src = url
    })
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * k)
    canvas.height = Math.round(img.naturalHeight * k)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    const preview = canvas.toDataURL('image/jpeg', 0.82)
    return { data: preview.slice(preview.indexOf(',') + 1), mediaType: 'image/jpeg', preview }
  } finally {
    URL.revokeObjectURL(url)
  }
}
