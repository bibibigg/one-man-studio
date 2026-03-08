// ─── Shared types ─────────────────────────────────────────────────────────────

export interface GeneratedImage {
  base64: string
  mimeType: string
}

interface ImageProvider {
  generateImage(prompt: string): Promise<GeneratedImage>
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function getImageProvider(): ImageProvider {
  const provider = process.env.IMAGE_GENERATION_PROVIDER ?? 'imagen3'
  if (provider === 'imagen3') return new Imagen3Provider()
  // if (provider === 'flux') return new FluxProvider()
  throw new Error(`Unknown IMAGE_GENERATION_PROVIDER: "${provider}"`)
}

// Convenience wrapper (used by API routes)
export async function generateImage(prompt: string): Promise<GeneratedImage> {
  return getImageProvider().generateImage(prompt)
}

// ─── Google Imagen 3 Provider ─────────────────────────────────────────────────

class Imagen3Provider implements ImageProvider {
  async generateImage(prompt: string): Promise<GeneratedImage> {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('GOOGLE_API_KEY is required')

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
      }
    )

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      throw new Error(err?.error?.message ?? `Imagen 3 request failed (${res.status})`)
    }

    const data = (await res.json()) as {
      predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>
    }
    const prediction = data.predictions?.[0]
    if (!prediction?.bytesBase64Encoded) throw new Error('No image in Imagen 3 response')

    return {
      base64: prediction.bytesBase64Encoded,
      mimeType: prediction.mimeType ?? 'image/png',
    }
  }
}

// ─── Flux Provider (stub — uncomment when adding Flux/Replicate support) ──────
//
// class FluxProvider implements ImageProvider {
//   async generateImage(prompt: string): Promise<GeneratedImage> {
//     throw new Error('Flux provider not yet implemented')
//   }
// }
