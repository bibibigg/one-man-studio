import { createHmac } from 'crypto'

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface VideoJobStatus {
  status: 'processing' | 'completed' | 'failed'
  videoUrl?: string
  error?: string
}

// mode tells the provider which type of job it was (providers may route differently)
type VideoJobMode = 'text_to_video' | 'image_to_video'

interface VideoProvider {
  createTextToVideoJob(prompt: string, durationFrames: number): Promise<string>
  createImageToVideoJob(imageUrl: string, prompt: string, durationFrames: number): Promise<string>
  getJobStatus(taskId: string, mode: VideoJobMode): Promise<VideoJobStatus>
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function getVideoProvider(): VideoProvider {
  const provider = process.env.VIDEO_GENERATION_PROVIDER ?? 'kling'
  if (provider === 'kling') return new KlingProvider()
  // if (provider === 'seedance') return new SeedanceProvider()
  throw new Error(`Unknown VIDEO_GENERATION_PROVIDER: "${provider}"`)
}

// Convenience wrappers (used by API routes)
export async function createTextToVideoJob(
  prompt: string,
  durationFrames: number
): Promise<string> {
  return getVideoProvider().createTextToVideoJob(prompt, durationFrames)
}

export async function createImageToVideoJob(
  imageUrl: string,
  prompt: string,
  durationFrames: number
): Promise<string> {
  return getVideoProvider().createImageToVideoJob(imageUrl, prompt, durationFrames)
}

export async function getVideoJobStatus(
  taskId: string,
  mode: VideoJobMode
): Promise<VideoJobStatus> {
  return getVideoProvider().getJobStatus(taskId, mode)
}

// ─── Kling Provider ───────────────────────────────────────────────────────────

const KLING_BASE_URL = 'https://api.klingai.com'

interface KlingTaskResponse {
  code: number
  message: string
  data: { task_id: string; task_status: string }
}

interface KlingStatusResponse {
  code: number
  message: string
  data: {
    task_id: string
    task_status: 'submitted' | 'processing' | 'succeed' | 'failed'
    task_status_msg?: string
    task_result?: { videos?: Array<{ id: string; url: string; duration: string }> }
  }
}

class KlingProvider implements VideoProvider {
  private createToken(): string {
    const apiKey = process.env.KLING_API_KEY
    const apiSecret = process.env.KLING_API_SECRET
    if (!apiKey || !apiSecret) throw new Error('KLING_API_KEY and KLING_API_SECRET are required')

    const now = Math.floor(Date.now() / 1000)
    const header = this.b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = this.b64url(
      JSON.stringify({ iss: apiKey, iat: now, nbf: now - 5, exp: now + 1800 })
    )
    const data = `${header}.${payload}`
    const sig = this.b64url(createHmac('sha256', apiSecret).update(data).digest())
    return `${data}.${sig}`
  }

  private b64url(input: string | Buffer): string {
    const b64 = Buffer.isBuffer(input)
      ? input.toString('base64')
      : Buffer.from(input).toString('base64')
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  private async post(path: string, body: unknown): Promise<KlingTaskResponse> {
    const res = await fetch(`${KLING_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.createToken()}` },
      body: JSON.stringify(body),
    })
    const data = (await res.json()) as KlingTaskResponse
    if (data.code !== 0) throw new Error(data.message ?? 'Kling API error')
    return data
  }

  private async get(path: string): Promise<KlingStatusResponse> {
    const res = await fetch(`${KLING_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${this.createToken()}` },
    })
    const data = (await res.json()) as KlingStatusResponse
    if (data.code !== 0) throw new Error(data.message ?? 'Kling API error')
    return data
  }

  private toDuration(durationFrames: number): '5' | '10' {
    return Math.round(durationFrames / 30) >= 8 ? '10' : '5'
  }

  async createTextToVideoJob(prompt: string, durationFrames: number): Promise<string> {
    const res = await this.post('/v1/videos/text2video', {
      model_name: 'kling-v3',
      prompt,
      mode: 'std',
      duration: this.toDuration(durationFrames),
    })
    return res.data.task_id
  }

  async createImageToVideoJob(
    imageUrl: string,
    prompt: string,
    durationFrames: number
  ): Promise<string> {
    const res = await this.post('/v1/videos/image2video', {
      model_name: 'kling-v3',
      image: imageUrl,
      prompt,
      mode: 'std',
      duration: this.toDuration(durationFrames),
    })
    return res.data.task_id
  }

  async getJobStatus(taskId: string, mode: VideoJobMode): Promise<VideoJobStatus> {
    const endpoint =
      mode === 'text_to_video'
        ? `/v1/videos/text2video/${taskId}`
        : `/v1/videos/image2video/${taskId}`
    const res = await this.get(endpoint)
    const { task_status, task_status_msg, task_result } = res.data

    if (task_status === 'succeed') {
      return { status: 'completed', videoUrl: task_result?.videos?.[0]?.url }
    }
    if (task_status === 'failed') {
      return { status: 'failed', error: task_status_msg ?? 'Generation failed' }
    }
    return { status: 'processing' }
  }
}

// ─── Seedance Provider (stub — uncomment when adding Seedance support) ────────
//
// class SeedanceProvider implements VideoProvider {
//   async createTextToVideoJob(prompt: string, durationFrames: number): Promise<string> {
//     throw new Error('Seedance provider not yet implemented')
//   }
//   async createImageToVideoJob(imageUrl: string, prompt: string, durationFrames: number): Promise<string> {
//     throw new Error('Seedance provider not yet implemented')
//   }
//   async getJobStatus(taskId: string, _mode: VideoJobMode): Promise<VideoJobStatus> {
//     throw new Error('Seedance provider not yet implemented')
//   }
// }
