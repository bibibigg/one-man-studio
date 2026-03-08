import type { Scene, GenerationMode, TransitionType, MotionEffect } from './scene'

/** Lightweight scene shape used by the generation workspace and editor page */
export interface EditorScene {
  id: string
  orderIndex: number
  description: string
  visualPrompt: string
  generationMode: GenerationMode
  referenceImageUrl: string | null
  /** AI-generated intermediate image (image_to_video mode) */
  generatedImageUrl: string | null
  videoUrl: string | null
  durationFrames: number
}

export interface EditorState {
  projectId: string
  scenes: Scene[]
  currentSceneId?: string
  isPlaying: boolean
  currentFrame: number
  totalFrames: number
}

export interface EditorSceneUpdate {
  sceneId: string
  durationFrames?: number
  transitionType?: TransitionType
  transitionDurationFrames?: number
  motionEffect?: MotionEffect
  motionParams?: Record<string, unknown>
}

export interface RenderProgress {
  status: 'idle' | 'rendering' | 'uploading' | 'completed' | 'failed'
  progress: number
  errorMessage?: string
}
