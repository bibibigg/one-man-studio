import type { GenerationMode } from './scene'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface GenerationJob {
  jobId: string
  sceneId: string
  mode: GenerationMode
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  resultUrl?: string
  errorMessage?: string
}

export interface GenerateVideoRequest {
  sceneId: string
  mode: GenerationMode
  prompt: string
  imageUrl?: string
  stylePrompt?: string
}

export interface GenerateImageRequest {
  sceneId: string
  prompt: string
  stylePrompt?: string
}

export interface UploadResponse {
  url: string
  path: string
}
