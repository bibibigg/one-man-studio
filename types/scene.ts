export type GenerationMode =
  | 'text_to_video'
  | 'image_to_video'
  | 'image_text_to_video'

export type SceneStatus =
  | 'pending'
  | 'generating_image'
  | 'generating_video'
  | 'completed'
  | 'failed'

export type TransitionType =
  | 'crossfade'
  | 'fade-black'
  | 'slide-left'
  | 'slide-right'
  | 'none'

export type MotionEffect =
  | 'ken-burns'
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'none'

export interface Scene {
  id: string
  projectId: string
  orderIndex: number
  description: string
  visualPrompt: string
  generationMode: GenerationMode
  referenceImageUrl?: string
  generatedImageUrl?: string
  videoUrl?: string
  durationFrames: number
  motionEffect: MotionEffect
  motionParams?: Record<string, unknown>
  transitionType: TransitionType
  transitionDurationFrames: number
  status: SceneStatus
  generationAttempts: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface CreateSceneData {
  projectId: string
  orderIndex: number
  description: string
  visualPrompt: string
  generationMode?: GenerationMode
  durationFrames?: number
}

export interface UpdateSceneData {
  description?: string
  visualPrompt?: string
  generationMode?: GenerationMode
  referenceImageUrl?: string
  generatedImageUrl?: string
  videoUrl?: string
  durationFrames?: number
  motionEffect?: MotionEffect
  motionParams?: Record<string, unknown>
  transitionType?: TransitionType
  transitionDurationFrames?: number
  status?: SceneStatus
  errorMessage?: string
}

export interface SceneAnalysisResult {
  sceneNumber: number
  description: string
  visualPrompt: string
  duration: number
}
