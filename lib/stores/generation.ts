import { create } from 'zustand'

export type SceneGenStatus =
  | 'idle'
  | 'uploading'
  | 'generating_image'
  | 'generating_video'
  | 'completed'
  | 'failed'

export interface SceneGenState {
  status: SceneGenStatus
  taskId?: string
  /** Uploaded reference image URL (image_text_to_video) or AI-generated image URL (image_to_video) */
  imageUrl?: string
  videoUrl?: string
  error?: string
}

interface GenerationStore {
  scenes: Record<string, SceneGenState>
  isGenerating: boolean
  setSceneState: (sceneId: string, state: Partial<SceneGenState>) => void
  setIsGenerating: (value: boolean) => void
  reset: () => void
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  scenes: {},
  isGenerating: false,

  setSceneState: (sceneId, state) =>
    set((prev) => ({
      scenes: {
        ...prev.scenes,
        [sceneId]: { ...(prev.scenes[sceneId] ?? { status: 'idle' }), ...state },
      },
    })),

  setIsGenerating: (value) => set({ isGenerating: value }),

  reset: () => set({ scenes: {}, isGenerating: false }),
}))
